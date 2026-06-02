BEGIN;

INSERT INTO public.listing_categories (listing_id, category_id, is_primary)
SELECT id, primary_category_id, true
FROM public.listings
ON CONFLICT (listing_id, category_id) DO UPDATE
SET is_primary = true;

UPDATE public.listing_categories lc
SET is_primary = (lc.category_id = l.primary_category_id)
FROM public.listings l
WHERE lc.listing_id = l.id;

COMMIT;
