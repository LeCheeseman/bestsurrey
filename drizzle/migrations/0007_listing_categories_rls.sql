BEGIN;

ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_listing_categories
  ON public.listing_categories;

CREATE POLICY public_read_listing_categories
  ON public.listing_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE listings.id = listing_categories.listing_id
        AND listings.status = 'published'
    )
  );

DROP POLICY IF EXISTS service_role_full_access_listing_categories
  ON public.listing_categories;

CREATE POLICY service_role_full_access_listing_categories
  ON public.listing_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
