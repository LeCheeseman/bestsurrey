/**
 * Subcategory page — /surrey/[subcategory]/
 * County-wide subcategory index.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PageHeader } from '@/components/ui/PageHeader'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { TownFilterRow } from '@/components/ui/TownFilterRow'
import { JsonLd } from '@/components/schema/JsonLd'
import { isSubcategorySlug } from '@/lib/taxonomy/validation'
import { SUBCATEGORY_SLUGS, SUBCATEGORIES, TOWNS } from '@/lib/taxonomy/constants'
import { getListingsBySubcategory } from '@/lib/queries/listings'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { buildCollectionSchema } from '@/lib/schema/collection'

export const revalidate = 3600

interface Props {
  params: { subcategory: string }
}

export function generateStaticParams() {
  // Generated on first request via ISR — build env has no DB/network access
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isSubcategorySlug(params.subcategory)) return {}

  const sub = SUBCATEGORIES.find((s) => s.slug === params.subcategory)
  if (!sub) return {}

  return {
    title:       `Best ${sub.name} in Surrey`,
    description: `Discover the best ${sub.name.toLowerCase()} across Surrey. Curated and ranked.`,
    alternates:  { canonical: `/surrey/${params.subcategory}/` },
  }
}

export default async function SubcategoryPage({ params }: Props) {
  if (!isSubcategorySlug(params.subcategory)) notFound()

  const sub = SUBCATEGORIES.find((s) => s.slug === params.subcategory)
  if (!sub) notFound()

  const pageListings = await getListingsBySubcategory(params.subcategory, 12)

  const breadcrumbItems = [
    { name: 'Home',     path: '/' },
    { name: sub.name },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        `Best ${sub.name} in Surrey`,
      description: `Discover the best ${sub.name.toLowerCase()} across Surrey.`,
      path:        `/surrey/${params.subcategory}/`,
      listings:    pageListings,
    }),
  ]

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-surrey-${params.subcategory}`} schema={schema} />

      <PageHeader
        h1={`Best ${sub.name} in Surrey`}
        intro={`Discover the best ${sub.name.toLowerCase()} across Surrey. Curated and ranked.`}
        breadcrumbs={breadcrumbItems}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

          <section>
            <ListingGrid listings={pageListings} showRankingPosition />
            {pageListings.length === 0 && (
              <p className="text-sm text-gray-500 font-body">
                We&apos;re adding {sub.name.toLowerCase()} listings soon. Check back shortly.
              </p>
            )}
          </section>

          {/* Browse by town */}
          <section>
            <h2 className="font-display text-lg font-semibold text-forest-green mb-3">
              Browse by town
            </h2>
            <TownFilterRow towns={TOWNS.map((t) => ({ ...t }))} />
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
