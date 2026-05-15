/**
 * Town + category page — /[town]/[category]/
 * The primary SEO landing pages for high-intent local queries.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PageHeader } from '@/components/ui/PageHeader'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { SubcategoryPills } from '@/components/ui/SubcategoryPills'
import { TownFilterRow } from '@/components/ui/TownFilterRow'
import { JsonLd } from '@/components/schema/JsonLd'
import { isTownSlug, isCategorySlug } from '@/lib/taxonomy/validation'
import { TOWN_BY_SLUG, CATEGORY_BY_SLUG } from '@/lib/taxonomy/constants'
import { getListingsByTownAndCategory } from '@/lib/queries/listings'
import { getActiveSubcategoriesForCategory, getCategoryTownOverride, getListingCountForTownCategory, getMinIndexableListings, getTownsWithListingsForCategory } from '@/lib/queries/taxonomy'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { buildCollectionSchema } from '@/lib/schema/collection'

export const revalidate = 3600

interface Props {
  params: { slug: string; category: string }
}

export function generateStaticParams() {
  // Generated on first request via ISR — build env has no DB/network access
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isTownSlug(params.slug) || !isCategorySlug(params.category)) return {}

  const town     = TOWN_BY_SLUG[params.slug]
  const category = CATEGORY_BY_SLUG[params.category]

  const metadata: Metadata = {
    title:       `Best ${category.name} in ${town.name}, Surrey`,
    description: `The best ${category.name.toLowerCase()} in ${town.name}. Curated picks, ranked by quality and local knowledge.`,
    alternates:  { canonical: `/${params.slug}/${params.category}` },
  }

  try {
    const count = await getListingCountForTownCategory(params.slug, params.category)
    if (count < getMinIndexableListings(params.category)) {
      metadata.robots = { index: false, follow: true }
    }
  } catch {
    // If the DB is unavailable, keep default metadata and let ISR retry later.
  }

  return metadata
}

export default async function TownCategoryPage({ params }: Props) {
  if (!isTownSlug(params.slug) || !isCategorySlug(params.category)) notFound()

  const town     = TOWN_BY_SLUG[params.slug]
  const category = CATEGORY_BY_SLUG[params.category]

  const [pageListings, subcategories, override, townsWithListings] = await Promise.all([
    getListingsByTownAndCategory(params.slug, params.category, 12),
    getActiveSubcategoriesForCategory(params.category),
    getCategoryTownOverride(params.slug, params.category),
    getTownsWithListingsForCategory(params.category),
  ])

  const intro = override?.intro
    ?? `The best ${category.name.toLowerCase()} in ${town.name}. Curated picks, ranked by quality and local knowledge.`

  const breadcrumbItems = [
    { name: 'Home',       path: '/'                        },
    { name: category.name, path: `/${params.category}/`   },
    { name: `${category.name} in ${town.name}` },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        `Best ${category.name} in ${town.name}`,
      description: intro,
      path:        `/${params.slug}/${params.category}/`,
      listings:    pageListings,
    }),
  ]

  const nearbyTowns = townsWithListings
    .filter((t) => t.slug !== params.slug)
    .filter((t) => t.count >= getMinIndexableListings(params.category))
    .slice(0, 8)

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-${params.slug}-${params.category}`} schema={schema} />

      <PageHeader
        h1={`Best ${category.name} in ${town.name}`}
        intro={intro}
        breadcrumbs={breadcrumbItems}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          {/* Subcategory filter pills */}
          {subcategories.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-900 mb-4">
                Browse by type
              </h2>
              <SubcategoryPills subcategories={subcategories} />
            </section>
          )}

          {/* Nearby towns */}
          {nearbyTowns.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-900 mb-4">
                {category.name} in nearby towns
              </h2>
              <TownFilterRow
                towns={nearbyTowns}
                categorySlug={params.category}
                activeTown={params.slug}
              />
            </section>
          )}

          {/* Listings */}
          <section className="pt-2">
            <ListingGrid listings={pageListings} />
            {pageListings.length === 0 && (
              <p className="text-sm text-gray-500 font-body">
                We&apos;re adding {category.name.toLowerCase()} in {town.name} soon. Check back shortly.
              </p>
            )}
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
