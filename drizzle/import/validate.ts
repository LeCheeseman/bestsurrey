/**
 * Pre-upsert validation.
 *
 * Checks required fields, valid enum values, and parseable JSON.
 * Returns an array of errors — empty means all records are valid.
 * Aborts the import if any errors are found (fail-fast before any DB writes).
 */

import type { ListingImportRecord } from './types'

const VALID_ENTITY_TYPES = ['restaurant', 'cafe', 'attraction', 'activity-venue', 'place']
const VALID_STATUSES     = ['draft', 'review', 'published', 'unpublished']
const VALID_PRICE_BANDS  = ['£', '££', '£££', '££££']
const VALID_PARKING      = ['free', 'paid', 'street', 'none']

export interface ValidationError {
  slug:    string
  field:   string
  message: string
}

export function validateRecords(records: ListingImportRecord[]): ValidationError[] {
  const errors: ValidationError[] = []
  const seenSlugs = new Set<string>()

  for (const r of records) {
    const id = r.slug || r.name || '(unknown)'

    // Required fields
    if (!r.name?.trim())          errors.push({ slug: id, field: 'name',          message: 'Required' })
    if (!r.slug?.trim())          errors.push({ slug: id, field: 'slug',          message: 'Required' })
    if (!r.town_slug?.trim())     errors.push({ slug: id, field: 'town_slug',     message: 'Required' })
    if (!r.category_slug?.trim()) errors.push({ slug: id, field: 'category_slug', message: 'Required' })
    if (!r.entity_type?.trim())   errors.push({ slug: id, field: 'entity_type',   message: 'Required' })

    // Duplicate slug within the import file
    if (r.slug) {
      if (seenSlugs.has(r.slug)) {
        errors.push({ slug: r.slug, field: 'slug', message: 'Duplicate slug in import file' })
      }
      seenSlugs.add(r.slug)
    }

    // Enum values
    if (r.entity_type && !VALID_ENTITY_TYPES.includes(r.entity_type)) {
      errors.push({ slug: id, field: 'entity_type', message: `Must be one of: ${VALID_ENTITY_TYPES.join(', ')}` })
    }
    if (r.status && !VALID_STATUSES.includes(r.status)) {
      errors.push({ slug: id, field: 'status', message: `Must be one of: ${VALID_STATUSES.join(', ')}` })
    }
    if (r.price_band && !VALID_PRICE_BANDS.includes(r.price_band)) {
      errors.push({ slug: id, field: 'price_band', message: `Must be one of: ${VALID_PRICE_BANDS.join(', ')}` })
    }
    if (r.parking && !VALID_PARKING.includes(r.parking)) {
      errors.push({ slug: id, field: 'parking', message: `Must be one of: ${VALID_PARKING.join(', ')}` })
    }

    // Numeric range checks
    if (r.editorial_score) {
      const n = parseInt(r.editorial_score, 10)
      if (isNaN(n) || n < 1 || n > 10) errors.push({ slug: id, field: 'editorial_score', message: 'Must be integer 1–10' })
    }
    if (r.category_fit_score) {
      const n = parseInt(r.category_fit_score, 10)
      if (isNaN(n) || n < 1 || n > 10) errors.push({ slug: id, field: 'category_fit_score', message: 'Must be integer 1–10' })
    }
    if (r.review_score) {
      const n = parseFloat(r.review_score)
      if (isNaN(n) || n < 0 || n > 5) errors.push({ slug: id, field: 'review_score', message: 'Must be decimal 0–5' })
    }

    // JSON fields parseable
    for (const field of ['opening_hours', 'faq'] as const) {
      const val = r[field]
      if (val?.trim()) {
        try { JSON.parse(val) } catch {
          errors.push({ slug: id, field, message: 'Invalid JSON' })
        }
      }
    }
    // images: allow either a URL string or a JSON array
    if (r.images?.trim() && r.images.startsWith('[')) {
      try { JSON.parse(r.images) } catch {
        errors.push({ slug: id, field: 'images', message: 'Invalid JSON (expected array or plain URL)' })
      }
    }
  }

  return errors
}
