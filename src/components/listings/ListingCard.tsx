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
  position?: number
}

export function ListingCard({ listing }: ListingCardProps) {
  const images = normalizeListingImages(listing.images)
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0]
  const galleryImages = primaryImage
    ? [
        primaryImage,
        ...images.filter((image) => image.url !== primaryImage.url),
      ].slice(0, 3)
    : []
  const canRotateImages = galleryImages.length > 1
  const rotationDuration = `${galleryImages.length * 1.8}s`
  const fadeDuration = 900

  return (
    <article className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* Entire card is clickable */}
      <Link href={`/listings/${listing.slug}/`} className="absolute inset-0 z-10" aria-label={listing.name} />

      {/* Sponsored label — always visible, always distinct from organic */}
      {listing.sponsored && (
        <div className="absolute top-2 left-2 z-20 bg-parchment text-gray-600 text-xs px-2 py-0.5 rounded font-body">
          Sponsored
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] bg-mist-green relative overflow-hidden">
        {galleryImages.length > 0 ? (
          galleryImages.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="absolute inset-0 opacity-0 transition-opacity"
              style={{
                opacity: index === 0 ? 1 : 0,
                transitionDuration: `${fadeDuration}ms`,
                ...(canRotateImages
                  ? {
                      animationName: 'listing-card-fade',
                      animationDuration: rotationDuration,
                      animationDelay: `${index * 1.8}s`,
                      animationIterationCount: 'infinite',
                    }
                  : {}),
              }}
            >
              <ResponsiveListingImage
                src={image.url}
                alt={image.alt}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-mist-green">
            {/* Placeholder: category icon in Phase 2 */}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-display text-xl font-semibold leading-tight text-forest-green line-clamp-2">
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
