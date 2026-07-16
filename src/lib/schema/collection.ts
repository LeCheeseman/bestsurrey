/**
 * JSON-LD: CollectionPage + ItemList schema.
 * Used on all index pages: category, town, town+category, subcategory, roundup.
 */

import { canonicalUrl } from '@/lib/site'

export interface CollectionListingItem {
  slug: string
}

export function buildCollectionSchema({
  name,
  description,
  path,
  listings,
}: {
  name: string
  description: string
  path: string
  listings: CollectionListingItem[]
}) {
  const pageUrl = canonicalUrl(path)

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name,
      description,
      url: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name,
      itemListElement: listings.map((listing, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: canonicalUrl(`/listings/${listing.slug}`),
      })),
    },
  ]
}
