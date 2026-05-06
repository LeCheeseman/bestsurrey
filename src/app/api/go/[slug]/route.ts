/**
 * Outbound click tracking — /api/go/[slug]
 *
 * Replaces all direct websiteUrl links for listings. When a user clicks
 * "Visit website", this route:
 *   1. Looks up the listing's external URL
 *   2. Logs the click to listing_clicks (fire-and-forget, non-blocking)
 *   3. 302 redirects to the external URL
 *
 * Falls back to the listing detail page if no websiteUrl is set.
 * Used for all listings — gives consistent click data across sponsored and organic.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { db }           from '@/lib/db'
import { listings, listingClicks } from '@/lib/db/schema'
import { and, eq }      from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const rows = await db
    .select({ id: listings.id, websiteUrl: listings.websiteUrl })
    .from(listings)
    .where(and(
      eq(listings.slug, params.slug),
      eq(listings.status, 'published')
    ))
    .limit(1)

  const listing = rows[0]

  const target = parseSafeExternalUrl(listing?.websiteUrl)

  if (!target) {
    return NextResponse.redirect(new URL(`/listings/${params.slug}`, request.url))
  }

  // Log click — fire-and-forget so it never slows the redirect
  db.insert(listingClicks).values({
    listingId: listing.id,
    eventType: 'website_click',
    pagePath:  request.headers.get('referer')
                 ? new URL(request.headers.get('referer')!).pathname
                 : null,
    referer:   request.headers.get('referer'),
  }).catch(() => { /* non-critical */ })

  return NextResponse.redirect(target, { status: 302 })
}

function parseSafeExternalUrl(value: string | null | undefined): URL | null {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url
  } catch {
    return null
  }
}
