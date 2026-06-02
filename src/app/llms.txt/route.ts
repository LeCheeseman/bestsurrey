const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return new Response(`# Best Surrey

Best Surrey is a curated local guide to places to dine, drink and visit in Surrey, UK.

## Core sections

- Restaurants: ${siteUrl}/restaurants
- Pubs & Bars: ${siteUrl}/pubs-bars
- Brunch: ${siteUrl}/cafes-brunch
- Things To Do: ${siteUrl}/things-to-do
- Kids & Family: ${siteUrl}/kids-family
- Places by town: ${siteUrl}/places

## Useful crawls

- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt

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
