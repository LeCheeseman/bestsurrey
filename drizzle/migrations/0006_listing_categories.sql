BEGIN;

CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (listing_id, category_id)
);

CREATE INDEX IF NOT EXISTS listing_categories_category_idx
  ON listing_categories(category_id);

INSERT INTO listing_categories (listing_id, category_id, is_primary)
SELECT id, primary_category_id, true
FROM listings
ON CONFLICT (listing_id, category_id) DO UPDATE
SET is_primary = true;

COMMIT;
