# 03 — Database Design

## Stack
- **Database:** PostgreSQL via Supabase
- **ORM:** Drizzle ORM (type-safe, lightweight, native PG support, generates clean SQL migrations)
- **Auth:** Supabase Auth (admin-only in v1)

---

## Design principles

- UUIDs as primary keys (Supabase-compatible, safe for future public APIs)
- `created_at` and `updated_at` on all content tables
- Soft status controls via `status` enum rather than hard deletes
- Ranking score stored as a computed column, updated via trigger or server-side function
- Opening hours and FAQ stored as JSONB for flexibility
- Row-level security (RLS) enabled on Supabase — public reads on published content only
- All slugs must be unique and URL-safe (enforced at DB level)

---

## Tables

### `categories`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
slug            text NOT NULL UNIQUE
description     text
meta_title      text
meta_description text
icon            text          -- emoji or icon-name string
sort_order      integer DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `subcategories`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
category_id     uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE
name            text NOT NULL
slug            text NOT NULL UNIQUE
description     text
meta_title      text
meta_description text
sort_order      integer DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `towns`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
slug            text NOT NULL UNIQUE
county          text NOT NULL DEFAULT 'Surrey'
region          text                           -- for future expansion
description     text
meta_title      text
meta_description text
latitude        numeric(9,6)
longitude       numeric(9,6)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `tags`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
slug            text NOT NULL UNIQUE
created_at      timestamptz DEFAULT now()
```

---

### `listings` (core content table)

```sql
-- Identity
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
name                text NOT NULL
slug                text NOT NULL UNIQUE
entity_type         text NOT NULL CHECK (entity_type IN (
                      'restaurant', 'cafe', 'attraction', 'activity-venue', 'place'
                    ))
primary_category_id uuid NOT NULL REFERENCES categories(id)
town_id             uuid NOT NULL REFERENCES towns(id)

-- Location
address_line1       text
address_line2       text
postcode            text
latitude            numeric(9,6)
longitude           numeric(9,6)

-- Contact
website_url         text
phone_number        text

-- Structured attributes
family_friendly         boolean
dog_friendly            boolean
vegan_friendly          boolean
vegetarian_friendly     boolean
wheelchair_accessible   boolean
indoor                  boolean
outdoor                 boolean
good_for_groups         boolean
booking_required        boolean
parking                 text CHECK (parking IN ('free', 'paid', 'street', 'none'))
price_band              text CHECK (price_band IN ('£', '££', '£££', '££££'))
age_suitability         text

-- Content
short_summary           text           -- 1–2 sentences, used on cards
long_description        text           -- editorial body copy
highlights              text[]         -- 3–5 bullet points
why_we_like_it          text           -- short editorial quote
best_for                text[]         -- e.g. ['families', 'date night']
faq                     jsonb          -- [{question: string, answer: string}]
opening_hours           jsonb          -- {monday: {open: '09:00', close: '17:00'} | null, ...}
images                  jsonb          -- [{url, alt, caption, is_primary}]
amenities               text[]

-- Ranking inputs
review_score            numeric(3,2)   -- 0.00–5.00, sourced externally or set by editor
review_count            integer DEFAULT 0
editorial_score         integer DEFAULT 5 CHECK (editorial_score BETWEEN 0 AND 10)
category_fit_score      integer DEFAULT 5 CHECK (category_fit_score BETWEEN 0 AND 10)
completeness_score      integer GENERATED ALWAYS AS (
                          -- Computed from non-null content fields (see note below)
                          -- Implemented as a stored generated column or trigger
                          0
                        ) STORED                              -- placeholder; real logic via trigger

-- Computed ranking score (updated by trigger on any ranking input change)
ranking_score           numeric(6,2) DEFAULT 0

-- Admin / editorial
status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'review', 'published', 'unpublished'))
featured        boolean DEFAULT false
sponsored       boolean DEFAULT false
editorial_notes text
verified        boolean DEFAULT false

-- Timestamps
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
published_at    timestamptz
```

**Completeness score logic (implemented as trigger or server function):**

```
completeness_score = sum of points for non-null fields:
  short_summary        10 pts
  long_description     15 pts
  images (≥1)          15 pts
  opening_hours        10 pts
  website_url           5 pts
  phone_number          5 pts
  address_line1         5 pts
  postcode              5 pts
  latitude + longitude  5 pts
  highlights (≥3)      10 pts
  why_we_like_it       10 pts
  faq (≥1)              5 pts
  ──────────────────────────
  Total possible      100 pts
```

**Ranking score formula (trigger on review_score, review_count, editorial_score, category_fit_score, completeness_score):**

```
ranking_score =
  LEAST(review_score / 5.0, 1.0)         * 30   -- review average (30%)
  + LEAST(review_count::float / 500, 1.0) * 25   -- review count capped at 500 (25%)
  + (editorial_score / 10.0)              * 25   -- editorial score (25%)
  + (category_fit_score / 10.0)          * 10   -- category fit (10%)
  + (completeness_score / 100.0)         * 10   -- completeness (10%)
```

Result: 0–100 float. Higher = ranked first.

---

### `listing_subcategories` (junction)

```sql
listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE
subcategory_id  uuid NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE
PRIMARY KEY (listing_id, subcategory_id)
```

### `listing_tags` (junction)

```sql
listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE
tag_id          uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE
PRIMARY KEY (listing_id, tag_id)
```

---

### `roundups` (editorial pages)

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
title           text NOT NULL
slug            text NOT NULL UNIQUE
intro           text
body            jsonb          -- structured content blocks (or text for v1)
meta_title      text
meta_description text
status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'review', 'published', 'unpublished'))
author          text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
published_at    timestamptz
```

### `roundup_listings` (junction)

```sql
roundup_id      uuid NOT NULL REFERENCES roundups(id) ON DELETE CASCADE
listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE
sort_order      integer DEFAULT 0
editorial_note  text           -- short note shown on the roundup card
PRIMARY KEY (roundup_id, listing_id)
```

---

### `category_town_overrides` (optional editorial overrides)

Allows editors to write custom intro copy for specific town + category page combos. If no record exists, the page uses a generated intro.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
category_id     uuid NOT NULL REFERENCES categories(id)
town_id         uuid NOT NULL REFERENCES towns(id)
intro           text
meta_title      text
meta_description text
status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published'))
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
UNIQUE (category_id, town_id)
```

---

## Indexes

```sql
-- Listing lookups (most common queries)
CREATE INDEX idx_listings_town_id ON listings(town_id);
CREATE INDEX idx_listings_category_id ON listings(primary_category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_ranking_score ON listings(ranking_score DESC);
CREATE INDEX idx_listings_featured ON listings(featured) WHERE featured = true;
CREATE INDEX idx_listings_town_category ON listings(town_id, primary_category_id);

-- Full-text search
CREATE INDEX idx_listings_fts ON listings
  USING gin(to_tsvector('english', name || ' ' || coalesce(short_summary,'') || ' ' || coalesce(long_description,'')));

-- Slug lookups
CREATE INDEX idx_listings_slug ON listings(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);
CREATE INDEX idx_towns_slug ON towns(slug);
```

---

## Supabase RLS policies (sketch)

```sql
-- Public: read published listings only
CREATE POLICY "public_read_listings" ON listings
  FOR SELECT USING (status = 'published');

-- Public: read all categories, subcategories, towns, tags
CREATE POLICY "public_read_taxonomy" ON categories FOR SELECT USING (true);
CREATE POLICY "public_read_taxonomy" ON subcategories FOR SELECT USING (true);
CREATE POLICY "public_read_taxonomy" ON towns FOR SELECT USING (true);
CREATE POLICY "public_read_taxonomy" ON tags FOR SELECT USING (true);

-- Admin: full access via authenticated role (Supabase auth)
-- All write operations require authenticated session
```

---

## Entity-relationship summary

```
categories ──< subcategories
     │
     └──< listings >──< listing_subcategories >──< subcategories
              │
              ├── towns
              │
              └──< listing_tags >──< tags

roundups >──< roundup_listings >──< listings

category_town_overrides >── categories
category_town_overrides >── towns
```
