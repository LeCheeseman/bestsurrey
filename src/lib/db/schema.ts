/**
 * Drizzle ORM schema — all database tables for bestsurrey.co.uk
 *
 * Key design decisions:
 *  - UUIDs everywhere (safe for Supabase, future public API)
 *  - pgEnum for stable finite-state fields (status, entity_type)
 *  - JSONB for flexible content shapes (images, opening_hours, faq)
 *  - ranking_score is stored + updated by a DB trigger (see migration)
 *    so it can be indexed and sorted without per-query computation
 *  - completeness_score is computed server-side and written on save
 *    (easier to inspect/test in TypeScript than a complex SQL trigger)
 *  - Slug uniqueness within each table enforced here;
 *    cross-table collision between towns and categories enforced by trigger
 *    (see migration: enforce_town_category_slug_uniqueness)
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type {
  ListingImage,
  OpeningHours,
  FaqItem,
  RoundupBodyBlock,
} from '@/types/db-shapes'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const listingStatusEnum = pgEnum('listing_status', [
  'draft',
  'review',
  'published',
  'unpublished',
])

export const entityTypeEnum = pgEnum('entity_type', [
  'restaurant',
  'cafe',
  'attraction',
  'activity-venue',
  'place',
])

export const roundupStatusEnum = pgEnum('roundup_status', [
  'draft',
  'review',
  'published',
  'unpublished',
])

export const parkingEnum = pgEnum('parking_type', ['free', 'paid', 'street', 'none'])

export const priceBandEnum = pgEnum('price_band', ['£', '££', '£££', '££££'])

export const categoryTownStatusEnum = pgEnum('category_town_status', ['draft', 'published'])

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export const categories = pgTable(
  'categories',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    name:            text('name').notNull(),
    slug:            text('slug').notNull(),
    description:     text('description'),
    metaTitle:       text('meta_title'),
    metaDescription: text('meta_description'),
    icon:            text('icon'),
    sortOrder:       integer('sort_order').default(0),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(t.slug),
  })
)

export const subcategories = pgTable(
  'subcategories',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    categoryId:      uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    name:            text('name').notNull(),
    slug:            text('slug').notNull(),
    description:     text('description'),
    metaTitle:       text('meta_title'),
    metaDescription: text('meta_description'),
    sortOrder:       integer('sort_order').default(0),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('subcategories_slug_idx').on(t.slug),
  })
)

export const towns = pgTable(
  'towns',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    name:            text('name').notNull(),
    slug:            text('slug').notNull(),
    county:          text('county').notNull().default('Surrey'),
    region:          text('region'),
    description:     text('description'),
    metaTitle:       text('meta_title'),
    metaDescription: text('meta_description'),
    latitude:        numeric('latitude', { precision: 9, scale: 6 }),
    longitude:       numeric('longitude', { precision: 9, scale: 6 }),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('towns_slug_idx').on(t.slug),
  })
)

export const tags = pgTable(
  'tags',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    name:      text('name').notNull(),
    slug:      text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('tags_slug_idx').on(t.slug),
  })
)

// ─── Listings ─────────────────────────────────────────────────────────────────

export const listings = pgTable(
  'listings',
  {
    // Identity
    id:                uuid('id').primaryKey().defaultRandom(),
    name:              text('name').notNull(),
    slug:              text('slug').notNull(),
    entityType:        entityTypeEnum('entity_type').notNull(),
    primaryCategoryId: uuid('primary_category_id').notNull().references(() => categories.id),
    townId:            uuid('town_id').notNull().references(() => towns.id),

    // Location
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    postcode:     text('postcode'),
    latitude:     numeric('latitude', { precision: 9, scale: 6 }),
    longitude:    numeric('longitude', { precision: 9, scale: 6 }),

    // Contact
    websiteUrl:   text('website_url'),
    phoneNumber:  text('phone_number'),

    // Structured attributes — used for filtering and schema.org output
    familyFriendly:       boolean('family_friendly'),
    dogFriendly:          boolean('dog_friendly'),
    veganFriendly:        boolean('vegan_friendly'),
    vegetarianFriendly:   boolean('vegetarian_friendly'),
    wheelchairAccessible: boolean('wheelchair_accessible'),
    indoor:               boolean('indoor'),
    outdoor:              boolean('outdoor'),
    goodForGroups:        boolean('good_for_groups'),
    bookingRequired:      boolean('booking_required'),
    parking:              parkingEnum('parking'),
    priceBand:            priceBandEnum('price_band'),
    ageSuitability:       text('age_suitability'),

    // Content
    shortSummary:    text('short_summary'),
    longDescription: text('long_description'),
    highlights:      text('highlights').array(),
    whyWeLikeIt:     text('why_we_like_it'),
    bestFor:         text('best_for').array(),
    faq:             jsonb('faq').$type<FaqItem[]>(),
    openingHours:    jsonb('opening_hours').$type<OpeningHours>(),
    images:          jsonb('images').$type<ListingImage[]>(),
    amenities:       text('amenities').array(),

    // Ranking inputs — editable by admin; ranking_score recomputed by DB trigger
    reviewScore:       numeric('review_score', { precision: 3, scale: 2 }),
    reviewCount:       integer('review_count').default(0).notNull(),
    editorialScore:    integer('editorial_score').default(5).notNull(),
    categoryFitScore:  integer('category_fit_score').default(5).notNull(),
    // completenessScore computed server-side and written on save (see lib/completeness.ts)
    completenessScore: integer('completeness_score').default(0).notNull(),
    // ranking_score updated automatically by trigger on any ranking input change
    rankingScore:      numeric('ranking_score', { precision: 6, scale: 2 }).default('0').notNull(),

    // Admin / editorial
    status:         listingStatusEnum('status').notNull().default('draft'),
    featured:       boolean('featured').default(false).notNull(),
    sponsored:      boolean('sponsored').default(false).notNull(),
    editorialNotes: text('editorial_notes'),
    verified:       boolean('verified').default(false).notNull(),

    // Timestamps
    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (t) => ({
    slugIdx:          uniqueIndex('listings_slug_idx').on(t.slug),
    townIdx:          index('listings_town_idx').on(t.townId),
    categoryIdx:      index('listings_category_idx').on(t.primaryCategoryId),
    statusIdx:        index('listings_status_idx').on(t.status),
    rankingIdx:       index('listings_ranking_idx').on(t.rankingScore),
    townCategoryIdx:  index('listings_town_category_idx').on(t.townId, t.primaryCategoryId),
    featuredIdx:      index('listings_featured_idx').on(t.featured),
  })
)

// ─── Junction tables ──────────────────────────────────────────────────────────

export const listingSubcategories = pgTable(
  'listing_subcategories',
  {
    listingId:     uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
    subcategoryId: uuid('subcategory_id').notNull().references(() => subcategories.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.listingId, t.subcategoryId] }),
  })
)

export const listingTags = pgTable(
  'listing_tags',
  {
    listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
    tagId:     uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.listingId, t.tagId] }),
  })
)

// ─── Editorial roundups ───────────────────────────────────────────────────────

export const roundups = pgTable(
  'roundups',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    title:           text('title').notNull(),
    slug:            text('slug').notNull(),
    intro:           text('intro'),
    body:            jsonb('body').$type<RoundupBodyBlock[]>(),
    metaTitle:       text('meta_title'),
    metaDescription: text('meta_description'),
    status:          roundupStatusEnum('status').notNull().default('draft'),
    author:          text('author'),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
    publishedAt:     timestamp('published_at', { withTimezone: true }),
  },
  (t) => ({
    slugIdx: uniqueIndex('roundups_slug_idx').on(t.slug),
  })
)

export const roundupListings = pgTable(
  'roundup_listings',
  {
    roundupId:     uuid('roundup_id').notNull().references(() => roundups.id, { onDelete: 'cascade' }),
    listingId:     uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
    sortOrder:     integer('sort_order').default(0).notNull(),
    editorialNote: text('editorial_note'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roundupId, t.listingId] }),
  })
)

// ─── Click tracking ───────────────────────────────────────────────────────────

export const listingClicks = pgTable(
  'listing_clicks',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull().default('website_click'),
    pagePath:  text('page_path'),
    referer:   text('referer'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    listingIdx: index('listing_clicks_listing_idx').on(t.listingId),
    createdIdx: index('listing_clicks_created_idx').on(t.createdAt),
  })
)

// ─── Category + town editorial overrides ─────────────────────────────────────
// Allows editors to write custom intro copy per town+category combo.
// If no row exists the page template falls back to a generated intro.

export const categoryTownOverrides = pgTable(
  'category_town_overrides',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    categoryId:      uuid('category_id').notNull().references(() => categories.id),
    townId:          uuid('town_id').notNull().references(() => towns.id),
    intro:           text('intro'),
    metaTitle:       text('meta_title'),
    metaDescription: text('meta_description'),
    status:          categoryTownStatusEnum('status').notNull().default('draft'),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniquePair: uniqueIndex('category_town_overrides_pair_idx').on(t.categoryId, t.townId),
  })
)

// ─── Relations (for Drizzle relational queries) ───────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  listings:      many(listings),
}))

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category:          one(categories, { fields: [subcategories.categoryId], references: [categories.id] }),
  listingSubcategories: many(listingSubcategories),
}))

export const townsRelations = relations(towns, ({ many }) => ({
  listings: many(listings),
}))

export const listingsRelations = relations(listings, ({ one, many }) => ({
  primaryCategory:      one(categories, { fields: [listings.primaryCategoryId], references: [categories.id] }),
  town:                 one(towns,      { fields: [listings.townId],            references: [towns.id]      }),
  listingSubcategories: many(listingSubcategories),
  listingTags:          many(listingTags),
  roundupListings:      many(roundupListings),
}))

export const listingSubcategoriesRelations = relations(listingSubcategories, ({ one }) => ({
  listing:     one(listings,     { fields: [listingSubcategories.listingId],     references: [listings.id]     }),
  subcategory: one(subcategories,{ fields: [listingSubcategories.subcategoryId], references: [subcategories.id]}),
}))

export const listingTagsRelations = relations(listingTags, ({ one }) => ({
  listing: one(listings, { fields: [listingTags.listingId], references: [listings.id] }),
  tag:     one(tags,     { fields: [listingTags.tagId],     references: [tags.id]     }),
}))

export const roundupsRelations = relations(roundups, ({ many }) => ({
  roundupListings: many(roundupListings),
}))

export const roundupListingsRelations = relations(roundupListings, ({ one }) => ({
  roundup: one(roundups,  { fields: [roundupListings.roundupId],  references: [roundups.id]  }),
  listing: one(listings,  { fields: [roundupListings.listingId],  references: [listings.id]  }),
}))
