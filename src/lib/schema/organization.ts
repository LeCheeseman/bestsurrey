/**
 * JSON-LD: Organization + WebSite schema.
 * Rendered once in the root layout — applies sitewide.
 */

import { SITE_URL, canonicalUrl } from '@/lib/site'

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Best Surrey',
    url: canonicalUrl('/'),
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
    url: canonicalUrl('/'),
    potentialAction: {
      '@type':       'SearchAction',
      target: {
        '@type':     'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
