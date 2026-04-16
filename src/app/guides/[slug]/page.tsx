/**
 * Editorial roundup page — /guides/[slug]/
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { JsonLd } from '@/components/schema/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { buildCollectionSchema } from '@/lib/schema/collection'
import { db } from '@/lib/db'
import { roundups, roundupListings, listings, towns, categories } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

async function getRoundup(slug: string) {
  const roundupRows = await db
    .select()
    .from(roundups)
    .where(and(eq(roundups.slug, slug), eq(roundups.status, 'published')))
    .limit(1)

  if (!roundupRows[0]) return null
  const roundup = roundupRows[0]

  const items = await db
    .select({
      sortOrder:     roundupListings.sortOrder,
      editorialNote: roundupListings.editorialNote,
      listing: {
        id:           listings.id,
        slug:         listings.slug,
        name:         listings.name,
        shortSummary: listings.shortSummary,
        images:       listings.images,
        priceBand:    listings.priceBand,
      },
      town:     { name: towns.name,      slug: towns.slug      },
      category: { name: categories.name, slug: categories.slug },
    })
    .from(roundupListings)
    .innerJoin(listings,   eq(roundupListings.listingId,        listings.id))
    .innerJoin(towns,      eq(listings.townId,                  towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId,       categories.id))
    .where(eq(roundupListings.roundupId, roundup.id))
    .orderBy(asc(roundupListings.sortOrder))

  return { roundup, items }
}

export async function generateStaticParams() {
  try {
    const rows = await db
      .select({ slug: roundups.slug })
      .from(roundups)
      .where(eq(roundups.status, 'published'))
    return rows.map(({ slug }) => ({ slug }))
  } catch {
    // DB unreachable at build time — pages generated on first request via ISR
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const data = await getRoundup(params.slug)
    if (!data) return {}
    return {
      title:       data.roundup.metaTitle    ?? data.roundup.title,
      description: data.roundup.metaDescription ?? data.roundup.intro ?? undefined,
      alternates:  { canonical: `/guides/${params.slug}/` },
    }
  } catch {
    return {}
  }
}

export default async function GuidePage({ params }: Props) {
  const data = await getRoundup(params.slug)
  if (!data) notFound()

  const { roundup, items } = data

  const breadcrumbItems = [
    { name: 'Home',   path: '/'       },
    { name: 'Guides', path: '/guides/' },
    { name: roundup.title },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        roundup.title,
      description: roundup.intro ?? '',
      path:        `/guides/${params.slug}/`,
      listings:    items.map((i) => i.listing),
    }),
  ]

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-guide-${params.slug}`} schema={schema} />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="mt-4 font-display text-4xl font-semibold text-forest-green">
            {roundup.title}
          </h1>
          {roundup.intro && (
            <p className="mt-3 text-base text-gray-600 font-body max-w-2xl">{roundup.intro}</p>
          )}
        </div>
      </div>

      <main className="bg-cream min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10">

          {items.length === 0 && (
            <p className="text-sm text-gray-500 font-body">No listings in this guide yet.</p>
          )}

          <ol className="space-y-8">
            {items.map((item, i) => {
              const img = item.listing.images?.find((img) => img.isPrimary) ?? item.listing.images?.[0]

              return (
                <li key={item.listing.slug} className="flex gap-5 bg-white border border-gray-100 rounded-lg p-5">
                  {/* Position number */}
                  <div className="shrink-0 w-8 h-8 rounded-full bg-forest-green text-white font-display font-semibold text-sm flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>

                  {/* Image */}
                  {img && (
                    <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden relative bg-mist-green">
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/listings/${item.listing.slug}/`}
                      className="font-display text-lg font-semibold text-forest-green hover:underline"
                    >
                      {item.listing.name}
                    </Link>
                    <p className="text-xs text-gray-500 font-body mt-0.5">
                      {item.town.name} · {item.category.name}
                      {item.listing.priceBand && ` · ${item.listing.priceBand}`}
                    </p>
                    {item.editorialNote && (
                      <p className="mt-2 text-sm text-gray-600 font-body italic">
                        &ldquo;{item.editorialNote}&rdquo;
                      </p>
                    )}
                    {!item.editorialNote && item.listing.shortSummary && (
                      <p className="mt-2 text-sm text-gray-600 font-body line-clamp-2">
                        {item.listing.shortSummary}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
