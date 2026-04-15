/**
 * ListingCard — used on all index/collection pages.
 *
 * Sponsored and Featured listings render with distinct visual treatment.
 * This is enforced in the component, not only in CSS, so it can't be
 * accidentally stripped by a style change.
 */

import Link from 'next/link'
import Image from 'next/image'
import type { ListingCard as ListingCardData } from '@/types'

interface ListingCardProps {
  listing: ListingCardData
  position?: number  // ranking position label (1, 2, 3...) shown on "best of" pages
}

export function ListingCard({ listing, position }: ListingCardProps) {
  const primaryImage = listing.images?.find((img) => img.isPrimary) ?? listing.images?.[0]

  return (
    <article className="group relative bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Sponsored label — always visible, always distinct from organic */}
      {listing.sponsored && (
        <div className="absolute top-2 left-2 z-10 bg-parchment text-gray-600 text-xs px-2 py-0.5 rounded font-body">
          Sponsored
        </div>
      )}

      {/* Featured label — only when not sponsored */}
      {listing.featured && !listing.sponsored && (
        <div className="absolute top-2 left-2 z-10 bg-warm-gold text-white text-xs px-2 py-0.5 rounded font-body">
          Editor&apos;s Pick
        </div>
      )}

      {/* Ranking position — shown on "best of" ranked pages */}
      {position && !listing.sponsored && (
        <div className="absolute top-2 right-2 z-10 bg-forest-green text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-display font-semibold">
          {position}
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] bg-mist-green relative overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
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
          <Link
            href={`/listings/${listing.slug}/`}
            className="font-display text-base font-semibold text-forest-green hover:underline line-clamp-2"
          >
            {listing.name}
          </Link>
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
          {listing.familyFriendly      && <Badge label="Family friendly" />}
          {listing.dogFriendly         && <Badge label="Dog friendly" />}
          {listing.veganFriendly       && <Badge label="Vegan" />}
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
