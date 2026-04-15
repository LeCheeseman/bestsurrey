-- Migration 0002: listing click tracking
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS listing_clicks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  event_type  text        NOT NULL DEFAULT 'website_click'
                          CHECK (event_type IN ('website_click', 'card_click')),
  page_path   text,
  referer     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for per-listing queries (e.g. "clicks this month for listing X")
CREATE INDEX IF NOT EXISTS listing_clicks_listing_idx  ON listing_clicks(listing_id);
CREATE INDEX IF NOT EXISTS listing_clicks_created_idx  ON listing_clicks(created_at);
CREATE INDEX IF NOT EXISTS listing_clicks_type_idx     ON listing_clicks(event_type);

-- RLS: allow server-side inserts only (no public insert)
ALTER TABLE listing_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON listing_clicks
  FOR ALL USING (auth.role() = 'service_role');
