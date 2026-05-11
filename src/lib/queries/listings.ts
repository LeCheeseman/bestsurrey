/**
 * Listing query functions — used by page Server Components.
 *
 * All public-facing queries filter by status = 'published'.
 * Sponsored listings are returned in the same result set but ListingGrid
 * separates them visually.
 */

import { db } from '@/lib/db'
import { listings, categories, towns, subcategories, listingCategories, listingSubcategories, listingTags, tags } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { ListingCard, ListingWithRelations } from '@/types'

// ─── Shared select shape (matches ListingCard type) ────────────────────────────

const listingCardSelect = {
  id:                   listings.id,
  slug:                 listings.slug,
  name:                 listings.name,
  shortSummary:         listings.shortSummary,
  images:               listings.images,
  priceBand:            listings.priceBand,
  familyFriendly:       listings.familyFriendly,
  dogFriendly:          listings.dogFriendly,
  veganFriendly:        listings.veganFriendly,
  wheelchairAccessible: listings.wheelchairAccessible,
  featured:             listings.featured,
  sponsored:            listings.sponsored,
  rankingScore:         listings.rankingScore,
  town: {
    name: towns.name,
    slug: towns.slug,
  },
  primaryCategory: {
    name: categories.name,
    slug: categories.slug,
  },
}

function listingBelongsToCategory(categorySlug: string) {
  return sql`exists (
    select 1
    from ${listingCategories}
    inner join ${categories} lc on lc.id = ${listingCategories.categoryId}
    where ${listingCategories.listingId} = ${listings.id}
      and lc.slug = ${categorySlug}
  )`
}

// ─── Index page queries ────────────────────────────────────────────────────────

export async function getListingsByCategory(
  categorySlug: string,
  limit = 12
): Promise<ListingCard[]> {
  const rows = await db
    .select(listingCardSelect)
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(
      eq(listings.status,   'published'),
      listingBelongsToCategory(categorySlug)
    ))
    .orderBy(desc(listings.rankingScore))
    .limit(limit)

  return rows as ListingCard[]
}

export async function getListingsByTown(
  townSlug: string,
  limit = 12
): Promise<ListingCard[]> {
  const rows = await db
    .select(listingCardSelect)
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(
      eq(listings.status, 'published'),
      eq(towns.slug,      townSlug)
    ))
    .orderBy(desc(listings.rankingScore))
    .limit(limit)

  return rows as ListingCard[]
}

export async function getListingsByTownAndCategory(
  townSlug: string,
  categorySlug: string,
  limit = 12
): Promise<ListingCard[]> {
  const rows = await db
    .select(listingCardSelect)
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(
      eq(listings.status, 'published'),
      eq(towns.slug,      townSlug),
      listingBelongsToCategory(categorySlug)
    ))
    .orderBy(desc(listings.rankingScore))
    .limit(limit)

  return rows as ListingCard[]
}

export async function getListingsBySubcategory(
  subcategorySlug: string,
  limit = 12
): Promise<ListingCard[]> {
  // Subcategory is a many-to-many join through listing_subcategories
  const sub = await db
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(eq(subcategories.slug, subcategorySlug))
    .limit(1)

  if (!sub[0]) return []

  const rows = await db
    .select(listingCardSelect)
    .from(listings)
    .innerJoin(towns,                eq(listings.townId,                    towns.id))
    .innerJoin(categories,           eq(listings.primaryCategoryId,         categories.id))
    .innerJoin(listingSubcategories, eq(listingSubcategories.listingId,     listings.id))
    .where(and(
      eq(listings.status,                        'published'),
      eq(listingSubcategories.subcategoryId,     sub[0].id)
    ))
    .orderBy(desc(listings.rankingScore))
    .limit(limit)

  return rows as ListingCard[]
}

export async function getFeaturedListings(limit = 6): Promise<ListingCard[]> {
  const rows = await db
    .select(listingCardSelect)
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(
      eq(listings.status,   'published'),
      eq(listings.featured, true)
    ))
    .orderBy(desc(listings.rankingScore))
    .limit(limit)

  return rows as ListingCard[]
}

export async function getRelatedListings(
  townSlug: string,
  categorySlug: string,
  excludeSlug: string,
  limit = 3
): Promise<ListingCard[]> {
  const rows = await db
    .select(listingCardSelect)
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(
      eq(listings.status,   'published'),
      eq(towns.slug,        townSlug),
      eq(categories.slug,   categorySlug)
    ))
    .orderBy(desc(listings.rankingScore))
    .limit(limit + 1) // fetch one extra to exclude current listing

  return (rows as ListingCard[]).filter((l) => l.slug !== excludeSlug).slice(0, limit)
}

// ─── Listing detail query ──────────────────────────────────────────────────────

export async function getListingBySlug(slug: string): Promise<ListingWithRelations | null> {
  const rows = await db
    .select({
      listing:         listings,
      town:            towns,
      primaryCategory: categories,
    })
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(
      eq(listings.slug,   slug),
      eq(listings.status, 'published'),
    ))
    .limit(1)

  if (!rows[0]) return null

  const { listing, town, primaryCategory } = rows[0]

  const [subcategoryRows, tagRows] = await Promise.all([
    db
      .select({ sub: subcategories })
      .from(listingSubcategories)
      .innerJoin(subcategories, eq(listingSubcategories.subcategoryId, subcategories.id))
      .where(eq(listingSubcategories.listingId, listing.id)),
    db
      .select({ tag: tags })
      .from(listingTags)
      .innerJoin(tags, eq(listingTags.tagId, tags.id))
      .where(eq(listingTags.listingId, listing.id)),
  ])

  return {
    ...listing,
    town,
    primaryCategory,
    subcategories: subcategoryRows.map((r) => r.sub),
    tags:          tagRows.map((r) => r.tag),
  }
}

// ─── Static params helper ─────────────────────────────────────────────────────

export async function getPublishedListingSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: listings.slug })
    .from(listings)
    .where(eq(listings.status, 'published'))

  return rows.map((r) => r.slug)
}
