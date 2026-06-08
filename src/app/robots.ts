/**
 * robots.txt — served at /robots.txt
 * Blocks search result pages and any future API routes from crawlers.
 */

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow:    '/',
      disallow: ['/search', '/admin', '/guides', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
