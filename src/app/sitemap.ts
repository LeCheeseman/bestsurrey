/**
 * Dynamic sitemap — served at /sitemap.xml
 *
 * Priority scheme:
 *   1.0  Homepage
 *   0.9  Town + category pages  (primary SEO targets)
 *   0.8  Category index pages, town hub pages
 *   0.7  Listing detail pages
 *   0.6  Subcategory pages, guide pages
 *   0.5  Guides index
 *
 * /search is intentionally excluded (noindex).
 */

import type { MetadataRoute } from 'next'
import { db }          from '@/lib/db'
import { listings, roundups } from '@/lib/db/schema'
import { eq }          from 'drizzle-orm'
import { TOWN_SLUGS, CATEGORY_SLUGS, SUBCATEGORY_SLUGS } from '@/lib/taxonomy/constants'
import { getTownCategoryParams } from '@/lib/taxonomy/validation'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'
const url  = (path: string) => `${BASE}${path}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const [listingRows, roundupRows] = await Promise.all([
    db.select({ slug: listings.slug, updatedAt: listings.updatedAt })
      .from(listings)
      .where(eq(listings.status, 'published')),
    db.select({ slug: roundups.slug, updatedAt: roundups.updatedAt })
      .from(roundups)
      .where(eq(roundups.status, 'published')),
  ])

  return [
    // ── Homepage ──────────────────────────────────────────────────────────
    {
      url:             url('/'),
      lastModified:    now,
      changeFrequency: 'daily',
      priority:        1.0,
    },

    // ── Guides index ──────────────────────────────────────────────────────
    {
      url:             url('/guides/'),
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.5,
    },

    // ── Category index pages (/restaurants/, /cafes-brunch/, …) ──────────
    ...CATEGORY_SLUGS.map((slug) => ({
      url:             url(`/${slug}/`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    })),

    // ── Town hub pages (/guildford/, /woking/, …) ─────────────────────────
    ...TOWN_SLUGS.map((slug) => ({
      url:             url(`/${slug}/`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    })),

    // ── Town + category pages — primary SEO targets ───────────────────────
    ...getTownCategoryParams().map(({ slug, category }) => ({
      url:             url(`/${slug}/${category}/`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.9,
    })),

    // ── Subcategory pages (/surrey/vegan-restaurants/, …) ─────────────────
    ...SUBCATEGORY_SLUGS.map((slug) => ({
      url:             url(`/surrey/${slug}/`),
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.6,
    })),

    // ── Listing detail pages (/listings/[slug]/) ──────────────────────────
    ...listingRows.map((row) => ({
      url:             url(`/listings/${row.slug}/`),
      lastModified:    row.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    })),

    // ── Guide pages (/guides/[slug]/) ─────────────────────────────────────
    ...roundupRows.map((row) => ({
      url:             url(`/guides/${row.slug}/`),
      lastModified:    row.updatedAt ?? now,
      changeFrequency: 'monthly' as const,
      priority:        0.6,
    })),
  ]
}
