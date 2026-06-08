/**
 * Top-level dynamic route — dispatches to town hub or category index template.
 * See docs/phase-1/01-information-architecture.md for routing rationale.
 */

import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
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

type EditorialLink = {
  label: string
  href: string
  description?: string
}

type EditorialBlock = {
  eyebrow: string
  title: string
  body: string
  links: EditorialLink[]
}

const categoryEditorial: Partial<Record<import('@/lib/taxonomy/constants').CategorySlug, {
  title: string
  description: string
  intro: string
  panel: EditorialBlock
}>> = {
  'cafes-brunch': {
    title: 'Best Brunch in Surrey | Cafes, Bakeries & Weekend Breakfasts',
    description:
      'Find the best brunch spots in Surrey, from independent cafes and bakeries to relaxed weekend breakfast places across Guildford, Woking, Farnham and beyond.',
    intro:
      'Find the best brunch spots in Surrey, from independent cafes and bakeries to relaxed weekend breakfast places across the county.',
    panel: {
      eyebrow: 'Brunch guide',
      title: 'Start with the places people actually use for good coffee, breakfast and slower weekends.',
      body:
        'This Surrey brunch guide is built around practical local picks: independent cafes, bakeries, coffee-first stops and relaxed breakfast places. We prioritise places with clear local appeal, useful locations and enough character to be worth choosing over a default chain.',
      links: [
        { label: 'Guildford brunch', href: '/guildford/cafes-brunch', description: 'Central cafes, bakeries and easy weekend stops.' },
        { label: 'Woking brunch', href: '/woking/cafes-brunch', description: 'Coffee stops and daytime places around Woking.' },
        { label: 'Virginia Water brunch', href: '/virginia-water/cafes-brunch', description: 'A useful local page already getting Google visibility.' },
        { label: 'Coffee shops', href: '/surrey/coffee-shops', description: 'Coffee-led picks across Surrey.' },
      ],
    },
  },
}

const townEditorial: Partial<Record<import('@/lib/taxonomy/constants').TownSlug, {
  title: string
  description: string
  intro: string
  panel: EditorialBlock
}>> = {
  farnham: {
    title: 'Best Places in Farnham, Surrey | Restaurants, Pubs & Things To Do',
    description:
      'Explore the best places in Farnham, Surrey, including restaurants, pubs, brunch spots, family days out and things to do around the town.',
    intro:
      'Explore the best places in Farnham, from restaurants and proper pubs to brunch spots, family days out and things to do around the town.',
    panel: {
      eyebrow: 'Farnham guide',
      title: 'Use Farnham as a proper local hub, not just a list of disconnected places.',
      body:
        'Farnham has useful search demand across food, pubs and days out, so this page now points visitors into the strongest sections first. The priority is to make the town page a clear jumping-off point for restaurants, pubs, brunch and things to do, while we keep improving the individual listings underneath.',
      links: [
        { label: 'Restaurants in Farnham', href: '/farnham/restaurants', description: 'Dining pages to clean and strengthen next.' },
        { label: 'Pubs & bars in Farnham', href: '/farnham/pubs-bars', description: 'Important because Farnham pub queries are already appearing.' },
        { label: 'Things to do in Farnham', href: '/farnham/things-to-do', description: 'Parks, heritage and local days out.' },
        { label: 'Brunch in Farnham', href: '/farnham/cafes-brunch', description: 'Cafes, coffee and weekend-friendly picks.' },
      ],
    },
  },
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
    const editorial = townEditorial[classified.slug]
    return {
      title:       editorial?.title ?? `Best Places in ${town.name}, Surrey`,
      description: editorial?.description ?? `The best restaurants, activities and things to do in ${town.name}, Surrey. Curated picks and local favourites.`,
      alternates:  { canonical: `/${town.slug}` },
    }
  }

  const category = CATEGORY_BY_SLUG[classified.slug]
  const editorial = categoryEditorial[classified.slug]
  return {
    title:       editorial?.title ?? `Best ${category.name} in Surrey`,
    description: editorial?.description ?? `Discover the best ${category.name.toLowerCase()} across Surrey. Curated and ranked by the Best Surrey team.`,
    alternates:  { canonical: `/${category.slug}` },
  }
}

export default async function TopLevelSlugPage({ params }: Props) {
  if (params.slug === 'indoor-activities') redirect('/kids-family')

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
  const editorial = categoryEditorial[slug]

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
      path:        `/${slug}`,
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
        intro={editorial?.intro ?? `Discover the best ${category.name.toLowerCase()} across Surrey. Curated picks, ranked by quality and local knowledge.`}
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

          {editorial && <EditorialPanel block={editorial.panel} />}

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
  const editorial = townEditorial[slug]

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
      path:        `/${slug}`,
      listings:    topListings,
    }),
  ]

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-${slug}`} schema={schema} />

      <PageHeader
        h1={`Best Places in ${town.name}`}
        intro={editorial?.intro ?? `Discover the best restaurants, cafés, activities and things to do in ${town.name}, Surrey.`}
        breadcrumbs={breadcrumbItems}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

          {/* Category grid — links to /{town}/{category}/ */}
          {editorial && <EditorialPanel block={editorial.panel} />}

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

function EditorialPanel({ block }: { block: EditorialBlock }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-7">
      <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-warm-gold">
        {block.eyebrow}
      </p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div>
          <h2 className="max-w-3xl font-display text-2xl font-semibold leading-tight text-forest-green md:text-3xl">
            {block.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 font-body">
            {block.body}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {block.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-gray-100 bg-parchment/60 p-4 transition-all hover:-translate-y-0.5 hover:border-mid-green hover:bg-mist-green"
            >
              <span className="font-body text-sm font-bold text-gray-950 group-hover:text-forest-green">
                {link.label}
              </span>
              {link.description && (
                <span className="mt-1 block text-sm leading-5 text-gray-600 font-body">
                  {link.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
