/**
 * robots.txt — served at /robots.txt
 * Blocks search result pages and any future API routes from crawlers.
 */

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const publicCrawlerUserAgents = [
  'Googlebot',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
]

const disallowedPaths = ['/search', '/admin', '/api/', '/design-lab']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...publicCrawlerUserAgents.map((userAgent) => ({
        userAgent,
        allow:    '/',
        disallow: disallowedPaths,
      })),
      {
        userAgent: '*',
        allow:    '/',
        disallow: disallowedPaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
