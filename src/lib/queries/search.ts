/**
 * Full-text search query using PostgreSQL's built-in FTS.
 *
 * Uses websearch_to_tsquery which accepts natural language input — spaces mean
 * AND, quotes mean phrase, minus means NOT. No external search service needed.
 *
 * Searches across: listing name, short summary, town name, category name.
 * Results ordered by ranking_score descending (curated quality first).
 *
 * If performance becomes a concern at scale, add a generated tsvector column
 * with a GIN index — the query stays identical, only the index changes.
 */

import { db } from '@/lib/db'
import { listings, towns, categories } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { ListingCard } from '@/types'

export async function searchListings(
  query: string,
  options: {
    townSlug?:     string
    categorySlug?: string
    limit?:        number
  } = {}
): Promise<ListingCard[]> {
  const { townSlug, categorySlug, limit = 24 } = options
  const q = query.trim()

  if (q.length < 2) return []

  const rows = await db
    .select({
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
    })
    .from(listings)
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(
      and(
        eq(listings.status, 'published'),
        sql`to_tsvector('english',
          coalesce(${listings.name}, '') || ' ' ||
          coalesce(${listings.shortSummary}, '') || ' ' ||
          coalesce(${towns.name}, '') || ' ' ||
          coalesce(${categories.name}, '')
        ) @@ websearch_to_tsquery('english', ${q})`,
        townSlug     ? eq(towns.slug,      townSlug)     : undefined,
        categorySlug ? eq(categories.slug, categorySlug) : undefined,
      )
    )
    .orderBy(desc(listings.rankingScore))
    .limit(limit)

  return rows as ListingCard[]
}
