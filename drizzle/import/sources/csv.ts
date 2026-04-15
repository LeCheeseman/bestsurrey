/**
 * CSV source adapter.
 *
 * Reads a CSV file and returns ListingImportRecord[].
 * The CSV must have a header row whose column names match the field names in
 * ListingImportRecord. Unknown columns are silently ignored.
 * Empty cells become undefined (treated as "not provided" by the upsert layer).
 *
 * See drizzle/data/listings-template.csv for the expected column layout.
 */

import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import type { ListingImportRecord } from '../types'

export function readCsv(filePath: string): ListingImportRecord[] {
  const content = readFileSync(filePath, 'utf-8')

  const rows = parse(content, {
    columns:          true,   // first row = column headers
    skip_empty_lines: true,
    trim:             true,
    bom:              true,   // handle Excel-exported UTF-8 BOM
  }) as Record<string, string>[]

  return rows.map((row) => {
    const get = (key: string): string | undefined => row[key]?.trim() || undefined

    return {
      // Required
      name:          row.name?.trim()          ?? '',
      slug:          row.slug?.trim()          ?? '',
      town_slug:     row.town_slug?.trim()     ?? '',
      category_slug: row.category_slug?.trim() ?? '',
      entity_type:   row.entity_type?.trim()   ?? '',

      // Optional — all coerced to undefined when empty
      status:        get('status'),
      address_line1: get('address_line1'),
      address_line2: get('address_line2'),
      postcode:      get('postcode'),
      latitude:      get('latitude'),
      longitude:     get('longitude'),
      website_url:   get('website_url'),
      phone_number:  get('phone_number'),

      short_summary:    get('short_summary'),
      long_description: get('long_description'),
      why_we_like_it:   get('why_we_like_it'),
      highlights:       get('highlights'),
      best_for:         get('best_for'),
      amenities:        get('amenities'),

      family_friendly:       get('family_friendly'),
      dog_friendly:          get('dog_friendly'),
      vegan_friendly:        get('vegan_friendly'),
      vegetarian_friendly:   get('vegetarian_friendly'),
      wheelchair_accessible: get('wheelchair_accessible'),
      indoor:                get('indoor'),
      outdoor:               get('outdoor'),
      good_for_groups:       get('good_for_groups'),
      booking_required:      get('booking_required'),

      price_band: get('price_band'),
      parking:    get('parking'),

      featured:           get('featured'),
      sponsored:          get('sponsored'),
      editorial_score:    get('editorial_score'),
      category_fit_score: get('category_fit_score'),
      review_score:       get('review_score'),
      review_count:       get('review_count'),

      subcategory_slugs: get('subcategory_slugs'),
      tag_slugs:         get('tag_slugs'),

      images:        get('images'),
      opening_hours: get('opening_hours'),
      faq:           get('faq'),
    }
  })
}
