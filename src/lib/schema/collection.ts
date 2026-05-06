/**
 * JSON-LD: CollectionPage + ItemList schema.
 * Used on all index pages: category, town, town+category, subcategory, roundup.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'

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
  const pageUrl = `${SITE_URL}${path}`

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
        url: `${SITE_URL}/listings/${listing.slug}`,
      })),
    },
  ]
}
