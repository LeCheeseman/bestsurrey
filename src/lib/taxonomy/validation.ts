/**
 * Slug collision prevention — explicit runtime safeguards.
 *
 * Town slugs and category slugs share the top-level URL namespace:
 *   /guildford/   → town hub
 *   /restaurants/ → category index
 *
 * Both are handled by app/[slug]/page.tsx. If a slug existed in both lists,
 * the router would silently resolve to whichever came first in generateStaticParams,
 * breaking the other entirely.
 *
 * This module throws loudly at module load time (i.e. on every build and dev
 * server start) if a collision is detected, making it impossible to deploy a
 * broken slug configuration.
 *
 * The DB also enforces this via trigger (see migration 0001_initial.sql —
 * enforce_town_category_slug_uniqueness). Defence in depth: fail in code,
 * fail in DB.
 */

import {
  TOWN_SLUGS,
  CATEGORY_SLUGS,
  SUBCATEGORY_SLUGS,
  type TownSlug,
  type CategorySlug,
  type SubcategorySlug,
} from './constants'

// ─── Collision check ──────────────────────────────────────────────────────────
// Runs once at module load time. Throws if town and category slug sets overlap.

const townSet = new Set<string>(TOWN_SLUGS)
const categorySet = new Set<string>(CATEGORY_SLUGS)
const subcategorySet = new Set<string>(SUBCATEGORY_SLUGS)

const townCategoryOverlap = TOWN_SLUGS.filter((s) => categorySet.has(s))
if (townCategoryOverlap.length > 0) {
  throw new Error(
    `[Taxonomy] Slug collision: the following slugs exist in both TOWNS and CATEGORIES: ` +
    `${townCategoryOverlap.join(', ')}. ` +
    `Town and category slugs must be unique across both lists.`
  )
}

// Subcategory slugs don't share the top-level namespace, but they must be
// unique within their own list. The DB unique constraint handles this, but
// a dev-time check is faster feedback.
const subcategoryDuplicates = SUBCATEGORY_SLUGS.filter(
  (s, i) => SUBCATEGORY_SLUGS.indexOf(s) !== i
)
if (subcategoryDuplicates.length > 0) {
  throw new Error(
    `[Taxonomy] Duplicate subcategory slugs: ${subcategoryDuplicates.join(', ')}`
  )
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isTownSlug(slug: string): slug is TownSlug {
  return townSet.has(slug)
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return categorySet.has(slug)
}

export function isSubcategorySlug(slug: string): slug is SubcategorySlug {
  return subcategorySet.has(slug)
}

/**
 * Classifies a top-level slug as 'town', 'category', or null.
 * Used by app/[slug]/page.tsx to dispatch to the correct template.
 */
export function classifyTopLevelSlug(
  slug: string
): { type: 'town'; slug: TownSlug } | { type: 'category'; slug: CategorySlug } | null {
  if (isTownSlug(slug)) return { type: 'town', slug }
  if (isCategorySlug(slug)) return { type: 'category', slug }
  return null
}

/**
 * Returns all valid [slug, category] param combinations for the
 * town + category route (app/[slug]/[category]/page.tsx).
 * Only towns × categories — never category × category or town × town.
 */
export function getTownCategoryParams(): Array<{ slug: TownSlug; category: CategorySlug }> {
  const params: Array<{ slug: TownSlug; category: CategorySlug }> = []
  for (const town of TOWN_SLUGS) {
    for (const category of CATEGORY_SLUGS) {
      params.push({ slug: town, category })
    }
  }
  return params
}
