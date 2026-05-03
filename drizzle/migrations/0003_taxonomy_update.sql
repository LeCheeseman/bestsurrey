-- Migration 0003: Taxonomy update
-- - Rename kids-activities → kids-family
-- - Rename activity-venues → indoor-activities
-- - Add pubs-bars category
-- - Add new towns
-- - Add new subcategories

-- ── Rename existing categories ────────────────────────────────────────────────
UPDATE categories SET slug = 'kids-family',       name = 'Kids & Family'     WHERE slug = 'kids-activities';
UPDATE categories SET slug = 'indoor-activities', name = 'Indoor Activities' WHERE slug = 'activity-venues';

-- ── Add new category: Pubs & Bars ─────────────────────────────────────────────
INSERT INTO categories (id, slug, name)
VALUES (gen_random_uuid(), 'pubs-bars', 'Pubs & Bars')
ON CONFLICT (slug) DO NOTHING;

-- ── Add new towns ─────────────────────────────────────────────────────────────
INSERT INTO towns (id, slug, name) VALUES
  (gen_random_uuid(), 'camberley',        'Camberley'),
  (gen_random_uuid(), 'redhill',          'Redhill'),
  (gen_random_uuid(), 'godalming',        'Godalming'),
  (gen_random_uuid(), 'leatherhead',      'Leatherhead'),
  (gen_random_uuid(), 'esher',            'Esher'),
  (gen_random_uuid(), 'walton-on-thames', 'Walton-on-Thames'),
  (gen_random_uuid(), 'haslemere',        'Haslemere'),
  (gen_random_uuid(), 'oxted',            'Oxted'),
  (gen_random_uuid(), 'virginia-water',   'Virginia Water'),
  (gen_random_uuid(), 'cranleigh',        'Cranleigh'),
  (gen_random_uuid(), 'staines',          'Staines-upon-Thames')
ON CONFLICT (slug) DO NOTHING;

-- ── Update subcategory parent slugs ───────────────────────────────────────────
UPDATE subcategories SET category_slug = 'kids-family'       WHERE category_slug = 'kids-activities';
UPDATE subcategories SET category_slug = 'indoor-activities' WHERE category_slug = 'activity-venues';

-- ── Add new subcategories ─────────────────────────────────────────────────────

-- Restaurants (new)
INSERT INTO subcategories (id, slug, name, category_slug) VALUES
  (gen_random_uuid(), 'sunday-roast', 'Sunday Roast', 'restaurants'),
  (gen_random_uuid(), 'brunch',       'Brunch',       'restaurants')
ON CONFLICT (slug) DO NOTHING;

-- Pubs & Bars
INSERT INTO subcategories (id, slug, name, category_slug) VALUES
  (gen_random_uuid(), 'gastropubs',       'Gastropubs',       'pubs-bars'),
  (gen_random_uuid(), 'traditional-pubs', 'Traditional Pubs', 'pubs-bars'),
  (gen_random_uuid(), 'country-pubs',     'Country Pubs',     'pubs-bars'),
  (gen_random_uuid(), 'beer-gardens',     'Beer Gardens',     'pubs-bars'),
  (gen_random_uuid(), 'wine-bars',        'Wine Bars',        'pubs-bars'),
  (gen_random_uuid(), 'cocktail-bars',    'Cocktail Bars',    'pubs-bars'),
  (gen_random_uuid(), 'sports-bars',      'Sports Bars',      'pubs-bars')
ON CONFLICT (slug) DO NOTHING;

-- Things To Do (new)
INSERT INTO subcategories (id, slug, name, category_slug) VALUES
  (gen_random_uuid(), 'arts-culture', 'Arts & Culture', 'things-to-do'),
  (gen_random_uuid(), 'cycling',      'Cycling',        'things-to-do')
ON CONFLICT (slug) DO NOTHING;

-- Kids & Family (new)
INSERT INTO subcategories (id, slug, name, category_slug) VALUES
  (gen_random_uuid(), 'theme-parks',        'Theme Parks',        'kids-family'),
  (gen_random_uuid(), 'holiday-activities', 'Holiday Activities', 'kids-family')
ON CONFLICT (slug) DO NOTHING;

-- Indoor Activities (new)
INSERT INTO subcategories (id, slug, name, category_slug) VALUES
  (gen_random_uuid(), 'trampoline-parks', 'Trampoline Parks', 'indoor-activities'),
  (gen_random_uuid(), 'axe-throwing',     'Axe Throwing',     'indoor-activities'),
  (gen_random_uuid(), 'virtual-reality',  'Virtual Reality',  'indoor-activities')
ON CONFLICT (slug) DO NOTHING;
