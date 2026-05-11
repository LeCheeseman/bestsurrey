import { NextRequest, NextResponse } from 'next/server'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import { adminToolsDisabledResponse, adminToolsEnabled, normalizeSlug } from '@/lib/admin-tools'
import { db } from '@/lib/db'
import { categories, listingCategories, listingSubcategories, listings, subcategories, towns } from '@/lib/db/schema'
import type { FaqItem, ListingImage } from '@/types/db-shapes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MergeBody = {
  sourceSlug?: string
}

function mergeArrays<T>(target: T[] | null | undefined, source: T[] | null | undefined) {
  return [...(Array.isArray(target) ? target : []), ...(Array.isArray(source) ? source : [])]
}

function betterText(target: string | null, source: string | null) {
  if (!target?.trim()) return source
  if (!source?.trim()) return target
  return source.length > target.length ? source : target
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const targetSlug = normalizeSlug(params.slug)
  const body = (await request.json()) as MergeBody
  const sourceSlug = normalizeSlug(body.sourceSlug ?? '')

  if (!sourceSlug) return NextResponse.json({ error: 'sourceSlug is required.' }, { status: 400 })
  if (sourceSlug === targetSlug) return NextResponse.json({ error: 'Cannot merge a listing into itself.' }, { status: 400 })

  const [target] = await db.select().from(listings).where(eq(listings.slug, targetSlug)).limit(1)
  const [source] = await db.select().from(listings).where(eq(listings.slug, sourceSlug)).limit(1)
  if (!target || !source) return NextResponse.json({ error: 'Target or source listing not found.' }, { status: 404 })

  const targetSubcategories = await db
    .select({ subcategoryId: listingSubcategories.subcategoryId })
    .from(listingSubcategories)
    .where(eq(listingSubcategories.listingId, target.id))
  const sourceSubcategories = await db
    .select({ subcategoryId: listingSubcategories.subcategoryId })
    .from(listingSubcategories)
    .where(eq(listingSubcategories.listingId, source.id))
  const mergedSubcategoryIds = [
    ...new Set([...targetSubcategories, ...sourceSubcategories].map((row) => row.subcategoryId)),
  ]

  await db.delete(listingSubcategories).where(eq(listingSubcategories.listingId, target.id))
  if (mergedSubcategoryIds.length > 0) {
    await db.insert(listingSubcategories).values(
      mergedSubcategoryIds.map((subcategoryId) => ({
        listingId: target.id,
        subcategoryId,
      })),
    )
  }

  const targetCategories = await db
    .select({ categoryId: listingCategories.categoryId, isPrimary: listingCategories.isPrimary })
    .from(listingCategories)
    .where(eq(listingCategories.listingId, target.id))
  const sourceCategories = await db
    .select({ categoryId: listingCategories.categoryId, isPrimary: listingCategories.isPrimary })
    .from(listingCategories)
    .where(eq(listingCategories.listingId, source.id))

  const orderedCategoryIds = [
    ...targetCategories.filter((row) => row.isPrimary).map((row) => row.categoryId),
    ...targetCategories.filter((row) => !row.isPrimary).map((row) => row.categoryId),
    ...sourceCategories.filter((row) => row.isPrimary).map((row) => row.categoryId),
    ...sourceCategories.filter((row) => !row.isPrimary).map((row) => row.categoryId),
    target.primaryCategoryId,
    source.primaryCategoryId,
  ]
  const mergedCategoryIds = [...new Set(orderedCategoryIds)]

  await db.delete(listingCategories).where(eq(listingCategories.listingId, target.id))
  await db.insert(listingCategories).values(
    mergedCategoryIds.map((categoryId, index) => ({
      listingId: target.id,
      categoryId,
      isPrimary: index === 0,
    })),
  )

  const mergedImages = mergeArrays<ListingImage>(target.images, source.images)
  const mergedFaq = mergeArrays<FaqItem>(target.faq, source.faq)
  const notes = [
    target.editorialNotes,
    `Merged duplicate listing "${source.name}" (${source.slug}) into this listing on ${new Date().toISOString().slice(0, 10)}.`,
  ]
    .filter(Boolean)
    .join('\n\n')

  await db
    .update(listings)
    .set({
      websiteUrl: target.websiteUrl || source.websiteUrl || null,
      phoneNumber: target.phoneNumber || source.phoneNumber || null,
      addressLine1: target.addressLine1 || source.addressLine1 || null,
      addressLine2: target.addressLine2 || source.addressLine2 || null,
      postcode: target.postcode || source.postcode || null,
      latitude: target.latitude || source.latitude || null,
      longitude: target.longitude || source.longitude || null,
      shortSummary: betterText(target.shortSummary, source.shortSummary),
      longDescription: betterText(target.longDescription, source.longDescription),
      images: mergedImages.length > 0 ? mergedImages : null,
      faq: mergedFaq.length > 0 ? mergedFaq : null,
      familyFriendly: target.familyFriendly ?? source.familyFriendly,
      dogFriendly: target.dogFriendly ?? source.dogFriendly,
      veganFriendly: target.veganFriendly ?? source.veganFriendly,
      vegetarianFriendly: target.vegetarianFriendly ?? source.vegetarianFriendly,
      wheelchairAccessible: target.wheelchairAccessible ?? source.wheelchairAccessible,
      indoor: target.indoor ?? source.indoor,
      outdoor: target.outdoor ?? source.outdoor,
      goodForGroups: target.goodForGroups ?? source.goodForGroups,
      bookingRequired: target.bookingRequired ?? source.bookingRequired,
      parking: target.parking || source.parking || null,
      priceBand: target.priceBand || source.priceBand || null,
      editorialNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, target.id))

  await db
    .update(listings)
    .set({
      status: 'unpublished',
      verified: false,
      editorialNotes: [source.editorialNotes, `Merged into ${target.slug} on ${new Date().toISOString().slice(0, 10)}.`]
        .filter(Boolean)
        .join('\n\n'),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, source.id))

  await db.delete(listingSubcategories).where(inArray(listingSubcategories.listingId, [source.id]))
  await db.delete(listingCategories).where(inArray(listingCategories.listingId, [source.id]))

  const [merged] = await db
    .select({
      id: listings.id,
      name: listings.name,
      slug: listings.slug,
      entityType: listings.entityType,
      websiteUrl: listings.websiteUrl,
      phoneNumber: listings.phoneNumber,
      addressLine1: listings.addressLine1,
      postcode: listings.postcode,
      latitude: listings.latitude,
      longitude: listings.longitude,
      shortSummary: listings.shortSummary,
      longDescription: listings.longDescription,
      images: listings.images,
      status: listings.status,
      verified: listings.verified,
      editorialNotes: listings.editorialNotes,
      familyFriendly: listings.familyFriendly,
      priceBand: listings.priceBand,
      townName: towns.name,
      townSlug: towns.slug,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(listings)
    .innerJoin(towns, eq(listings.townId, towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(eq(listings.id, target.id))
    .limit(1)

  const subcategoryRows = await db
    .select({ id: subcategories.id, name: subcategories.name, slug: subcategories.slug })
    .from(listingSubcategories)
    .innerJoin(subcategories, eq(listingSubcategories.subcategoryId, subcategories.id))
    .where(eq(listingSubcategories.listingId, target.id))

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, isPrimary: listingCategories.isPrimary })
    .from(listingCategories)
    .innerJoin(categories, eq(listingCategories.categoryId, categories.id))
    .where(eq(listingCategories.listingId, target.id))
    .orderBy(desc(listingCategories.isPrimary), asc(categories.sortOrder), asc(categories.name))

  return NextResponse.json({
    ok: true,
    targetSlug: target.slug,
    sourceSlug: source.slug,
    listing: merged
      ? {
          ...merged,
          images: Array.isArray(merged.images) ? merged.images : [],
          issueFlags: [],
          issueCount: 0,
          duplicateNameMatches: [],
          sharedWebsiteMatches: [],
          categories: categoryRows,
          subcategories: subcategoryRows,
        }
      : null,
  })
}
