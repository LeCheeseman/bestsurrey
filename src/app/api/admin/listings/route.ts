import { NextRequest, NextResponse } from 'next/server'
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { adminToolsDisabledResponse, adminToolsEnabled } from '@/lib/admin-tools'
import { db } from '@/lib/db'
import { categories, listingSubcategories, listings, subcategories, towns } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const statusValues = ['draft', 'review', 'published', 'unpublished'] as const

export async function GET(request: NextRequest) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q')?.trim()
  const town = searchParams.get('town')?.trim()
  const category = searchParams.get('category')?.trim()
  const status = searchParams.get('status')?.trim()
  const image = searchParams.get('image')?.trim()
  const issue = searchParams.get('issue')?.trim()
  const requestedLimit = Number(searchParams.get('limit') ?? 500)
  const requestedOffset = Number(searchParams.get('offset') ?? 0)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 1000) : 500
  const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0
  const hasIssueFilter = Boolean(issue && issue !== 'all')

  const conditions = []
  if (q) {
    conditions.push(or(ilike(listings.name, `%${q}%`), ilike(listings.slug, `%${q}%`), ilike(listings.postcode, `%${q}%`)))
  }
  if (town) conditions.push(eq(towns.slug, town))
  if (category) conditions.push(eq(categories.slug, category))
  if (status && statusValues.includes(status as (typeof statusValues)[number])) {
    conditions.push(eq(listings.status, status as (typeof statusValues)[number]))
  }
  if (image === 'missing') {
    conditions.push(sql`(${listings.images} is null or jsonb_typeof(${listings.images}) <> 'array' or jsonb_array_length(${listings.images}) = 0)`)
  }
  if (image === 'present') {
    conditions.push(sql`(${listings.images} is not null and jsonb_typeof(${listings.images}) = 'array' and jsonb_array_length(${listings.images}) > 0)`)
  }
  const where = conditions.length ? and(...conditions) : undefined
  const rows = await db
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
      faq: listings.faq,
      images: listings.images,
      status: listings.status,
      verified: listings.verified,
      editorialNotes: listings.editorialNotes,
      familyFriendly: listings.familyFriendly,
      priceBand: listings.priceBand,
      townId: towns.id,
      townName: towns.name,
      townSlug: towns.slug,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .innerJoin(towns, eq(listings.townId, towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(where)
    .orderBy(asc(towns.name), asc(categories.name), desc(listings.status), asc(listings.name))
    .limit(hasIssueFilter ? 1000 : limit)
    .offset(hasIssueFilter ? 0 : offset)

  const ids = rows.map((row) => row.id)
  const subcategoryRows = ids.length
    ? await db
        .select({
          listingId: listingSubcategories.listingId,
          id: subcategories.id,
          name: subcategories.name,
          slug: subcategories.slug,
        })
        .from(listingSubcategories)
        .innerJoin(subcategories, eq(listingSubcategories.subcategoryId, subcategories.id))
        .where(inArray(listingSubcategories.listingId, ids))
        .orderBy(asc(subcategories.name))
    : []

  const byListing = new Map<string, Array<{ id: string; name: string; slug: string }>>()
  for (const row of subcategoryRows) {
    byListing.set(row.listingId, [...(byListing.get(row.listingId) ?? []), { id: row.id, name: row.name, slug: row.slug }])
  }

  const publishedRows = await db
    .select({
      id: listings.id,
      name: listings.name,
      townId: listings.townId,
      websiteUrl: listings.websiteUrl,
    })
    .from(listings)
    .where(eq(listings.status, 'published'))

  const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const nameTownCounts = new Map<string, number>()
  const websiteCounts = new Map<string, number>()
  for (const row of publishedRows) {
    const nameKey = `${row.townId}:${normalizeName(row.name)}`
    nameTownCounts.set(nameKey, (nameTownCounts.get(nameKey) ?? 0) + 1)
    const website = row.websiteUrl?.trim()
    if (website) websiteCounts.set(website, (websiteCounts.get(website) ?? 0) + 1)
  }

  function issueFlags(row: (typeof rows)[number]) {
    const flags: string[] = []
    const images = row.images
    const faq = row.faq
    const website = row.websiteUrl?.trim() ?? ''
    if (!website) flags.push('missing_website')
    if (website.includes('collectivelycamberley.co.uk/business/camberley-public-house')) flags.push('dead_website')
    if (images && !Array.isArray(images)) flags.push('invalid_image_json')
    if (!Array.isArray(images) || images.length === 0) flags.push('missing_image')
    if (!Array.isArray(faq) || faq.length === 0) flags.push('missing_faq')
    if ((row.shortSummary?.length ?? 0) < 80) flags.push('thin_summary')
    if ((row.longDescription?.length ?? 0) < 250) flags.push('thin_description')
    if ((nameTownCounts.get(`${row.townId}:${normalizeName(row.name)}`) ?? 0) > 1) flags.push('duplicate_name_town')
    if (website && (websiteCounts.get(website) ?? 0) > 1) flags.push('shared_website')
    return flags
  }

  const listingPayload = rows.map((row) => {
    const flags = issueFlags(row)
    return {
      ...row,
      images: Array.isArray(row.images) ? row.images : [],
      issueFlags: flags,
      issueCount: flags.length,
      subcategories: byListing.get(row.id) ?? [],
    }
  })

  const filteredPayload = listingPayload
    .filter((row) => {
      if (!issue || issue === 'all') return true
      if (issue === 'has_issues') return row.issueFlags.length > 0
      return row.issueFlags.includes(issue)
    })
  const pagedPayload = hasIssueFilter ? filteredPayload.slice(offset, offset + limit) : filteredPayload

  return NextResponse.json({
    listings: pagedPayload,
    paging: { limit, offset, count: pagedPayload.length, total: filteredPayload.length },
  })
}
