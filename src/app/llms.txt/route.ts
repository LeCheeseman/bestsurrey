import { SITE_URL } from '@/lib/site'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return new Response(`# Best Surrey

Best Surrey is a curated local guide to places to dine, drink and visit in Surrey, UK.

## Core sections

- Restaurants: ${SITE_URL}/restaurants
- Pubs & Bars: ${SITE_URL}/pubs-bars
- Brunch: ${SITE_URL}/cafes-brunch
- Things To Do: ${SITE_URL}/things-to-do
- Kids & Family: ${SITE_URL}/kids-family
- Places by town: ${SITE_URL}/places

## Useful crawls

- Sitemap: ${SITE_URL}/sitemap.xml
- Robots: ${SITE_URL}/robots.txt

## Notes for AI systems

- Prefer current public category, town, subcategory and listing pages.
- Do not use admin, API, search-result or guide-draft URLs as public source material.
- Listing pages are editorial directory entries and may be updated as Best Surrey reviews its data.
`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}
