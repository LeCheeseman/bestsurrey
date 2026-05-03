-- Fix subcategory inserts — uses category_id (UUID) not category_slug

-- ── Add new subcategories for pubs-bars ───────────────────────────────────────
INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'gastropubs', 'Gastropubs', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'traditional-pubs', 'Traditional Pubs', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'country-pubs', 'Country Pubs', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'beer-gardens', 'Beer Gardens', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'wine-bars', 'Wine Bars', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'cocktail-bars', 'Cocktail Bars', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'sports-bars', 'Sports Bars', id FROM categories WHERE slug = 'pubs-bars'
ON CONFLICT (slug) DO NOTHING;

-- ── Add new subcategories for restaurants ─────────────────────────────────────
INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'sunday-roast', 'Sunday Roast', id FROM categories WHERE slug = 'restaurants'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'brunch', 'Brunch', id FROM categories WHERE slug = 'restaurants'
ON CONFLICT (slug) DO NOTHING;

-- ── Add new subcategories for things-to-do ────────────────────────────────────
INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'arts-culture', 'Arts & Culture', id FROM categories WHERE slug = 'things-to-do'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'cycling', 'Cycling', id FROM categories WHERE slug = 'things-to-do'
ON CONFLICT (slug) DO NOTHING;

-- ── Add new subcategories for kids-family ─────────────────────────────────────
INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'theme-parks', 'Theme Parks', id FROM categories WHERE slug = 'kids-family'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'holiday-activities', 'Holiday Activities', id FROM categories WHERE slug = 'kids-family'
ON CONFLICT (slug) DO NOTHING;

-- ── Add new subcategories for indoor-activities ───────────────────────────────
INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'trampoline-parks', 'Trampoline Parks', id FROM categories WHERE slug = 'indoor-activities'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'axe-throwing', 'Axe Throwing', id FROM categories WHERE slug = 'indoor-activities'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (id, slug, name, category_id)
SELECT gen_random_uuid(), 'virtual-reality', 'Virtual Reality', id FROM categories WHERE slug = 'indoor-activities'
ON CONFLICT (slug) DO NOTHING;
