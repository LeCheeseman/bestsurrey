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
        <section className="bg-forest-green text-white">
          <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col items-center text-center">
            {/* Logo mark */}
            <div className="mb-6">
              <Image
                src="/images/logo.svg"
                alt="Best Surrey"
                width={80}
                height={80}
                priority
              />
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-wide">
              Best Surrey
            </h1>
            <p className="mt-3 font-display text-xl text-light-gold tracking-wider">
              The finest in the county
            </p>
            <p className="mt-5 text-base text-white/80 max-w-lg font-body">
              Curated restaurants, cafés, activities and experiences across Surrey.
              Locally researched. Honestly ranked.
            </p>
            <Link
              href="/places/"
              className="mt-8 inline-block bg-warm-gold hover:bg-light-gold text-white font-body font-medium px-8 py-3 rounded-lg transition-colors"
            >
              Start exploring
            </Link>
          </div>
        </section>

        {/* ── Categories ────────────────────────────────────────────────── */}
        <section className="bg-cream">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="font-display text-2xl font-semibold text-forest-green mb-6">
              Browse by category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat.slug}
                  name={cat.name}
                  slug={cat.slug}
                  count={categoryCounts[cat.slug] ?? 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Towns ─────────────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="font-display text-2xl font-semibold text-forest-green mb-6">
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
