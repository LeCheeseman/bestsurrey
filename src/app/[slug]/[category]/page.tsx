/**
 * Town + category page — /[town]/[category]/
 * The primary SEO landing pages for high-intent local queries.
 */

import { notFound, permanentRedirect, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PageHeader } from '@/components/ui/PageHeader'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { SubcategoryPills } from '@/components/ui/SubcategoryPills'
import { TownFilterRow } from '@/components/ui/TownFilterRow'
import { EditorialPanel, type EditorialBlock } from '@/components/ui/EditorialPanel'
import { JsonLd } from '@/components/schema/JsonLd'
import { isTownSlug, isCategorySlug, isSubcategorySlug } from '@/lib/taxonomy/validation'
import { TOWN_BY_SLUG, CATEGORY_BY_SLUG, SUBCATEGORIES } from '@/lib/taxonomy/constants'
import { getListingsByTownAndCategory, getListingsByTownAndSubcategory } from '@/lib/queries/listings'
import { getActiveSubcategoriesForTownCategory, getCategoryTownOverride, getTownsWithListingsForCategory, getTownsWithListingsForSubcategory } from '@/lib/queries/taxonomy'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { buildCollectionSchema } from '@/lib/schema/collection'
import { canonicalUrl } from '@/lib/site'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string; category: string }
}

type TownCategoryEditorial = {
  title: string
  description: string
  intro: string
  panel: EditorialBlock
}

const townCategoryEditorial: Record<string, TownCategoryEditorial> = {
  'woking/cafes-brunch': {
    title: 'Best Brunch in Woking | Cafes, Coffee & Breakfast Spots',
    description:
      'Find the best brunch in Woking, from independent cafes and coffee shops to relaxed breakfast and weekend brunch spots around town.',
    intro:
      'Find the best brunch in Woking, from independent cafes and coffee shops to relaxed breakfast and weekend brunch spots around town.',
    panel: {
      eyebrow: 'Woking brunch guide',
      title: 'A focused shortlist for breakfast, coffee and slower weekend plans in Woking.',
      body:
        "Find the best cafés and brunch spots in Woking, from all-day brunch kitchens and proper coffee to easy weekend catch-ups with the kids in tow. Here's where to go, whatever kind of morning you're after.",
      links: [
        { label: 'Coffee shops in Woking', href: '/woking/coffee-shops', description: 'Coffee-first places and daytime stops.' },
        { label: 'Brunch spots in Woking', href: '/woking/brunch-spots', description: 'Weekend breakfasts, brunch plates and relaxed cafes.' },
        { label: 'Bakeries in Woking', href: '/woking/bakeries', description: 'Pastries, bread and quick morning stops.' },
        { label: 'Best brunch in Surrey', href: '/cafes-brunch', description: 'Compare Woking with other Surrey brunch towns.' },
      ],
    },
  },
  'guildford/things-to-do': {
    title: 'Best Things To Do in Guildford | Days Out, Walks & Attractions',
    description:
      'Discover the best things to do in Guildford, including walks, parks, historic sites, days out, entertainment and family-friendly attractions.',
    intro:
      'Discover the best things to do in Guildford, including walks, parks, historic sites, days out, entertainment and family-friendly attractions.',
    panel: {
      eyebrow: 'Guildford days out',
      title: 'Build a proper day out around Guildford, not just a random list of attractions.',
      body:
        "Guildford packs a lot into a small town centre — a Norman castle, the River Wey, a cobbled high street, and the Surrey Hills within easy reach. Here's where to start, whether you're planning a riverside walk, a family day out, or something indoors for a rainy afternoon.",
      links: [
        { label: 'Walks & nature in Guildford', href: '/guildford/walks-nature', description: 'Riverside walks, viewpoints and green spaces.' },
        { label: 'Gardens & parks in Guildford', href: '/guildford/gardens-parks', description: 'Outdoor spaces for easy local days out.' },
        { label: 'Historic sites in Guildford', href: '/guildford/historic-sites', description: 'Heritage, museums and town-centre history.' },
        { label: 'Entertainment in Guildford', href: '/guildford/entertainment', description: 'Indoor and evening-friendly things to do.' },
      ],
    },
  },
  'farnham/restaurants': {
    title: 'Best Restaurants in Farnham | Places To Eat in Farnham, Surrey',
    description:
      'Find the best restaurants and places to eat in Farnham, from relaxed local dining and family-friendly restaurants to date-night and Sunday roast picks.',
    intro:
      'Find the best restaurants and places to eat in Farnham, from relaxed local dining and family-friendly restaurants to date-night and Sunday roast picks.',
    panel: {
      eyebrow: 'Farnham restaurants',
      title: "Farnham's restaurant scene is a bit more varied than the high street suggests — independent Italian and Thai kitchens sit alongside a contemporary gastropub and a Mediterranean steakhouse.",
      body:
        'Below are our picks for a proper sit-down meal in Farnham. Looking for something more specific? Our date night, family dining, Sunday roast and pub food guides go deeper.',
      links: [
        { label: 'Date night in Farnham', href: '/farnham/date-night', description: 'More polished dinner options and evening choices.' },
        { label: 'Family dining in Farnham', href: '/farnham/family-dining', description: 'Restaurants that work for mixed groups and children.' },
        { label: 'Sunday roasts in Farnham', href: '/farnham/sunday-roast', description: 'Weekend pub and restaurant roast options.' },
        { label: 'Pubs & bars in Farnham', href: '/farnham/pubs-bars', description: 'Useful overlap for pub food and gastropubs.' },
      ],
    },
  },
  'farnham/pubs-bars': {
    title: 'Best Pubs in Farnham | Gastropubs, Beer Gardens & Bars',
    description:
      'Find the best pubs and bars in Farnham, including traditional pubs, gastropubs, beer gardens, country pubs and places for drinks.',
    intro:
      'Find the best pubs and bars in Farnham, including traditional pubs, gastropubs, beer gardens, country pubs and places for drinks.',
    panel: {
      eyebrow: 'Farnham pubs',
      title: 'The best pubs and bars in Farnham',
      body:
        "Farnham has a proper mix of pubs — boutique and hotel-style spots, a traditional live-music local, a historic pub with a big beer garden, and a dedicated craft beer bar. Whether you want a quiet pint, a Sunday roast, or somewhere to make a night of it, here's where to go.",
      links: [
        { label: 'Gastropubs in Farnham', href: '/farnham/gastropubs', description: 'Food-led pubs and more substantial meals.' },
        { label: 'Traditional pubs in Farnham', href: '/farnham/traditional-pubs', description: 'Classic local pubs and characterful drinking spots.' },
        { label: 'Beer gardens in Farnham', href: '/farnham/beer-gardens', description: 'Outdoor pub options for warmer days.' },
        { label: 'Restaurants in Farnham', href: '/farnham/restaurants', description: 'For searches that are really about places to eat.' },
      ],
    },
  },
}

function editorialFor(townSlug: string, routeSlug: string) {
  return townCategoryEditorial[`${townSlug}/${routeSlug}`]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isTownSlug(params.slug) && params.category === 'indoor-activities') {
    return {
      title: 'Kids & Family | Best Surrey',
      alternates: { canonical: canonicalUrl(`/${params.slug}/kids-family`) },
      robots: { index: false, follow: true },
    }
  }

  if (!isTownSlug(params.slug)) return {}

  if (isSubcategorySlug(params.category)) {
    const town = TOWN_BY_SLUG[params.slug]
    const sub = SUBCATEGORIES.find((item) => item.slug === params.category)
    if (!sub) return {}
    const editorial = editorialFor(params.slug, params.category)

    const metadata: Metadata = {
      title:       editorial?.title ?? `Best ${sub.name} in ${town.name}, Surrey`,
      description: editorial?.description ?? `The best ${sub.name.toLowerCase()} in ${town.name}. Curated local picks from Best Surrey.`,
      alternates:  { canonical: canonicalUrl(`/${params.slug}/${params.category}`) },
    }

    return metadata
  }

  if (!isCategorySlug(params.category)) return {}

  const town     = TOWN_BY_SLUG[params.slug]
  const category = CATEGORY_BY_SLUG[params.category]
  const editorial = editorialFor(params.slug, params.category)

  const metadata: Metadata = {
    title:       editorial?.title ?? `Best ${category.name} in ${town.name}, Surrey`,
    description: editorial?.description ?? `The best ${category.name.toLowerCase()} in ${town.name}. Curated picks, ranked by quality and local knowledge.`,
    alternates:  { canonical: canonicalUrl(`/${params.slug}/${params.category}`) },
  }

  return metadata
}

export default async function TownCategoryPage({ params }: Props) {
  if (isTownSlug(params.slug) && params.category === 'indoor-activities') {
    redirect(`/${params.slug}/kids-family`)
  }

  if (!isTownSlug(params.slug)) notFound()

  if (isSubcategorySlug(params.category)) {
    return <TownSubcategoryPage townSlug={params.slug} subcategorySlug={params.category} />
  }

  if (!isCategorySlug(params.category)) notFound()

  const town     = TOWN_BY_SLUG[params.slug]
  const category = CATEGORY_BY_SLUG[params.category]
  const editorial = editorialFor(params.slug, params.category)

  const [pageListings, subcategories, override, townsWithListings] = await Promise.all([
    getListingsByTownAndCategory(params.slug, params.category, 12),
    getActiveSubcategoriesForTownCategory(params.slug, params.category),
    getCategoryTownOverride(params.slug, params.category),
    getTownsWithListingsForCategory(params.category),
  ])

  if (pageListings.length === 0) {
    permanentRedirect(`/${params.slug}`)
  }

  const intro = override?.intro ?? editorial?.intro
    ?? `The best ${category.name.toLowerCase()} in ${town.name}. Curated picks, ranked by quality and local knowledge.`

  const breadcrumbItems = [
    { name: 'Home',       path: '/'                        },
    { name: category.name, path: `/${params.category}`   },
    { name: `${category.name} in ${town.name}` },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        `Best ${category.name} in ${town.name}`,
      description: intro,
      path:        `/${params.slug}/${params.category}`,
      listings:    pageListings,
    }),
  ]

  const nearbyTowns = townsWithListings
    .filter((t) => t.slug !== params.slug)
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
                Browse {category.name.toLowerCase()} by type in {town.name}
              </h2>
              <SubcategoryPills subcategories={subcategories} townSlug={params.slug} />
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

          {editorial && <EditorialPanel block={editorial.panel} />}

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

async function TownSubcategoryPage({
  townSlug,
  subcategorySlug,
}: {
  townSlug: string
  subcategorySlug: string
}) {
  const town = TOWN_BY_SLUG[townSlug as keyof typeof TOWN_BY_SLUG]
  const sub = SUBCATEGORIES.find((item) => item.slug === subcategorySlug)
  if (!town || !sub) notFound()

  const category = CATEGORY_BY_SLUG[sub.categorySlug]
  const editorial = editorialFor(townSlug, subcategorySlug)

  const [pageListings, siblingSubcategories, townsWithListings] = await Promise.all([
    getListingsByTownAndSubcategory(townSlug, subcategorySlug, 12),
    getActiveSubcategoriesForTownCategory(townSlug, sub.categorySlug),
    getTownsWithListingsForSubcategory(subcategorySlug),
  ])

  const intro = editorial?.intro ?? `The best ${sub.name.toLowerCase()} in ${town.name}. Curated local picks from Best Surrey.`

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: town.name, path: `/${townSlug}` },
    { name: category.name, path: `/${townSlug}/${sub.categorySlug}` },
    { name: `${sub.name} in ${town.name}` },
  ]

  const schema = [
    buildBreadcrumbSchema(breadcrumbItems),
    ...buildCollectionSchema({
      name:        `Best ${sub.name} in ${town.name}`,
      description: intro,
      path:        `/${townSlug}/${subcategorySlug}`,
      listings:    pageListings,
    }),
  ]

  const nearbyTowns = townsWithListings
    .filter((item) => item.slug !== townSlug)
    .slice(0, 8)

  return (
    <>
      <SiteHeader />
      <JsonLd id={`schema-${townSlug}-${subcategorySlug}`} schema={schema} />

      <PageHeader
        h1={`Best ${sub.name} in ${town.name}`}
        intro={intro}
        breadcrumbs={breadcrumbItems}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          {siblingSubcategories.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-900 mb-4">
                Browse {category.name.toLowerCase()} by type in {town.name}
              </h2>
              <SubcategoryPills
                subcategories={siblingSubcategories}
                activeSlug={subcategorySlug}
                townSlug={townSlug}
              />
            </section>
          )}

          {nearbyTowns.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-900 mb-4">
                {sub.name} in nearby towns
              </h2>
              <TownFilterRow
                towns={nearbyTowns}
                categorySlug={subcategorySlug}
                activeTown={townSlug}
              />
            </section>
          )}

          {editorial && <EditorialPanel block={editorial.panel} />}

          <section className="pt-2">
            <ListingGrid listings={pageListings} />
            {pageListings.length === 0 && (
              <p className="text-sm text-gray-500 font-body">
                We&apos;re adding {sub.name.toLowerCase()} in {town.name} soon. Check back shortly.
              </p>
            )}
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
