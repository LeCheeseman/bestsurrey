/**
 * robots.txt — served at /robots.txt
 * Blocks search result pages and any future API routes from crawlers.
 */

import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow:    '/',
      disallow: ['/search', '/api/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
