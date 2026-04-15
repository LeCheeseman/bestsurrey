-- bestsurrey.co.uk — initial schema migration
-- Run via: npm run db:migrate
--
-- Key decisions documented inline:
--  - Enums for stable finite-state fields
--  - Unique constraints on all slug columns
--  - Cross-table slug collision trigger for towns ↔ categories (shared URL namespace)
--  - Ranking score updated by trigger on ranking input changes
--  - FTS index on listings for PostgreSQL full-text search (Phase 4)
--  - RLS policies: public reads published content; writes require authenticated session


-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE listing_status AS ENUM ('draft', 'review', 'published', 'unpublished');
CREATE TYPE entity_type    AS ENUM ('restaurant', 'cafe', 'attraction', 'activity-venue', 'place');
CREATE TYPE roundup_status AS ENUM ('draft', 'review', 'published', 'unpublished');
CREATE TYPE parking_type   AS ENUM ('free', 'paid', 'street', 'none');
CREATE TYPE price_band     AS ENUM ('£', '££', '£££', '££££');
CREATE TYPE category_town_status AS ENUM ('draft', 'published');


-- ─── Taxonomy ─────────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  description      TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  icon             TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

CREATE TABLE subcategories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  description      TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subcategories_slug_unique UNIQUE (slug)
);

CREATE TABLE towns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  county           TEXT NOT NULL DEFAULT 'Surrey',
  region           TEXT,
  description      TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  latitude         NUMERIC(9,6),
  longitude        NUMERIC(9,6),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT towns_slug_unique UNIQUE (slug)
);

CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tags_slug_unique UNIQUE (slug)
);


-- ─── Slug collision prevention ────────────────────────────────────────────────
-- Towns and categories share the top-level URL namespace (/guildford/, /restaurants/).
-- A slug that exists in both tables would silently break one of the two routes.
-- This trigger prevents that at the database level.
-- The same check is also enforced at module load time in src/lib/taxonomy/validation.ts.

CREATE OR REPLACE FUNCTION check_town_category_slug_collision()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'categories' THEN
    IF EXISTS (SELECT 1 FROM towns WHERE slug = NEW.slug) THEN
      RAISE EXCEPTION
        'Slug "%" already exists in the towns table. Town and category slugs must be unique '
        'across both tables because they share the top-level URL namespace.',
        NEW.slug;
    END IF;
  ELSIF TG_TABLE_NAME = 'towns' THEN
    IF EXISTS (SELECT 1 FROM categories WHERE slug = NEW.slug) THEN
      RAISE EXCEPTION
        'Slug "%" already exists in the categories table. Town and category slugs must be unique '
        'across both tables because they share the top-level URL namespace.',
        NEW.slug;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_town_category_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON categories
  FOR EACH ROW EXECUTE FUNCTION check_town_category_slug_collision();

CREATE TRIGGER enforce_town_category_slug_uniqueness_towns
  BEFORE INSERT OR UPDATE OF slug ON towns
  FOR EACH ROW EXECUTE FUNCTION check_town_category_slug_collision();


-- ─── Listings ─────────────────────────────────────────────────────────────────

CREATE TABLE listings (
  -- Identity
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL,
  entity_type           entity_type NOT NULL,
  primary_category_id   UUID NOT NULL REFERENCES categories(id),
  town_id               UUID NOT NULL REFERENCES towns(id),

  -- Location
  address_line1   TEXT,
  address_line2   TEXT,
  postcode        TEXT,
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),

  -- Contact
  website_url  TEXT,
  phone_number TEXT,

  -- Structured attributes
  family_friendly        BOOLEAN,
  dog_friendly           BOOLEAN,
  vegan_friendly         BOOLEAN,
  vegetarian_friendly    BOOLEAN,
  wheelchair_accessible  BOOLEAN,
  indoor                 BOOLEAN,
  outdoor                BOOLEAN,
  good_for_groups        BOOLEAN,
  booking_required       BOOLEAN,
  parking                parking_type,
  price_band             price_band,
  age_suitability        TEXT,

  -- Content
  short_summary    TEXT,
  long_description TEXT,
  highlights       TEXT[],
  why_we_like_it   TEXT,
  best_for         TEXT[],
  faq              JSONB,       -- [{question, answer}]
  opening_hours    JSONB,       -- {monday: {open, close} | {closed: true} | null, ...}
  images           JSONB,       -- [{url, alt, caption, isPrimary}]
  amenities        TEXT[],

  -- Ranking inputs (editable by admin)
  review_score        NUMERIC(3,2),
  review_count        INTEGER NOT NULL DEFAULT 0,
  editorial_score     INTEGER NOT NULL DEFAULT 5 CHECK (editorial_score BETWEEN 0 AND 10),
  category_fit_score  INTEGER NOT NULL DEFAULT 5 CHECK (category_fit_score BETWEEN 0 AND 10),
  completeness_score  INTEGER NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),

  -- Computed ranking score (updated by trigger below)
  ranking_score       NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- Admin / editorial
  status          listing_status NOT NULL DEFAULT 'draft',
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  sponsored       BOOLEAN NOT NULL DEFAULT FALSE,
  editorial_notes TEXT,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  CONSTRAINT listings_slug_unique    UNIQUE (slug),
  CONSTRAINT listings_review_score   CHECK (review_score IS NULL OR review_score BETWEEN 0 AND 5)
);

-- Indexes for common query patterns
CREATE INDEX listings_town_idx          ON listings(town_id);
CREATE INDEX listings_category_idx      ON listings(primary_category_id);
CREATE INDEX listings_status_idx        ON listings(status);
CREATE INDEX listings_ranking_idx       ON listings(ranking_score DESC);
CREATE INDEX listings_town_category_idx ON listings(town_id, primary_category_id);
CREATE INDEX listings_featured_idx      ON listings(featured) WHERE featured = TRUE;

-- Full-text search index (used in Phase 4; created now so it builds incrementally)
CREATE INDEX listings_fts_idx ON listings
  USING gin(
    to_tsvector('english',
      name || ' ' ||
      COALESCE(short_summary, '') || ' ' ||
      COALESCE(long_description, '')
    )
  );


-- ─── Ranking score trigger ────────────────────────────────────────────────────
-- Recomputes ranking_score whenever any ranking input changes.
-- Formula mirrors src/lib/ranking.ts — if you change one, update both.
--
-- Weights:  30% review avg | 25% review count | 25% editorial | 10% category fit | 10% completeness
-- Review count cap: 500 (prevents very large chains dominating)

CREATE OR REPLACE FUNCTION compute_ranking_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ranking_score :=
    LEAST(COALESCE(NEW.review_score, 0) / 5.0, 1.0)              * 30 +
    LEAST(COALESCE(NEW.review_count, 0)::FLOAT / 500.0, 1.0)     * 25 +
    (COALESCE(NEW.editorial_score, 5)   / 10.0)                  * 25 +
    (COALESCE(NEW.category_fit_score, 5) / 10.0)                 * 10 +
    (COALESCE(NEW.completeness_score, 0) / 100.0)                * 10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ranking_score
  BEFORE INSERT OR UPDATE OF
    review_score, review_count, editorial_score, category_fit_score, completeness_score
  ON listings
  FOR EACH ROW EXECUTE FUNCTION compute_ranking_score();


-- ─── Updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at    BEFORE UPDATE ON listings    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_updated_at  BEFORE UPDATE ON categories  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER towns_updated_at       BEFORE UPDATE ON towns       FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── Junction tables ──────────────────────────────────────────────────────────

CREATE TABLE listing_subcategories (
  listing_id     UUID NOT NULL REFERENCES listings(id)     ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, subcategory_id)
);

CREATE TABLE listing_tags (
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (listing_id, tag_id)
);


-- ─── Roundups ─────────────────────────────────────────────────────────────────

CREATE TABLE roundups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL,
  intro            TEXT,
  body             JSONB,       -- [{type: 'text'|'heading', content}]
  meta_title       TEXT,
  meta_description TEXT,
  status           roundup_status NOT NULL DEFAULT 'draft',
  author           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at     TIMESTAMPTZ,
  CONSTRAINT roundups_slug_unique UNIQUE (slug)
);

CREATE TRIGGER roundups_updated_at BEFORE UPDATE ON roundups FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE roundup_listings (
  roundup_id     UUID NOT NULL REFERENCES roundups(id)  ON DELETE CASCADE,
  listing_id     UUID NOT NULL REFERENCES listings(id)  ON DELETE CASCADE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  editorial_note TEXT,
  PRIMARY KEY (roundup_id, listing_id)
);


-- ─── Category + town editorial overrides ─────────────────────────────────────

CREATE TABLE category_town_overrides (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID NOT NULL REFERENCES categories(id),
  town_id          UUID NOT NULL REFERENCES towns(id),
  intro            TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  status           category_town_status NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT category_town_overrides_pair UNIQUE (category_id, town_id)
);

CREATE TRIGGER category_town_overrides_updated_at
  BEFORE UPDATE ON category_town_overrides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- Public: read published listings, all taxonomy.
-- Writes: require authenticated Supabase session (admin/editor roles).
-- Phase 5 will add finer-grained role policies.

ALTER TABLE listings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE towns                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE roundups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE roundup_listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_town_overrides ENABLE ROW LEVEL SECURITY;

-- Public read: published listings only
CREATE POLICY "public_read_published_listings" ON listings
  FOR SELECT USING (status = 'published');

-- Public read: taxonomy tables (always fully readable)
CREATE POLICY "public_read_categories"   ON categories   FOR SELECT USING (TRUE);
CREATE POLICY "public_read_subcategories" ON subcategories FOR SELECT USING (TRUE);
CREATE POLICY "public_read_towns"        ON towns        FOR SELECT USING (TRUE);
CREATE POLICY "public_read_tags"         ON tags         FOR SELECT USING (TRUE);

-- Public read: published roundups
CREATE POLICY "public_read_published_roundups" ON roundups
  FOR SELECT USING (status = 'published');

-- Public read: junction tables (filtered downstream by parent row policies)
CREATE POLICY "public_read_listing_subcategories" ON listing_subcategories FOR SELECT USING (TRUE);
CREATE POLICY "public_read_listing_tags"          ON listing_tags          FOR SELECT USING (TRUE);
CREATE POLICY "public_read_roundup_listings"      ON roundup_listings      FOR SELECT USING (TRUE);
CREATE POLICY "public_read_category_town_overrides" ON category_town_overrides
  FOR SELECT USING (status = 'published');

-- Authenticated users (admin/editor): full access to all tables
-- Replace with role-specific policies in Phase 5 if needed
CREATE POLICY "authenticated_full_access_listings"   ON listings   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_subcategories" ON subcategories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_towns"      ON towns      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_tags"       ON tags       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_roundups"   ON roundups   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_ls"  ON listing_subcategories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_lt"  ON listing_tags          FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_rl"  ON roundup_listings      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_full_access_cto" ON category_town_overrides FOR ALL USING (auth.role() = 'authenticated');
