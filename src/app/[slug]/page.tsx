/**
 * Top-level dynamic route — dispatches to town hub or category index template.
 * See docs/phase-1/01-information-architecture.md for routing rationale.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PageHeader } from '@/components/ui/PageHeader'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { SubcategoryPills } from '@/components/ui/SubcategoryPills'
import { TownFilterRow } from '@/components/ui/TownFilterRow'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { JsonLd } from '@/components/schema/JsonLd'
import { classifyTopLevelSlug } from '@/lib/taxonomy/validation'
import { TOWN_SLUGS, CATEGORY_SLUGS, TOWN_BY_SLUG, CATEGORY_BY_SLUG, CATEGORIES } from '@/lib/taxonomy/constants'
import { getListingsByCategory, getListingsByTown } from '@/lib/queries/listings'
import { getActiveSubcategoriesForCategory, getTownsWithListingsForCategory, getListingCountsByCategory } from '@/lib/queries/taxonomy'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { buildCollectionSchema } from '@/lib/schema/collection'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  // Generated on first request via ISR — build env has no DB/network access
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const classified = classifyTopLevelSlug(params.slug)
  if (!classified) return {}

  if (classified.type === 'town') {
    const town = TOWN_BY_SLUG[classified.slug]
    return {
      title:       `Best Places in ${town.name}, Surrey`,
      description: `The best restaurants, activities and things to do in ${town.name}, Surrey. Curated picks and local favourites.`,
      alternates:  { canonical: `/${town.slug}` },
    }
  }

  const category = CATEGORY_BY_SLUG[classified.slug]
  return {
    title:       `Best ${category.name} in Surrey`,
    description: `Discover the best ${category.name.toLowerCase()} across Surrey. Curated and ranked by the Best Surrey team.`,
    alternates:  { canonical: `/${category.slug}` },
  }
}

export default async function TopLevelSlugPage({ params }: Props) {
  const classified = classifyTopLevelSlug(params.slug)
  if (!classified) notFound()

  if (classified.type === 'category') {
    return <CategoryIndexPage slug={classified.slug} />
  }

  return <TownHubPage slug={classified.slug} />
}

// ─── Category index page ──────────────────────────────────────────────────────

async function CategoryIndexPage({ slug }: { slug: import('@/lib/taxonomy/constants').CategorySlug }) {
  const category = CATEGORY_BY_SLUG[slug]

  const [pageListings, subcategories, townsWithListings] = await Promise.all([
    getListingsByCategory(slug, 12),
    getActiveSubcategoriesForCategory(slug),
    getTownsWithListingsForCategory(slug),
  ])

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: category.name },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        `Best ${category.name} in Surrey`,
      description: `The best ${category.name.toLowerCase()} across Surrey, curated and ranked.`,
      path:        `/${slug}/`,
      listings:    pageListings,
    }),
  ]

  // Related categories (exclude current)
  const related = CATEGORIES.filter((c) => c.slug !== slug).slice(0, 4)

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-${slug}`} schema={schema} />

      <PageHeader
        h1={`Best ${category.name} in Surrey`}
        intro={`Discover the best ${category.name.toLowerCase()} across Surrey. Curated picks, ranked by quality and local knowledge.`}
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

          {/* Browse by town */}
          {townsWithListings.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-900 mb-4">
                Browse by town
              </h2>
              <TownFilterRow towns={townsWithListings} categorySlug={slug} />
            </section>
          )}

          {/* Listings */}
          <section className="pt-2">
            <ListingGrid listings={pageListings} />
            {pageListings.length === 0 && (
              <p className="text-sm text-gray-500 font-body">
                We&apos;re adding {category.name.toLowerCase()} soon. Check back shortly.
              </p>
            )}
          </section>

          {/* Related categories */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-900 mb-4">
              Also on Best Surrey
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((cat) => (
                <CategoryCard key={cat.slug} name={cat.name} slug={cat.slug} />
              ))}
            </div>
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}

// ─── Town hub page ────────────────────────────────────────────────────────────

async function TownHubPage({ slug }: { slug: import('@/lib/taxonomy/constants').TownSlug }) {
  const town = TOWN_BY_SLUG[slug]

  const [topListings, categoryCounts] = await Promise.all([
    getListingsByTown(slug, 6),
    Promise.resolve({} as Record<string, number>), // populated below
  ])

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: town.name },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        `Best Places in ${town.name}`,
      description: `The best restaurants, activities and things to do in ${town.name}, Surrey.`,
      path:        `/${slug}/`,
      listings:    topListings,
    }),
  ]

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-${slug}`} schema={schema} />

      <PageHeader
        h1={`Best Places in ${town.name}`}
        intro={`Discover the best restaurants, cafés, activities and things to do in ${town.name}, Surrey.`}
        breadcrumbs={breadcrumbItems}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

          {/* Category grid — links to /{town}/{category}/ */}
          <section>
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">
              Explore {town.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat.slug}
                  name={cat.name}
                  slug={`${slug}/${cat.slug}`}
                />
              ))}
            </div>
          </section>

          {/* Top picks */}
          {topListings.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-forest-green mb-4">
                Top picks in {town.name}
              </h2>
              <ListingGrid listings={topListings} />
            </section>
          )}

          {topListings.length === 0 && (
            <p className="text-sm text-gray-500 font-body">
              We&apos;re adding listings for {town.name} soon. Check back shortly.
            </p>
          )}

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
