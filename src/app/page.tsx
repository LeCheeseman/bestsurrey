import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { TownCard } from '@/components/ui/TownCard'
import { getListingCountsByCategory, getListingCountsByTown } from '@/lib/queries/taxonomy'
import { CATEGORIES, TOWNS } from '@/lib/taxonomy/constants'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Best Surrey — The Finest in the County',
  description:
    'The curated guide to the best restaurants, cafés, activities and things to do across Surrey.',
  openGraph: {
    title:       'Best Surrey — The Finest in the County',
    description: 'The curated guide to the best restaurants, cafés, activities and things to do across Surrey.',
    url:         'https://bestsurrey.co.uk',
  },
}

const homeCategories = [
  {
    slug: 'restaurants',
    label: 'Eat',
    accent: 'green' as const,
    description: 'From neighbourhood bistros to destination dining, these are the Surrey tables worth booking.',
    icon: <RestaurantIcon />,
  },
  {
    slug: 'pubs-bars',
    label: 'Drink',
    accent: 'gold' as const,
    description: 'Characterful pubs, smart bars and proper locals for a well-made drink.',
    icon: <DrinkIcon />,
  },
  {
    slug: 'cafes-brunch',
    label: 'Morning',
    accent: 'terracotta' as const,
    description: 'Brunch spots, coffee stops and bakeries for slower starts and good catch-ups.',
    icon: <BrunchIcon />,
  },
  {
    slug: 'things-to-do',
    label: 'Explore',
    accent: 'violet' as const,
    description: 'Gardens, walks, culture and days out across the county.',
    icon: <ExploreIcon />,
  },
  {
    slug: 'kids-family',
    label: 'Family',
    accent: 'rose' as const,
    description: 'Family-friendly days out, play spaces and child-approved Surrey picks.',
    icon: <FamilyIcon />,
  },
]

export default async function HomePage() {
  let categoryCounts: Record<string, number> = {}
  let townCounts: Record<string, number> = {}

  try {
    ;[categoryCounts, townCounts] = await Promise.all([
      getListingCountsByCategory(),
      getListingCountsByTown(),
    ])
  } catch {
    // DB unreachable at build time — page renders with empty state, updated via ISR at runtime
  }

  return (
    <>
      <SiteHeader />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="overflow-hidden bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-10 text-center md:pb-24 md:pt-14">
            <div className="hero-logo-arrive mb-7 [--arrival-delay:80ms]">
              <Image
                src="/images/logo.svg"
                alt="Best Surrey"
                width={144}
                height={144}
                priority
              />
            </div>

            <h1 className="hero-title-shimmer font-display text-6xl font-bold leading-none md:text-8xl [--arrival-delay:320ms]">
              Best Surrey
            </h1>
            <p className="hero-arrive mt-4 font-body text-xs font-bold uppercase tracking-[0.32em] text-warm-gold [--arrival-delay:360ms]">
              The finest in the county
            </p>
            <p className="hero-arrive mt-6 max-w-xl text-lg font-semibold leading-relaxed text-gray-800 font-body [--arrival-delay:620ms]">
              The timesaving guide to the best places to dine, drink and visit in Surrey.
            </p>
            <Link
              href="/places/"
              className="hero-arrive mt-9 inline-flex rounded-full bg-forest-green px-8 py-3 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-mid-green [--arrival-delay:640ms]"
            >
              Start exploring
            </Link>
          </div>
        </section>

        {/* ── Categories ────────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="font-display text-4xl font-bold text-forest-green mb-7">
              Browse by category
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {homeCategories.map((homeCategory) => {
                const cat = CATEGORIES.find((item) => item.slug === homeCategory.slug)
                if (!cat) return null
                return (
                <CategoryCard
                  key={cat.slug}
                  name={cat.name}
                  slug={cat.slug}
                  count={categoryCounts[cat.slug] ?? 0}
                  icon={homeCategory.icon}
                  label={homeCategory.label}
                  accent={homeCategory.accent}
                  description={homeCategory.description}
                />
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Towns ─────────────────────────────────────────────────────── */}
        <section className="bg-parchment">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="font-display text-4xl font-bold text-forest-green mb-7">
              Browse by town
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TOWNS.map((town) => (
                <TownCard
                  key={town.slug}
                  name={town.name}
                  slug={town.slug}
                  count={townCounts[town.slug] ?? 0}
                />
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  )
}

function RestaurantIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v8" />
      <path d="M10 3v8" />
      <path d="M8 3v18" />
      <path d="M17 3c1.4 1.6 2 3.5 2 6 0 3-1.1 5-3 5h-1v7" />
    </svg>
  )
}

function DrinkIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10l-1 7a4 4 0 0 1-8 0L7 3Z" />
      <path d="M8.5 8h7" />
      <path d="M12 14v7" />
      <path d="M9 21h6" />
    </svg>
  )
}

function BrunchIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11h13v3a6 6 0 0 1-6 6H9a4 4 0 0 1-4-4v-5Z" />
      <path d="M18 12h1a2 2 0 0 1 0 4h-1" />
      <path d="M8 7c-1-1 .8-2-.2-3" />
      <path d="M12 7c-1-1 .8-2-.2-3" />
    </svg>
  )
}

function ExploreIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function FamilyIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M9 15c1.5 1.3 4.5 1.3 6 0" />
    </svg>
  )
}
