/**
 * ListingCard — used on all index/collection pages.
 *
 * Sponsored listings render with distinct visual treatment.
 * This is enforced in the component, not only in CSS, so it can't be
 * accidentally stripped by a style change.
 */

import Link from 'next/link'
import { normalizeListingImages } from '@/lib/listing-json'
import { ResponsiveListingImage } from './ResponsiveListingImage'
import type { ListingCard as ListingCardData } from '@/types'

interface ListingCardProps {
  listing: ListingCardData
  position?: number  // ranking position label (1, 2, 3...) shown on "best of" pages
}

export function ListingCard({ listing, position }: ListingCardProps) {
  const images = normalizeListingImages(listing.images)
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0]

  return (
    <article className="group relative bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">

      {/* Entire card is clickable */}
      <Link href={`/listings/${listing.slug}/`} className="absolute inset-0 z-0" aria-label={listing.name} />

      {/* Sponsored label — always visible, always distinct from organic */}
      {listing.sponsored && (
        <div className="absolute top-2 left-2 z-10 bg-parchment text-gray-600 text-xs px-2 py-0.5 rounded font-body">
          Sponsored
        </div>
      )}

      {/* Ranking position — shown on "best of" ranked pages */}
      {position && !listing.sponsored && (
        <div className="absolute top-2 right-2 z-10 bg-white/90 text-forest-green text-xs w-7 h-7 flex items-center justify-center rounded-full font-display font-bold border border-forest-green/20 shadow-sm">
          {position}
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] bg-mist-green relative overflow-hidden">
        {primaryImage ? (
          <ResponsiveListingImage
            src={primaryImage.url}
            alt={primaryImage.alt}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-mist-green">
            {/* Placeholder: category icon in Phase 2 */}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-display text-base font-semibold text-forest-green line-clamp-2">
            {listing.name}
          </span>
          {listing.priceBand && (
            <span className="text-xs text-gray-500 shrink-0 mt-0.5">{listing.priceBand}</span>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-2">
          {listing.town.name} · {listing.primaryCategory.name}
        </p>

        {listing.shortSummary && (
          <p className="text-sm text-gray-600 line-clamp-2">{listing.shortSummary}</p>
        )}

        {/* Attribute badges */}
        <div className="flex flex-wrap gap-1 mt-3">
          {listing.familyFriendly       && <Badge label="Family friendly" />}
          {listing.dogFriendly          && <Badge label="Dog friendly" />}
          {listing.veganFriendly        && <Badge label="Vegan" />}
          {listing.wheelchairAccessible && <Badge label="Accessible" />}
        </div>
      </div>
    </article>
  )
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-xs bg-mist-green text-forest-green px-2 py-0.5 rounded-full">
      {label}
    </span>
  )
}
