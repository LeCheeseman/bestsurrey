/**
 * Application-level TypeScript types.
 *
 * DB row types are inferred directly from the Drizzle schema so they stay
 * in sync with the database automatically.
 */

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  categories,
  subcategories,
  towns,
  tags,
  listings,
  listingCategories,
  listingSubcategories,
  listingTags,
  listingClicks,
  roundups,
  roundupListings,
  categoryTownOverrides,
} from '@/lib/db/schema'

// ─── Re-export JSONB shapes for convenience ───────────────────────────────────

export type {
  ListingImage,
  OpeningHours,
  OpeningHoursDay,
  ClosedDay,
  OpeningHoursDayValue,
  FaqItem,
  RoundupBodyBlock,
} from './db-shapes'

// ─── Base DB types (select / insert) ─────────────────────────────────────────

export type Category    = InferSelectModel<typeof categories>
export type NewCategory = InferInsertModel<typeof categories>

export type Subcategory    = InferSelectModel<typeof subcategories>
export type NewSubcategory = InferInsertModel<typeof subcategories>

export type Town    = InferSelectModel<typeof towns>
export type NewTown = InferInsertModel<typeof towns>

export type Tag    = InferSelectModel<typeof tags>
export type NewTag = InferInsertModel<typeof tags>

export type Listing    = InferSelectModel<typeof listings>
export type NewListing = InferInsertModel<typeof listings>

export type Roundup    = InferSelectModel<typeof roundups>
export type NewRoundup = InferInsertModel<typeof roundups>

export type CategoryTownOverride    = InferSelectModel<typeof categoryTownOverrides>
export type NewCategoryTownOverride = InferInsertModel<typeof categoryTownOverrides>

export type ListingSubcategory = InferSelectModel<typeof listingSubcategories>
export type ListingCategory    = InferSelectModel<typeof listingCategories>
export type ListingTag         = InferSelectModel<typeof listingTags>
export type ListingClick       = InferSelectModel<typeof listingClicks>
export type RoundupListing     = InferSelectModel<typeof roundupListings>

// ─── Composite types (with relations) ────────────────────────────────────────

/** Full listing with all relations resolved — used on listing detail pages */
export type ListingWithRelations = Listing & {
  town:            Town
  primaryCategory: Category
  subcategories:   Subcategory[]
  tags:            Tag[]
}

/** Listing card data — minimal shape used on index/collection pages */
export type ListingCard = Pick<
  Listing,
  | 'id'
  | 'slug'
  | 'name'
  | 'shortSummary'
  | 'images'
  | 'priceBand'
  | 'familyFriendly'
  | 'dogFriendly'
  | 'veganFriendly'
  | 'wheelchairAccessible'
  | 'featured'
  | 'sponsored'
  | 'rankingScore'
> & {
  town:            Pick<Town, 'name' | 'slug'>
  primaryCategory: Pick<Category, 'name' | 'slug'>
}

/** Roundup with resolved listing cards */
export type RoundupWithListings = Roundup & {
  listings: Array<{
    listing:       ListingCard
    sortOrder:     number
    editorialNote: string | null
  }>
}

// ─── Enum value types ─────────────────────────────────────────────────────────
// Derived from the Drizzle enum definitions to avoid hardcoding strings.

export type ListingStatus = Listing['status']
export type EntityType    = Listing['entityType']
export type PriceBand     = NonNullable<Listing['priceBand']>
export type ParkingType   = NonNullable<Listing['parking']>
