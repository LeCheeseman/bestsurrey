/**
 * Dynamic sitemap — served at /sitemap.xml
 *
 * Priority scheme:
 *   1.0  Homepage
 *   0.9  Town + category pages  (primary SEO targets)
 *   0.8  Category index pages, town hub pages
 *   0.7  Listing detail pages
 *   0.6  Subcategory pages
 *
 * /search is intentionally excluded (noindex).
 */

import type { MetadataRoute } from 'next'
import { db }          from '@/lib/db'
import { listings } from '@/lib/db/schema'
import { eq }          from 'drizzle-orm'
import { TOWN_SLUGS, CATEGORY_SLUGS } from '@/lib/taxonomy/constants'
import { getIndexableSubcategorySlugs, getIndexableTownCategoryParams } from '@/lib/queries/taxonomy'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'
const url  = (path: string) => `${BASE}${path}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  let listingRows: { slug: string; updatedAt: Date | null }[] = []
  let townCategoryRows: { slug: string; category: string }[] = []
  let subcategorySlugs: string[] = []

  try {
    ;[listingRows, townCategoryRows, subcategorySlugs] = await Promise.all([
      db.select({ slug: listings.slug, updatedAt: listings.updatedAt })
        .from(listings)
        .where(eq(listings.status, 'published')),
      getIndexableTownCategoryParams(),
      getIndexableSubcategorySlugs(),
    ])
  } catch {
    // DB unreachable at build time — dynamic entries omitted, sitemap regenerated via ISR
  }

  return [
    // ── Homepage ──────────────────────────────────────────────────────────
    {
      url:             url('/'),
      lastModified:    now,
      changeFrequency: 'daily',
      priority:        1.0,
    },

    {
      url:             url('/places'),
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.7,
    },
    {
      url:             url('/about'),
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.4,
    },

    // ── Category index pages (/restaurants/, /cafes-brunch/, …) ──────────
    ...CATEGORY_SLUGS.map((slug) => ({
      url:             url(`/${slug}`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    })),

    // ── Town hub pages (/guildford/, /woking/, …) ─────────────────────────
    ...TOWN_SLUGS.map((slug) => ({
      url:             url(`/${slug}`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    })),

    // ── Town + category pages — primary SEO targets ───────────────────────
    ...townCategoryRows.map(({ slug, category }) => ({
      url:             url(`/${slug}/${category}`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.9,
    })),

    // ── Subcategory pages (/surrey/vegan-restaurants/, …) ─────────────────
    ...subcategorySlugs.map((slug) => ({
      url:             url(`/surrey/${slug}`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.6,
    })),

    // ── Listing detail pages (/listings/[slug]/) ──────────────────────────
    ...listingRows.map((row) => ({
      url:             url(`/listings/${row.slug}`),
      lastModified:    row.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    })),
  ]
}
