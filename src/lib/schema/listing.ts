/**
 * JSON-LD: Listing entity schema.
 *
 * Maps each entity_type to the correct schema.org type and populates only
 * fields that are genuinely present in the structured data. No schema theatre.
 *
 * Entity type → schema.org type:
 *   restaurant    → Restaurant      (extends FoodEstablishment → LocalBusiness)
 *   cafe          → CafeOrCoffeeShop (extends FoodEstablishment)
 *   attraction    → TouristAttraction
 *   activity-venue → SportsActivityLocation (extends LocalBusiness)
 *   place         → LocalBusiness
 */

import type { ListingWithRelations } from '@/types'
import type { FaqItem } from '@/types/db-shapes'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'

const ENTITY_TYPE_TO_SCHEMA: Record<string, string> = {
  restaurant:       'Restaurant',
  cafe:             'CafeOrCoffeeShop',
  attraction:       'TouristAttraction',
  'activity-venue': 'SportsActivityLocation',
  place:            'LocalBusiness',
}

export function buildListingSchema(listing: ListingWithRelations) {
  const schemaType = ENTITY_TYPE_TO_SCHEMA[listing.entityType] ?? 'LocalBusiness'
  const listingUrl = `${SITE_URL}/listings/${listing.slug}/`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: listing.name,
    url: listingUrl,
    description: listing.shortSummary ?? undefined,
  }

  if (listing.websiteUrl) {
    schema.sameAs = listing.websiteUrl
  }

  // Address
  if (listing.addressLine1 || listing.postcode) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(listing.addressLine1   ? { streetAddress:   listing.addressLine1                   } : {}),
      ...(listing.town.name      ? { addressLocality: listing.town.name                      } : {}),
      ...(listing.town.county    ? { addressRegion:   listing.town.county                    } : {}),
      ...(listing.postcode       ? { postalCode:       listing.postcode                      } : {}),
      addressCountry: 'GB',
    }
  }

  // Geo
  if (listing.latitude && listing.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude:  Number(listing.latitude),
      longitude: Number(listing.longitude),
    }
  }

  if (listing.phoneNumber) {
    schema.telephone = listing.phoneNumber
  }

  if (listing.priceBand) {
    schema.priceRange = listing.priceBand
  }

  // Opening hours — only if populated
  if (listing.openingHours) {
    const days = listing.openingHours
    const specs = (Object.entries(days) as Array<[string, typeof days[keyof typeof days]]>)
      .filter(([, val]) => val && !('closed' in val))
      .map(([day, val]) => {
        const v = val as { open: string; close: string }
        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${capitalise(day)}`,
          opens:  v.open,
          closes: v.close,
        }
      })

    if (specs.length > 0) {
      schema.openingHoursSpecification = specs
    }
  }

  // Amenity features (structured attributes → schema.org)
  const amenityFeatures = buildAmenityFeatures(listing)
  if (amenityFeatures.length > 0) {
    schema.amenityFeature = amenityFeatures
  }

  // Primary image
  const primaryImage = listing.images?.find((img) => img.isPrimary) ?? listing.images?.[0]
  if (primaryImage) {
    schema.image = {
      '@type': 'ImageObject',
      url: primaryImage.url,
      ...(primaryImage.alt ? { description: primaryImage.alt } : {}),
    }
  }

  // Aggregate rating — only if review data is present and credible
  if (listing.reviewScore && listing.reviewCount && listing.reviewCount > 0) {
    schema.aggregateRating = {
      '@type':       'AggregateRating',
      ratingValue:   Number(Number(listing.reviewScore).toFixed(1)),
      reviewCount:   listing.reviewCount,
      bestRating:    5,
      worstRating:   1,
    }
  }

  return schema
}

/** FAQ schema — only rendered when the listing has faq entries. */
export function buildFaqSchema(faq: FaqItem[]) {
  if (!faq || faq.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAmenityFeatures(listing: ListingWithRelations) {
  const features: Array<{ '@type': string; name: string; value: boolean }> = []

  const map: Array<[keyof ListingWithRelations, string]> = [
    ['wheelchairAccessible', 'Wheelchair accessible'],
    ['familyFriendly',       'Family friendly'],
    ['dogFriendly',          'Dog friendly'],
    ['veganFriendly',        'Vegan friendly'],
    ['vegetarianFriendly',   'Vegetarian friendly'],
    ['goodForGroups',        'Good for groups'],
  ]

  for (const [field, name] of map) {
    const val = listing[field]
    if (val !== null && val !== undefined) {
      features.push({ '@type': 'LocationFeatureSpecification', name, value: Boolean(val) })
    }
  }

  return features
}

function capitalise(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
