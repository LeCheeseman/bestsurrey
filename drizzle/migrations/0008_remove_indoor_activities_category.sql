BEGIN;

WITH category_ids AS (
  SELECT
    (SELECT id FROM public.categories WHERE slug = 'indoor-activities') AS indoor_id,
    (SELECT id FROM public.categories WHERE slug = 'kids-family') AS family_id,
    (SELECT id FROM public.categories WHERE slug = 'things-to-do') AS things_id
),
family_listings AS (
  SELECT DISTINCT ls.listing_id
  FROM public.listing_subcategories ls
  JOIN public.subcategories s ON s.id = ls.subcategory_id
  WHERE s.slug IN ('bowling', 'climbing', 'mini-golf', 'trampoline-parks')
),
things_listings AS (
  SELECT DISTINCT ls.listing_id
  FROM public.listing_subcategories ls
  JOIN public.subcategories s ON s.id = ls.subcategory_id
  WHERE s.slug = 'escape-rooms'
),
indoor_primary_listings AS (
  SELECT l.id AS listing_id
  FROM public.listings l
  JOIN category_ids c ON l.primary_category_id = c.indoor_id
),
fallback_family_listings AS (
  SELECT listing_id
  FROM indoor_primary_listings
  WHERE listing_id NOT IN (SELECT listing_id FROM things_listings)
)
INSERT INTO public.listing_categories (listing_id, category_id, is_primary)
SELECT listing_id, family_id, false
FROM category_ids, family_listings
WHERE family_id IS NOT NULL
ON CONFLICT (listing_id, category_id) DO NOTHING;

WITH category_ids AS (
  SELECT
    (SELECT id FROM public.categories WHERE slug = 'kids-family') AS family_id,
    (SELECT id FROM public.categories WHERE slug = 'things-to-do') AS things_id
),
things_listings AS (
  SELECT DISTINCT ls.listing_id
  FROM public.listing_subcategories ls
  JOIN public.subcategories s ON s.id = ls.subcategory_id
  WHERE s.slug = 'escape-rooms'
)
INSERT INTO public.listing_categories (listing_id, category_id, is_primary)
SELECT listing_id, things_id, false
FROM category_ids, things_listings
WHERE things_id IS NOT NULL
ON CONFLICT (listing_id, category_id) DO NOTHING;

WITH category_ids AS (
  SELECT
    (SELECT id FROM public.categories WHERE slug = 'indoor-activities') AS indoor_id,
    (SELECT id FROM public.categories WHERE slug = 'kids-family') AS family_id,
    (SELECT id FROM public.categories WHERE slug = 'things-to-do') AS things_id
),
things_listings AS (
  SELECT DISTINCT ls.listing_id
  FROM public.listing_subcategories ls
  JOIN public.subcategories s ON s.id = ls.subcategory_id
  WHERE s.slug = 'escape-rooms'
),
fallback_family_listings AS (
  SELECT l.id AS listing_id
  FROM public.listings l, category_ids c
  WHERE l.primary_category_id = c.indoor_id
    AND l.id NOT IN (SELECT listing_id FROM things_listings)
)
UPDATE public.listings l
SET primary_category_id = CASE
  WHEN l.id IN (SELECT listing_id FROM things_listings) THEN c.things_id
  ELSE c.family_id
END,
updated_at = now()
FROM category_ids c
WHERE l.primary_category_id = c.indoor_id
  AND c.indoor_id IS NOT NULL
  AND c.family_id IS NOT NULL
  AND c.things_id IS NOT NULL;

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'things-to-do')
WHERE slug = 'escape-rooms';

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'kids-family')
WHERE slug IN ('bowling', 'climbing', 'mini-golf', 'trampoline-parks');

DELETE FROM public.listing_categories
WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'indoor-activities');

DELETE FROM public.category_town_overrides
WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'indoor-activities');

DELETE FROM public.categories
WHERE slug = 'indoor-activities';

COMMIT;
