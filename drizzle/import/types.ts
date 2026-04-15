/**
 * Canonical listing import record.
 *
 * All import sources (CSV, Sheets, Airtable, API) normalise to this shape
 * before being passed to the upsert pipeline. All fields are strings to
 * accommodate CSV/spreadsheet origins — the upsert layer handles coercion
 * (booleans, numbers, JSON arrays, etc.).
 *
 * To add a new source adapter, create a file in sources/ that returns
 * ListingImportRecord[] from whatever raw input format you have.
 */
export interface ListingImportRecord {
  // ── Required ───────────────────────────────────────────────────────────────
  name:          string
  slug:          string
  town_slug:     string   // resolved → town_id at upsert time
  category_slug: string   // resolved → primary_category_id at upsert time
  entity_type:   string   // 'restaurant' | 'cafe' | 'attraction' | 'activity-venue' | 'place'

  // ── Status ─────────────────────────────────────────────────────────────────
  status?: string         // 'draft' | 'review' | 'published' | 'unpublished' (default: 'draft')

  // ── Location ───────────────────────────────────────────────────────────────
  address_line1?: string
  address_line2?: string
  postcode?:      string
  latitude?:      string
  longitude?:     string

  // ── Contact ────────────────────────────────────────────────────────────────
  website_url?:  string
  phone_number?: string

  // ── Content ────────────────────────────────────────────────────────────────
  short_summary?:    string
  long_description?: string
  why_we_like_it?:   string
  highlights?:       string   // pipe-separated: "Great views|Good coffee|Dog friendly"
  best_for?:         string   // pipe-separated: "Date night|Families"
  amenities?:        string   // pipe-separated

  // ── Boolean attributes ─────────────────────────────────────────────────────
  // Accept "true" / "false" / "1" / "0" / "" (empty = null)
  family_friendly?:       string
  dog_friendly?:          string
  vegan_friendly?:        string
  vegetarian_friendly?:   string
  wheelchair_accessible?: string
  indoor?:                string
  outdoor?:               string
  good_for_groups?:       string
  booking_required?:      string

  // ── Commercial ────────────────────────────────────────────────────────────
  price_band?: string   // '£' | '££' | '£££' | '££££'
  parking?:    string   // 'free' | 'paid' | 'street' | 'none'

  // ── Editorial / ranking inputs ────────────────────────────────────────────
  featured?:           string   // "true" / "false" (default: false)
  sponsored?:          string   // "true" / "false" (default: false)
  editorial_score?:    string   // integer 1–10 (default: 5)
  category_fit_score?: string   // integer 1–10 (default: 5)

  // ── Review data ───────────────────────────────────────────────────────────
  review_score?: string   // decimal 0.0–5.0
  review_count?: string   // integer

  // ── Relations (pipe-separated slugs) ─────────────────────────────────────
  subcategory_slugs?: string   // "vegan-restaurants|vegetarian-restaurants"
  tag_slugs?:         string   // "outdoor|family|dog-walk"

  // ── Structured JSON fields ────────────────────────────────────────────────
  // Pass as a JSON string; the upsert layer parses and stores as JSONB.
  // images:        JSON array of ListingImage, or a single URL string (auto-wrapped)
  // opening_hours: JSON object matching the OpeningHours type in src/types/db-shapes.ts
  // faq:           JSON array of FaqItem { question: string; answer: string }
  images?:        string
  opening_hours?: string
  faq?:           string
}

// ─── Pipeline result types ────────────────────────────────────────────────────

export interface ImportResult {
  slug:     string
  action:   'inserted' | 'updated' | 'skipped' | 'error'
  message?: string
}

export interface ImportReport {
  total:    number
  inserted: number
  updated:  number
  skipped:  number
  errors:   number
  results:  ImportResult[]
}
