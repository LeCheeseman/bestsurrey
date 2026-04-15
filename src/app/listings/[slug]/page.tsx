/**
 * Listing detail page — /listings/[slug]/
 * Entity-type-aware: schema.org type chosen from listing.entity_type.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { OpeningHoursTable } from '@/components/listings/OpeningHoursTable'
import { FaqSection } from '@/components/listings/FaqSection'
import { JsonLd } from '@/components/schema/JsonLd'
import { buildListingSchema, buildFaqSchema } from '@/lib/schema/listing'
import { getListingBySlug, getPublishedListingSlugs, getRelatedListings } from '@/lib/queries/listings'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = await getPublishedListingSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingBySlug(params.slug)
  if (!listing) return {}

  const primaryImage = listing.images?.find((i) => i.isPrimary) ?? listing.images?.[0]

  return {
    title:       `${listing.name} — ${listing.town.name} ${listing.primaryCategory.name}`,
    description: listing.shortSummary ?? undefined,
    alternates:  { canonical: `/listings/${listing.slug}/` },
    openGraph: {
      title:       listing.name,
      description: listing.shortSummary ?? undefined,
      ...(primaryImage ? { images: [{ url: primaryImage.url, alt: primaryImage.alt }] } : {}),
    },
  }
}

export default async function ListingPage({ params }: Props) {
  const listing = await getListingBySlug(params.slug)
  if (!listing) notFound()

  const related = await getRelatedListings(
    listing.town.slug,
    listing.primaryCategory.slug,
    listing.slug,
    3
  )

  const primaryImage = listing.images?.find((i) => i.isPrimary) ?? listing.images?.[0]
  const allImages    = listing.images ?? []

  const breadcrumbItems = [
    { name: 'Home',                                          path: '/'                                                  },
    { name: listing.primaryCategory.name,                   path: `/${listing.primaryCategory.slug}/`                 },
    { name: `${listing.primaryCategory.name} in ${listing.town.name}`, path: `/${listing.town.slug}/${listing.primaryCategory.slug}/` },
    { name: listing.name },
  ]

  const listingSchema = buildListingSchema(listing)
  const faqSchema     = listing.faq ? buildFaqSchema(listing.faq) : null
  const schema        = faqSchema ? [listingSchema, faqSchema] : listingSchema

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-listing-${listing.slug}`} schema={schema} />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <main className="bg-cream min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

              {/* Image */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-mist-green relative">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl">
                    📍
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                {/* Sponsored / Featured labels */}
                {listing.sponsored && (
                  <span className="inline-block text-xs bg-parchment text-gray-600 px-2 py-0.5 rounded mb-3 font-body">
                    Sponsored
                  </span>
                )}
                {listing.featured && !listing.sponsored && (
                  <span className="inline-block text-xs bg-warm-gold text-white px-2 py-0.5 rounded mb-3 font-body">
                    Editor&apos;s Pick
                  </span>
                )}

                <h1 className="font-display text-4xl font-semibold text-forest-green">
                  {listing.name}
                </h1>

                {/* Key info row */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 font-body">
                  <Link href={`/${listing.town.slug}/`} className="hover:text-forest-green">
                    {listing.town.name}
                  </Link>
                  <span>·</span>
                  <Link href={`/${listing.primaryCategory.slug}/`} className="hover:text-forest-green">
                    {listing.primaryCategory.name}
                  </Link>
                  {listing.priceBand && (
                    <>
                      <span>·</span>
                      <span>{listing.priceBand}</span>
                    </>
                  )}
                  {listing.bookingRequired && (
                    <>
                      <span>·</span>
                      <span className="text-warm-gold">Booking recommended</span>
                    </>
                  )}
                </div>

                {/* Short summary */}
                {listing.shortSummary && (
                  <p className="mt-4 text-base text-gray-700 font-body leading-relaxed">
                    {listing.shortSummary}
                  </p>
                )}

                {/* Attribute badges */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {listing.familyFriendly       && <Badge>Family friendly</Badge>}
                  {listing.dogFriendly           && <Badge>Dog friendly</Badge>}
                  {listing.veganFriendly         && <Badge>Vegan friendly</Badge>}
                  {listing.vegetarianFriendly    && <Badge>Vegetarian friendly</Badge>}
                  {listing.wheelchairAccessible  && <Badge>Wheelchair accessible</Badge>}
                  {listing.goodForGroups         && <Badge>Good for groups</Badge>}
                  {listing.indoor  && listing.outdoor  && <Badge>Indoor &amp; outdoor</Badge>}
                  {listing.indoor  && !listing.outdoor && <Badge>Indoor</Badge>}
                  {!listing.indoor && listing.outdoor  && <Badge>Outdoor</Badge>}
                </div>

                {/* Website link */}
                {listing.websiteUrl && (
                  <a
                    href={listing.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block bg-forest-green text-white font-body text-sm px-5 py-2.5 rounded-lg hover:bg-mid-green transition-colors"
                  >
                    Visit website ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* ── Main content ───────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-8">

              {/* Why we like it */}
              {listing.whyWeLikeIt && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
                    Why we like it
                  </h2>
                  <p className="text-base text-gray-700 font-body leading-relaxed italic border-l-4 border-warm-gold pl-4">
                    &ldquo;{listing.whyWeLikeIt}&rdquo;
                  </p>
                </section>
              )}

              {/* Highlights */}
              {listing.highlights && listing.highlights.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
                    Highlights
                  </h2>
                  <ul className="space-y-2">
                    {listing.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-body">
                        <span className="text-warm-gold mt-0.5" aria-hidden="true">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Long description */}
              {listing.longDescription && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
                    About
                  </h2>
                  <div className="text-base text-gray-700 font-body leading-relaxed whitespace-pre-line">
                    {listing.longDescription}
                  </div>
                </section>
              )}

              {/* Best for */}
              {listing.bestFor && listing.bestFor.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
                    Best for
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.bestFor.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm bg-mist-green text-forest-green px-3 py-1 rounded-full font-body"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ */}
              {listing.faq && listing.faq.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
                    Frequently asked questions
                  </h2>
                  <FaqSection items={listing.faq} />
                </section>
              )}

            </div>

            {/* ── Sidebar ───────────────────────────────────────────── */}
            <aside className="space-y-6">

              {/* Opening hours */}
              {listing.openingHours && (
                <div className="bg-white rounded-lg p-5 border border-gray-100">
                  <h2 className="font-display text-base font-semibold text-forest-green mb-4">
                    Opening hours
                  </h2>
                  <OpeningHoursTable hours={listing.openingHours} />
                </div>
              )}

              {/* Address + map */}
              {(listing.addressLine1 || listing.latitude) && (
                <div className="bg-white rounded-lg p-5 border border-gray-100">
                  <h2 className="font-display text-base font-semibold text-forest-green mb-3">
                    Location
                  </h2>
                  {listing.addressLine1 && (
                    <address className="text-sm text-gray-600 font-body not-italic mb-4">
                      {listing.addressLine1}<br />
                      {listing.addressLine2 && <>{listing.addressLine2}<br /></>}
                      {listing.town.name}<br />
                      {listing.postcode}
                    </address>
                  )}

                  {/* Google Maps embed */}
                  {listing.latitude && listing.longitude && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                    <div className="aspect-square rounded overflow-hidden">
                      <iframe
                        title={`Map showing ${listing.name}`}
                        width="100%"
                        height="100%"
                        loading="lazy"
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${listing.latitude},${listing.longitude}&zoom=15`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Contact */}
              {(listing.phoneNumber || listing.websiteUrl) && (
                <div className="bg-white rounded-lg p-5 border border-gray-100">
                  <h2 className="font-display text-base font-semibold text-forest-green mb-3">
                    Contact
                  </h2>
                  <div className="space-y-2 text-sm font-body">
                    {listing.phoneNumber && (
                      <p>
                        <a href={`tel:${listing.phoneNumber}`} className="text-forest-green hover:underline">
                          {listing.phoneNumber}
                        </a>
                      </p>
                    )}
                    {listing.websiteUrl && (
                      <p>
                        <a
                          href={listing.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forest-green hover:underline truncate block"
                        >
                          {listing.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

            </aside>
          </div>

          {/* ── Related listings ─────────────────────────────────── */}
          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-xl font-semibold text-forest-green mb-6">
                More {listing.primaryCategory.name.toLowerCase()} in {listing.town.name}
              </h2>
              <ListingGrid listings={related} />
            </section>
          )}
        </div>

      </main>

      <SiteFooter />
    </>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-mist-green text-forest-green px-3 py-1 rounded-full font-body">
      {children}
    </span>
  )
}
