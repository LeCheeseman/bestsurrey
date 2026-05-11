import { NextRequest, NextResponse } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { adminToolsDisabledResponse, adminToolsEnabled, normalizeSlug } from '@/lib/admin-tools'
import { db } from '@/lib/db'
import { categories, listingSubcategories, listings, subcategories } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'review', 'published', 'unpublished'] as const

type PatchBody = {
  status?: string
  verified?: boolean
  editorialNotes?: string | null
  categorySlug?: string
  subcategorySlugs?: string[]
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
  if (body.verified !== undefined) update.verified = body.verified
  if (body.editorialNotes !== undefined) update.editorialNotes = body.editorialNotes || null

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
