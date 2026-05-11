/**
 * Taxonomy query functions — category/town metadata and listing counts.
 * Used to populate "browse by town" rows, category tiles with counts, etc.
 */

import { db } from '@/lib/db'
import { listings, categories, subcategories, towns, categoryTownOverrides, listingCategories, listingSubcategories } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import type { CategorySlug, SubcategorySlug, TownSlug } from '@/lib/taxonomy/constants'

export const MIN_INDEXABLE_LISTINGS_BY_CATEGORY: Record<CategorySlug, number> = {
  restaurants:       5,
  'pubs-bars':       5,
  'cafes-brunch':    5,
  'things-to-do':    5,
  'kids-family':     4,
  'indoor-activities': 3,
}

export function getMinIndexableListings(categorySlug: string): number {
  return MIN_INDEXABLE_LISTINGS_BY_CATEGORY[categorySlug as CategorySlug] ?? 5
}

// ─── Listing counts ────────────────────────────────────────────────────────────

/** Returns published listing count per category slug. */
export async function getListingCountsByCategory(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      slug:  categories.slug,
      total: count(listings.id),
    })
    .from(categories)
    .leftJoin(listingCategories, eq(listingCategories.categoryId, categories.id))
    .leftJoin(listings, and(
      eq(listings.id, listingCategories.listingId),
      eq(listings.status, 'published')
    ))
    .groupBy(categories.slug)

  return Object.fromEntries(rows.map((r) => [r.slug, r.total]))
}

/** Returns published listing count per town slug. */
export async function getListingCountsByTown(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      slug:  towns.slug,
      total: count(listings.id),
    })
    .from(towns)
    .leftJoin(listings, and(
      eq(listings.townId,   towns.id),
      eq(listings.status,  'published')
    ))
    .groupBy(towns.slug)

  return Object.fromEntries(rows.map((r) => [r.slug, r.total]))
}

/** Returns published listing count for a specific town + category combination. */
export async function getListingCountForTownCategory(
  townSlug: string,
  categorySlug: string
): Promise<number> {
  const rows = await db
    .select({ total: count(listings.id) })
    .from(listingCategories)
    .innerJoin(listings, eq(listingCategories.listingId, listings.id))
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listingCategories.categoryId, categories.id))
    .where(and(
      eq(listings.status,  'published'),
      eq(towns.slug,       townSlug),
      eq(categories.slug,  categorySlug)
    ))

  return rows[0]?.total ?? 0
}

/** Returns town/category pages that have enough listings to be worth indexing. */
export async function getIndexableTownCategoryParams(): Promise<Array<{ slug: TownSlug; category: CategorySlug; count: number }>> {
  const rows = await db
    .select({
      slug:     towns.slug,
      category: categories.slug,
      total:    count(listings.id),
    })
    .from(listingCategories)
    .innerJoin(listings, eq(listingCategories.listingId, listings.id))
    .innerJoin(towns,      eq(listings.townId,            towns.id))
    .innerJoin(categories, eq(listingCategories.categoryId, categories.id))
    .where(eq(listings.status, 'published'))
    .groupBy(towns.slug, categories.slug)

  return rows
    .filter((row) => row.total >= getMinIndexableListings(row.category))
    .map((row) => ({
      slug:     row.slug as TownSlug,
      category: row.category as CategorySlug,
      count:    row.total,
    }))
}

/** Returns county-wide subcategory pages with at least one published listing. */
export async function getIndexableSubcategorySlugs(): Promise<SubcategorySlug[]> {
  const rows = await db
    .select({
      slug:  subcategories.slug,
      total: count(listings.id),
    })
    .from(subcategories)
    .innerJoin(listingSubcategories, eq(listingSubcategories.subcategoryId, subcategories.id))
    .innerJoin(listings, eq(listingSubcategories.listingId, listings.id))
    .where(eq(listings.status, 'published'))
    .groupBy(subcategories.slug)
    .having(sql`count(${listings.id}) > 0`)

  return rows.map((row) => row.slug as SubcategorySlug)
}

/**
 * Returns town slugs that have at least one published listing for a given category.
 * Used to render the "Browse by town" row on category pages.
 */
export async function getTownsWithListingsForCategory(
  categorySlug: string
): Promise<Array<{ slug: string; name: string; count: number }>> {
  const rows = await db
    .select({
      slug:  towns.slug,
      name:  towns.name,
      total: count(listings.id),
    })
    .from(towns)
    .innerJoin(listings,   eq(listings.townId,            towns.id))
    .innerJoin(listingCategories, eq(listingCategories.listingId, listings.id))
    .innerJoin(categories, eq(listingCategories.categoryId, categories.id))
    .where(and(
      eq(listings.status,  'published'),
      eq(categories.slug,  categorySlug)
    ))
    .groupBy(towns.slug, towns.name)
    .having(sql`count(${listings.id}) > 0`)

  return rows.map((r) => ({ slug: r.slug, name: r.name, count: r.total }))
}

/**
 * Returns subcategories for a category that have at least one published listing.
 * Used to render subcategory filter pills on category and town+category pages.
 */
export async function getActiveSubcategoriesForCategory(
  categorySlug: string
): Promise<Array<{ slug: string; name: string }>> {
  const rows = await db
    .select({
      slug: subcategories.slug,
      name: subcategories.name,
    })
    .from(subcategories)
    .innerJoin(categories, eq(subcategories.categoryId, categories.id))
    .where(eq(categories.slug, categorySlug))
    .orderBy(subcategories.sortOrder)

  return rows
}

// ─── Editorial overrides ──────────────────────────────────────────────────────

/**
 * Returns the published editorial override for a town+category page, if one exists.
 * Pages fall back to generated intro copy when no override is set.
 */
export async function getCategoryTownOverride(
  townSlug: string,
  categorySlug: string
): Promise<{ intro: string | null; metaTitle: string | null; metaDescription: string | null } | null> {
  const rows = await db
    .select({
      intro:           categoryTownOverrides.intro,
      metaTitle:       categoryTownOverrides.metaTitle,
      metaDescription: categoryTownOverrides.metaDescription,
    })
    .from(categoryTownOverrides)
    .innerJoin(towns,      eq(categoryTownOverrides.townId,      towns.id))
    .innerJoin(categories, eq(categoryTownOverrides.categoryId,  categories.id))
    .where(and(
      eq(categoryTownOverrides.status, 'published'),
      eq(towns.slug,      townSlug),
      eq(categories.slug, categorySlug)
    ))
    .limit(1)

  return rows[0] ?? null
}
