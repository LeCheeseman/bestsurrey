/**
 * Listing detail page — /listings/[slug]/
 * Entity-type-aware: schema.org type chosen from listing.entity_type.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { ResponsiveListingImage } from '@/components/listings/ResponsiveListingImage'
import { OpeningHoursTable } from '@/components/listings/OpeningHoursTable'
import { FaqSection } from '@/components/listings/FaqSection'
import { JsonLd } from '@/components/schema/JsonLd'
import { buildListingSchema, buildFaqSchema } from '@/lib/schema/listing'
import { normalizeFaq, normalizeListingImages, normalizeOpeningHours } from '@/lib/listing-json'
import { getListingBySlug, getRelatedListings } from '@/lib/queries/listings'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  // All listing pages generated on first request via ISR — never pre-render at build time
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const listing = await getListingBySlug(params.slug)
    if (!listing) return {}

    const images = normalizeListingImages(listing.images)
    const primaryImage = images.find((i) => i.isPrimary) ?? images[0]

    return {
      title:       `${listing.name} — ${listing.town.name} ${listing.primaryCategory.name}`,
      description: listing.shortSummary ?? undefined,
      alternates:  { canonical: `/listings/${listing.slug}` },
      openGraph: {
        title:       listing.name,
        description: listing.shortSummary ?? undefined,
        ...(primaryImage ? { images: [{ url: primaryImage.url, alt: primaryImage.alt }] } : {}),
      },
    }
  } catch {
    return {}
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

  const images       = normalizeListingImages(listing.images)
  const faq          = normalizeFaq(listing.faq)
  const openingHours = normalizeOpeningHours(listing.openingHours)
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0]

  const breadcrumbItems = [
    { name: 'Home',                                          path: '/'                                                  },
    { name: listing.primaryCategory.name,                   path: `/${listing.primaryCategory.slug}/`                 },
    { name: `${listing.primaryCategory.name} in ${listing.town.name}`, path: `/${listing.town.slug}/${listing.primaryCategory.slug}/` },
    { name: listing.name },
  ]

  const listingSchema = buildListingSchema(listing)
  const faqSchema     = faq.length > 0 ? buildFaqSchema(faq) : null
  const schema        = faqSchema ? [listingSchema, faqSchema] : listingSchema
  const addressLine2 = listing.addressLine2?.trim()
  const showAddressLine2 = addressLine2 && addressLine2.toLowerCase() !== listing.town.name.toLowerCase()
  const mapQuery = listing.latitude && listing.longitude
    ? `${listing.latitude},${listing.longitude}`
    : [
        listing.addressLine1,
        showAddressLine2 ? addressLine2 : null,
        listing.town.name,
        listing.postcode,
      ].filter(Boolean).join(', ')
  const mapSrc = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && listing.latitude && listing.longitude
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(mapQuery)}&zoom=15`
    : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`

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
            <ListingPhotoGallery images={images} listingName={listing.name} />

            <div className="mt-8 max-w-3xl">
                {/* Sponsored label */}
                {listing.sponsored && (
                  <span className="inline-block text-xs bg-parchment text-gray-600 px-2 py-0.5 rounded mb-3 font-body">
                    Sponsored
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
                    href={`/api/go/${listing.slug}`}
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

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ── Main content ───────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Long description */}
              {(listing.longDescription || listing.highlights?.length || listing.whyWeLikeIt) && (
                <SectionCard title={`About ${listing.name}`}>
                  <div className="text-base text-gray-700 font-body leading-relaxed whitespace-pre-line">
                    {listing.longDescription ?? listing.shortSummary}
                  </div>
                  {listing.whyWeLikeIt && (
                    <blockquote className="mt-6 border-l-4 border-warm-gold pl-4 text-base italic leading-relaxed text-gray-700">
                      &ldquo;{listing.whyWeLikeIt}&rdquo;
                    </blockquote>
                  )}
                  {listing.highlights && listing.highlights.length > 0 && (
                    <div className="mt-7">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Highlights</h3>
                      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                        {listing.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-body">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mid-green" aria-hidden="true" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* Best for */}
              {listing.bestFor && listing.bestFor.length > 0 && (
                <SectionCard title="Best for">
                  <div className="flex flex-wrap gap-2">
                    {listing.bestFor.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm bg-mist-green text-forest-green px-3 py-1.5 rounded-full font-body"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* FAQ */}
              {faq.length > 0 && (
                <SectionCard title="Frequently asked questions">
                  <FaqSection items={faq} />
                </SectionCard>
              )}

            </div>

            {/* ── Sidebar ───────────────────────────────────────────── */}
            <aside className="space-y-6">

              {/* Opening hours */}
              {openingHours && (
                <SectionCard title="Opening hours" compact>
                  <OpeningHoursTable hours={openingHours} />
                </SectionCard>
              )}

              {/* Address + map */}
              {(listing.addressLine1 || listing.latitude) && (
                <SectionCard title={`Location${listing.town.name ? ` ${listing.town.name}` : ''}`} compact>
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
                    <iframe
                      title={`Map showing ${listing.name}`}
                      width="100%"
                      height="100%"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={mapSrc}
                    />
                  </div>

                  {listing.addressLine1 && (
                    <address className="mt-4 text-sm text-gray-600 font-body not-italic">
                      {listing.addressLine1}<br />
                      {showAddressLine2 && <>{addressLine2}<br /></>}
                      {listing.town.name}<br />
                      {listing.postcode}
                    </address>
                  )}
                </SectionCard>
              )}

              {/* Contact */}
              {(listing.phoneNumber || listing.websiteUrl) && (
                <SectionCard title="Contact" compact>
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
                          href={`/api/go/${listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forest-green hover:underline truncate block"
                        >
                          {listing.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </p>
                    )}
                  </div>
                </SectionCard>
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

function SectionCard({
  title,
  children,
  compact = false,
}: {
  title: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white ${compact ? 'p-5' : 'p-6 md:p-7'}`}>
      <h2 className={`${compact ? 'text-base' : 'text-2xl'} font-display font-semibold text-gray-950`}>
        {title}
      </h2>
      <div className={compact ? 'mt-4' : 'mt-5'}>
        {children}
      </div>
    </section>
  )
}

function ListingPhotoGallery({
  images,
  listingName,
}: {
  images: ReturnType<typeof normalizeListingImages>
  listingName: string
}) {
  const galleryImages = images.length > 0
    ? [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).slice(0, 5)
    : []
  const [primary, ...secondary] = galleryImages

  if (!primary) {
    return (
      <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-mist-green">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl">
          📍
        </div>
      </div>
    )
  }

  if (galleryImages.length === 1) {
    return (
      <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-mist-green">
        <ResponsiveListingImage
          src={primary.url}
          alt={primary.alt}
          priority
          sizes="(max-width: 1180px) 100vw, 72rem"
        />
      </div>
    )
  }

  return (
    <div className="grid overflow-hidden rounded-lg bg-white md:h-[360px] md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-1 lg:h-[420px]">
      <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
        <ResponsiveListingImage
          src={primary.url}
          alt={primary.alt}
          priority
          sizes="(max-width: 768px) 100vw, 42vw"
        />
      </div>
      <div className={secondary.length > 1 ? 'grid gap-1 md:h-full md:grid-rows-2' : 'md:h-full'}>
        {secondary.slice(0, 2).map((image, index) => (
          <div key={image.url} className={index === 1 ? 'relative hidden aspect-[4/3] md:block md:aspect-auto' : 'relative aspect-[4/3] md:aspect-auto md:h-full'}>
            <ResponsiveListingImage
              src={image.url}
              alt={image.alt || `${listingName} photo ${index + 2}`}
              sizes={index === 0 ? '(max-width: 768px) 100vw, 30vw' : '30vw'}
            />
            {index === Math.min(1, secondary.length - 1) && images.length > 3 ? (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                {images.length} photos
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
