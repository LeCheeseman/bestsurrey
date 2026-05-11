import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { adminToolsDisabledResponse, adminToolsEnabled, normalizeSlug } from '@/lib/admin-tools'
import { db } from '@/lib/db'
import { categories, listingSubcategories, listings, towns } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, { params }: { params: { slug: string } }) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const slug = normalizeSlug(params.slug)
  if (!slug) return NextResponse.json({ error: 'Listing slug is required.' }, { status: 400 })

  const [listing] = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      name: listings.name,
      townSlug: towns.slug,
      categorySlug: categories.slug,
    })
    .from(listings)
    .innerJoin(towns, eq(listings.townId, towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(eq(listings.slug, slug))
    .limit(1)

  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })

  await db
    .update(listings)
    .set({
      status: 'unpublished',
      verified: false,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listing.id))

  await db.delete(listingSubcategories).where(eq(listingSubcategories.listingId, listing.id))

  revalidatePath(`/listings/${listing.slug}`)
  revalidatePath(`/${listing.townSlug}/${listing.categorySlug}`)
  revalidatePath(`/${listing.categorySlug}`)
  revalidatePath('/')
  revalidatePath('/search')

  return NextResponse.json({
    ok: true,
    listing: {
      slug: listing.slug,
      name: listing.name,
      status: 'unpublished',
    },
  })
}
