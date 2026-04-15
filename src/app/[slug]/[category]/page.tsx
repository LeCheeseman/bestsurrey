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
import { isTownSlug, isCategorySlug, getTownCategoryParams } from '@/lib/taxonomy/validation'
import { TOWN_BY_SLUG, CATEGORY_BY_SLUG, TOWNS } from '@/lib/taxonomy/constants'
import { getListingsByTownAndCategory } from '@/lib/queries/listings'
import { getActiveSubcategoriesForCategory, getCategoryTownOverride } from '@/lib/queries/taxonomy'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { buildCollectionSchema } from '@/lib/schema/collection'

export const revalidate = 3600

interface Props {
  params: { slug: string; category: string }
}

export function generateStaticParams() {
  return getTownCategoryParams().map(({ slug, category }) => ({ slug, category }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isTownSlug(params.slug) || !isCategorySlug(params.category)) return {}

  const town     = TOWN_BY_SLUG[params.slug]
  const category = CATEGORY_BY_SLUG[params.category]

  return {
    title:       `Best ${category.name} in ${town.name}, Surrey`,
    description: `The best ${category.name.toLowerCase()} in ${town.name}. Curated picks, ranked by quality and local knowledge.`,
    alternates:  { canonical: `/${params.slug}/${params.category}/` },
  }
}

export default async function TownCategoryPage({ params }: Props) {
  if (!isTownSlug(params.slug) || !isCategorySlug(params.category)) notFound()

  const town     = TOWN_BY_SLUG[params.slug]
  const category = CATEGORY_BY_SLUG[params.category]

  const [pageListings, subcategories, override] = await Promise.all([
    getListingsByTownAndCategory(params.slug, params.category, 12),
    getActiveSubcategoriesForCategory(params.category),
    getCategoryTownOverride(params.slug, params.category),
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

  // Nearby towns — all towns except current (only show those with listings in Phase 3+)
  const nearbyTowns = TOWNS.filter((t) => t.slug !== params.slug).slice(0, 5)

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
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

          {/* Subcategory filter pills */}
          {subcategories.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Browse by type
              </h2>
              <SubcategoryPills subcategories={subcategories} />
            </section>
          )}

          {/* Listings */}
          <section>
            <ListingGrid listings={pageListings} showRankingPosition />
            {pageListings.length === 0 && (
              <p className="text-sm text-gray-500 font-body">
                We&apos;re adding {category.name.toLowerCase()} in {town.name} soon. Check back shortly.
              </p>
            )}
          </section>

          {/* Nearby towns */}
          <section>
            <h2 className="font-display text-lg font-semibold text-forest-green mb-3">
              {category.name} in nearby towns
            </h2>
            <TownFilterRow
              towns={nearbyTowns}
              categorySlug={params.category}
              activeTown={params.slug}
            />
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
