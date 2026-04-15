/**
 * JSON-LD: Organization + WebSite schema.
 * Rendered once in the root layout — applies sitewide.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Best Surrey',
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.svg`,
    description:
      'The finest local guide to Surrey — curated restaurants, activities, and experiences.',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Surrey',
    },
  }
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Best Surrey',
    url: SITE_URL,
    // potentialAction (SearchAction) added in Phase 4 once /search exists
  }
}
