/**
 * Listing completeness score — computed server-side, stored on the listing row.
 *
 * Scores each content field and sums to a 0–100 integer.
 * Used as one input to the ranking formula (10% weight).
 * Updated whenever a listing is saved via the admin workflow.
 *
 * Keeping this in TypeScript (rather than a SQL trigger) makes it easy to
 * read, test, and adjust without a migration.
 */

import type { NewListing } from '@/types'

interface CompletenessFields {
  shortSummary:    NewListing['shortSummary']
  longDescription: NewListing['longDescription']
  images:          NewListing['images']
  openingHours:    NewListing['openingHours']
  websiteUrl:      NewListing['websiteUrl']
  phoneNumber:     NewListing['phoneNumber']
  addressLine1:    NewListing['addressLine1']
  postcode:        NewListing['postcode']
  latitude:        NewListing['latitude']
  longitude:       NewListing['longitude']
  highlights:      NewListing['highlights']
  whyWeLikeIt:     NewListing['whyWeLikeIt']
  faq:             NewListing['faq']
}

/** Field weights. Must sum to 100. */
const FIELD_WEIGHTS: Array<{ check: (f: CompletenessFields) => boolean; points: number }> = [
  { check: (f) => Boolean(f.shortSummary?.trim()),           points: 10 },
  { check: (f) => Boolean(f.longDescription?.trim()),        points: 15 },
  { check: (f) => (f.images?.length ?? 0) >= 1,             points: 15 },
  { check: (f) => Boolean(f.openingHours),                  points: 10 },
  { check: (f) => Boolean(f.websiteUrl?.trim()),             points: 5  },
  { check: (f) => Boolean(f.phoneNumber?.trim()),            points: 5  },
  { check: (f) => Boolean(f.addressLine1?.trim()),           points: 5  },
  { check: (f) => Boolean(f.postcode?.trim()),               points: 5  },
  { check: (f) => f.latitude != null && f.longitude != null, points: 5  },
  { check: (f) => (f.highlights?.length ?? 0) >= 3,         points: 10 },
  { check: (f) => Boolean(f.whyWeLikeIt?.trim()),           points: 10 },
  { check: (f) => (f.faq?.length ?? 0) >= 1,               points: 5  },
] // total: 100

export function computeCompletenessScore(fields: CompletenessFields): number {
  return FIELD_WEIGHTS.reduce(
    (total, { check, points }) => total + (check(fields) ? points : 0),
    0
  )
}
