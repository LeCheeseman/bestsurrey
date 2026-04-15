/**
 * Core upsert pipeline.
 *
 * Takes normalised ListingImportRecord[], resolves slug references to DB IDs,
 * computes completeness scores, and upserts listings + junction table rows.
 *
 * Idempotent: re-running with the same slugs updates rather than duplicates.
 * Junction rows (subcategories, tags) are replaced wholesale on each run.
 */

import { db } from '@/lib/db'
import {
  listings, towns, categories, subcategories, tags,
  listingSubcategories, listingTags,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { computeCompletenessScore } from '@/lib/completeness'
import type { ListingImportRecord, ImportResult, ImportReport } from './types'
import type { ListingImage, OpeningHours, FaqItem } from '@/types'

// ─── Coercion helpers ─────────────────────────────────────────────────────────

function parseBool(val: string | undefined): boolean | null {
  if (!val?.trim()) return null
  return ['true', '1', 'yes'].includes(val.toLowerCase())
}

function parsePipe(val: string | undefined): string[] {
  if (!val?.trim()) return []
  return val.split('|').map((s) => s.trim()).filter(Boolean)
}

function parseJson<T>(val: string | undefined): T | null {
  if (!val?.trim()) return null
  try { return JSON.parse(val) as T } catch { return null }
}

function parseImages(val: string | undefined): ListingImage[] | null {
  if (!val?.trim()) return null
  // Single URL string → wrap as primary image
  if (!val.trim().startsWith('[')) {
    return [{ url: val.trim(), alt: '', isPrimary: true }]
  }
  return parseJson<ListingImage[]>(val)
}

// ─── Main upsert ──────────────────────────────────────────────────────────────

export async function upsertListings(
  records: ListingImportRecord[],
  options: { dryRun?: boolean } = {}
): Promise<ImportReport> {
  const { dryRun = false } = options

  // ── Pre-fetch all taxonomy rows (slug → ID maps) ──────────────────────────
  const [allTowns, allCategories, allSubcategories, allTags] = await Promise.all([
    db.select({ id: towns.id, slug: towns.slug }).from(towns),
    db.select({ id: categories.id, slug: categories.slug }).from(categories),
    db.select({ id: subcategories.id, slug: subcategories.slug }).from(subcategories),
    db.select({ id: tags.id, slug: tags.slug }).from(tags),
  ])

  const townBySlug     = Object.fromEntries(allTowns.map((t) => [t.slug, t.id]))
  const categoryBySlug = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))
  const subBySlug      = Object.fromEntries(allSubcategories.map((s) => [s.slug, s.id]))
  const tagBySlug      = Object.fromEntries(allTags.map((t) => [t.slug, t.id]))

  const results: ImportResult[] = []

  for (const r of records) {
    try {
      // ── Resolve required foreign keys ─────────────────────────────────────
      const townId     = townBySlug[r.town_slug]
      const categoryId = categoryBySlug[r.category_slug]

      if (!townId) {
        results.push({ slug: r.slug, action: 'error', message: `Unknown town_slug: "${r.town_slug}"` })
        continue
      }
      if (!categoryId) {
        results.push({ slug: r.slug, action: 'error', message: `Unknown category_slug: "${r.category_slug}"` })
        continue
      }

      // ── Parse content fields ──────────────────────────────────────────────
      const images       = parseImages(r.images)
      const openingHours = parseJson<OpeningHours>(r.opening_hours)
      const faq          = parseJson<FaqItem[]>(r.faq)
      const highlights   = parsePipe(r.highlights)
      const bestFor      = parsePipe(r.best_for)
      const amenities    = parsePipe(r.amenities)

      const completenessScore = computeCompletenessScore({
        shortSummary:    r.short_summary    ?? null,
        longDescription: r.long_description ?? null,
        whyWeLikeIt:     r.why_we_like_it   ?? null,
        highlights:      highlights.length > 0 ? highlights : null,
        images:          images ?? null,
        openingHours:    openingHours ?? null,
        faq:             faq ?? null,
        websiteUrl:      r.website_url   ?? null,
        phoneNumber:     r.phone_number  ?? null,
        addressLine1:    r.address_line1 ?? null,
        postcode:        r.postcode      ?? null,
        latitude:        r.latitude      ?? null,
        longitude:       r.longitude     ?? null,
      })

      // ── Build the listing row ─────────────────────────────────────────────
      const row = {
        name:              r.name.trim(),
        slug:              r.slug.trim(),
        entityType:        r.entity_type as 'restaurant' | 'cafe' | 'attraction' | 'activity-venue' | 'place',
        primaryCategoryId: categoryId,
        townId,
        status:            (r.status ?? 'draft') as 'draft' | 'review' | 'published' | 'unpublished',

        addressLine1:  r.address_line1  ?? null,
        addressLine2:  r.address_line2  ?? null,
        postcode:      r.postcode       ?? null,
        latitude:      r.latitude       ?? null,
        longitude:     r.longitude      ?? null,

        websiteUrl:    r.website_url    ?? null,
        phoneNumber:   r.phone_number   ?? null,

        shortSummary:    r.short_summary    ?? null,
        longDescription: r.long_description ?? null,
        whyWeLikeIt:     r.why_we_like_it   ?? null,
        highlights:      highlights.length > 0 ? highlights : null,
        bestFor:         bestFor.length > 0    ? bestFor    : null,
        amenities:       amenities.length > 0  ? amenities  : null,
        images,
        openingHours,
        faq,

        familyFriendly:       parseBool(r.family_friendly),
        dogFriendly:          parseBool(r.dog_friendly),
        veganFriendly:        parseBool(r.vegan_friendly),
        vegetarianFriendly:   parseBool(r.vegetarian_friendly),
        wheelchairAccessible: parseBool(r.wheelchair_accessible),
        indoor:               parseBool(r.indoor),
        outdoor:              parseBool(r.outdoor),
        goodForGroups:        parseBool(r.good_for_groups),
        bookingRequired:      parseBool(r.booking_required),

        priceBand: (r.price_band || null) as '£' | '££' | '£££' | '££££' | null,
        parking:   (r.parking    || null) as 'free' | 'paid' | 'street' | 'none' | null,

        featured:  parseBool(r.featured)  ?? false,
        sponsored: parseBool(r.sponsored) ?? false,

        editorialScore:   r.editorial_score   ? parseInt(r.editorial_score,   10) : 5,
        categoryFitScore: r.category_fit_score ? parseInt(r.category_fit_score, 10) : 5,
        reviewScore:      r.review_score ?? null,
        reviewCount:      r.review_count ? parseInt(r.review_count, 10) : 0,
        completenessScore,
        // ranking_score recomputed by DB trigger on insert/update
      }

      if (dryRun) {
        results.push({ slug: r.slug, action: 'skipped', message: 'dry-run' })
        continue
      }

      // ── Upsert the listing row ─────────────────────────────────────────────
      const existing = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.slug, r.slug))
        .limit(1)

      let listingId: string

      if (existing[0]) {
        await db
          .update(listings)
          .set({ ...row, updatedAt: new Date() })
          .where(eq(listings.id, existing[0].id))
        listingId = existing[0].id
        results.push({ slug: r.slug, action: 'updated' })
      } else {
        const inserted = await db
          .insert(listings)
          .values(row)
          .returning({ id: listings.id })
        listingId = inserted[0].id
        results.push({ slug: r.slug, action: 'inserted' })
      }

      // ── Replace subcategory junction rows ─────────────────────────────────
      await db.delete(listingSubcategories).where(eq(listingSubcategories.listingId, listingId))
      const subcategoryIds = parsePipe(r.subcategory_slugs)
        .map((s) => subBySlug[s])
        .filter((id): id is string => !!id)
      if (subcategoryIds.length > 0) {
        await db.insert(listingSubcategories).values(
          subcategoryIds.map((subcategoryId) => ({ listingId, subcategoryId }))
        )
      }

      // ── Replace tag junction rows ─────────────────────────────────────────
      await db.delete(listingTags).where(eq(listingTags.listingId, listingId))
      const tagIds = parsePipe(r.tag_slugs)
        .map((s) => tagBySlug[s])
        .filter((id): id is string => !!id)
      if (tagIds.length > 0) {
        await db.insert(listingTags).values(
          tagIds.map((tagId) => ({ listingId, tagId }))
        )
      }

    } catch (err) {
      results.push({
        slug:    r.slug ?? '(unknown)',
        action:  'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    total:    results.length,
    inserted: results.filter((r) => r.action === 'inserted').length,
    updated:  results.filter((r) => r.action === 'updated').length,
    skipped:  results.filter((r) => r.action === 'skipped').length,
    errors:   results.filter((r) => r.action === 'error').length,
    results,
  }
}
