/**
 * ListingGrid — renders a responsive grid of ListingCards.
 * Sponsored listings are always placed in a separate block above organic results.
 */

import { ListingCard } from './ListingCard'
import type { ListingCard as ListingCardData } from '@/types'

interface ListingGridProps {
  listings: ListingCardData[]
  showRankingPosition?: boolean
}

export function ListingGrid({ listings, showRankingPosition = false }: ListingGridProps) {
  // Sponsored and organic listings must be visually separated
  const sponsored = listings.filter((l) => l.sponsored)
  const organic   = listings.filter((l) => !l.sponsored)

  return (
    <div>
      {/* Sponsored block — clearly separated from organic results */}
      {sponsored.length > 0 && (
        <section aria-label="Sponsored listings" className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-body">Sponsored</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsored.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Organic results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {organic.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            position={showRankingPosition ? i + 1 : undefined}
          />
        ))}
      </div>

      {organic.length === 0 && sponsored.length === 0 && (
        <p className="text-gray-500 text-sm">No listings found.</p>
      )}
    </div>
  )
}
