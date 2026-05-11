import { NextRequest, NextResponse } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { adminToolsDisabledResponse, adminToolsEnabled, normalizeSlug } from '@/lib/admin-tools'
import { db } from '@/lib/db'
import { categories, listingSubcategories, listings, subcategories } from '@/lib/db/schema'
import type { ListingImage } from '@/types/db-shapes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'review', 'published', 'unpublished'] as const

type PatchBody = {
  name?: string
  websiteUrl?: string | null
  phoneNumber?: string | null
  addressLine1?: string | null
  postcode?: string | null
  shortSummary?: string | null
  longDescription?: string | null
  familyFriendly?: boolean | null
  priceBand?: string | null
  status?: string
  verified?: boolean
  editorialNotes?: string | null
  categorySlug?: string
  subcategorySlugs?: string[]
  images?: ListingImage[]
}

const priceBands = ['£', '££', '£££', '££££'] as const

function optionalText(value: string | null | undefined) {
  if (value === undefined) return undefined
  const trimmed = value?.trim() ?? ''
  return trimmed || null
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const body = (await request.json()) as PatchBody
  const slug = normalizeSlug(params.slug)
  const update: Partial<typeof listings.$inferInsert> = { updatedAt: new Date() }

  if (body.status !== undefined) {
    if (!statusValues.includes(body.status as (typeof statusValues)[number])) {
      return NextResponse.json({ error: 'Invalid listing status.' }, { status: 400 })
    }
    update.status = body.status as (typeof statusValues)[number]
  }
  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) return NextResponse.json({ error: 'Name cannot be blank.' }, { status: 400 })
    update.name = name
  }
  if (body.websiteUrl !== undefined) update.websiteUrl = optionalText(body.websiteUrl)
  if (body.phoneNumber !== undefined) update.phoneNumber = optionalText(body.phoneNumber)
  if (body.addressLine1 !== undefined) update.addressLine1 = optionalText(body.addressLine1)
  if (body.postcode !== undefined) update.postcode = optionalText(body.postcode)
  if (body.shortSummary !== undefined) update.shortSummary = optionalText(body.shortSummary)
  if (body.longDescription !== undefined) update.longDescription = optionalText(body.longDescription)
  if (body.familyFriendly !== undefined) update.familyFriendly = body.familyFriendly
  if (body.priceBand !== undefined) {
    if (body.priceBand === null || body.priceBand === '') {
      update.priceBand = null
    } else if (priceBands.includes(body.priceBand as (typeof priceBands)[number])) {
      update.priceBand = body.priceBand as (typeof priceBands)[number]
    } else {
      return NextResponse.json({ error: 'Invalid price band.' }, { status: 400 })
    }
  }
  if (body.verified !== undefined) update.verified = body.verified
  if (body.editorialNotes !== undefined) update.editorialNotes = body.editorialNotes || null
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) return NextResponse.json({ error: 'Images must be an array.' }, { status: 400 })
    update.images = body.images.map((image, index) => ({
      url: image.url,
      alt: image.alt || '',
      caption: image.caption || '',
      isPrimary: index === 0,
      sourceUrl: image.sourceUrl || '',
      sourceType: image.sourceType || '',
    }))
  }

  if (body.categorySlug) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, body.categorySlug)).limit(1)
    if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
    update.primaryCategoryId = category.id
  }

  const [listing] = await db.update(listings).set(update).where(eq(listings.slug, slug)).returning({ id: listings.id, slug: listings.slug })
  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })

  if (Array.isArray(body.subcategorySlugs)) {
    await db.delete(listingSubcategories).where(eq(listingSubcategories.listingId, listing.id))
    const cleanedSlugs = [...new Set(body.subcategorySlugs.map(normalizeSlug).filter(Boolean))]
    if (cleanedSlugs.length > 0) {
      const subcategoryRows = await db
        .select({ id: subcategories.id })
        .from(subcategories)
        .where(inArray(subcategories.slug, cleanedSlugs))
      if (subcategoryRows.length !== cleanedSlugs.length) {
        return NextResponse.json({ error: 'One or more subcategory slugs were not found.' }, { status: 400 })
      }
      await db.insert(listingSubcategories).values(
        subcategoryRows.map((subcategory) => ({
          listingId: listing.id,
          subcategoryId: subcategory.id,
        })),
      )
    }
  }

  return NextResponse.json({ ok: true, slug: listing.slug })
}
