-- Clean Best Surrey taxonomy so code constants and live DB agree.

BEGIN;

-- ── Canonical top-level categories ───────────────────────────────────────────
WITH desired_categories(slug, name, sort_order, icon, description) AS (
  VALUES
    ('restaurants', 'Restaurants', 1, '🍽️', 'The best restaurants across Surrey, from casual dining to fine dining.'),
    ('pubs-bars', 'Pubs & Bars', 2, '🍺', 'Pubs, gastropubs, beer gardens, wine bars and cocktail bars across Surrey.'),
    ('cafes-brunch', 'Brunch', 3, '☕', 'The best brunch spots, coffee shops, bakeries and tea rooms across Surrey.'),
    ('things-to-do', 'Things To Do', 4, '🗺️', 'Things to do across Surrey — walks, historic sites, gardens and more.'),
    ('kids-family', 'Kids & Family', 5, '🎠', 'The best family days out and children’s activities in Surrey.'),
    ('indoor-activities', 'Indoor Activities', 6, '🏁', 'Indoor activity venues across Surrey — bowling, climbing, soft play and more.')
)
INSERT INTO categories (slug, name, sort_order, icon, description)
SELECT slug, name, sort_order, icon, description
FROM desired_categories
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    updated_at = now();

DELETE FROM categories
WHERE slug NOT IN ('restaurants', 'pubs-bars', 'cafes-brunch', 'things-to-do', 'kids-family', 'indoor-activities')
  AND id NOT IN (SELECT DISTINCT primary_category_id FROM listings);

-- ── Canonical subcategories ──────────────────────────────────────────────────
WITH desired_subcategories(category_slug, slug, name, sort_order) AS (
  VALUES
    ('restaurants', 'fine-dining', 'Fine Dining', 1),
    ('restaurants', 'date-night', 'Date Night', 2),
    ('restaurants', 'casual-dining', 'Casual Dining', 3),
    ('restaurants', 'family-dining', 'Family Dining', 4),
    ('restaurants', 'sunday-roast', 'Sunday Roast', 5),

    ('pubs-bars', 'gastropubs', 'Gastropubs', 1),
    ('pubs-bars', 'country-pubs', 'Country Pubs', 2),
    ('pubs-bars', 'traditional-pubs', 'Traditional Pubs', 3),
    ('pubs-bars', 'beer-gardens', 'Beer Gardens', 4),
    ('pubs-bars', 'cocktail-bars', 'Cocktail Bars', 5),
    ('pubs-bars', 'wine-bars', 'Wine Bars', 6),

    ('cafes-brunch', 'coffee-shops', 'Coffee Shops', 1),
    ('cafes-brunch', 'brunch-spots', 'Brunch Spots', 2),
    ('cafes-brunch', 'bakeries', 'Bakeries', 3),

    ('things-to-do', 'walks-nature', 'Walks & Nature', 1),
    ('things-to-do', 'gardens-parks', 'Gardens & Parks', 2),
    ('things-to-do', 'historic-sites', 'Historic Sites', 3),
    ('things-to-do', 'days-out', 'Days Out', 4),
    ('things-to-do', 'arts-culture', 'Arts & Culture', 5),
    ('things-to-do', 'entertainment', 'Entertainment', 6),

    ('kids-family', 'soft-play', 'Soft Play', 1),
    ('kids-family', 'farms-animals', 'Farms & Animals', 2),
    ('kids-family', 'outdoor-play', 'Outdoor Play', 3),
    ('kids-family', 'museums-education', 'Museums & Education', 4),

    ('indoor-activities', 'bowling', 'Bowling', 1),
    ('indoor-activities', 'climbing', 'Climbing', 2),
    ('indoor-activities', 'mini-golf', 'Mini Golf', 3),
    ('indoor-activities', 'trampoline-parks', 'Trampoline Parks', 4),
    ('indoor-activities', 'escape-rooms', 'Escape Rooms', 5)
),
resolved AS (
  SELECT c.id AS category_id, d.slug, d.name, d.sort_order
  FROM desired_subcategories d
  JOIN categories c ON c.slug = d.category_slug
)
INSERT INTO subcategories (slug, name, category_id, sort_order)
SELECT slug, name, category_id, sort_order
FROM resolved
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- Remove duplicate/attribute-style/fringe subcategories. Junction rows cascade.
DELETE FROM subcategories
WHERE slug NOT IN (
  'fine-dining', 'date-night', 'casual-dining', 'family-dining', 'sunday-roast',
  'gastropubs', 'country-pubs', 'traditional-pubs', 'beer-gardens', 'cocktail-bars', 'wine-bars',
  'coffee-shops', 'brunch-spots', 'bakeries',
  'walks-nature', 'gardens-parks', 'historic-sites', 'days-out', 'arts-culture', 'entertainment',
  'soft-play', 'farms-animals', 'outdoor-play', 'museums-education',
  'bowling', 'climbing', 'mini-golf', 'trampoline-parks', 'escape-rooms'
);

COMMIT;
