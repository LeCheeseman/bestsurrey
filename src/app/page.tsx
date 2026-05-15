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
        <section className="overflow-hidden bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center md:py-28">
            <div className="hero-arrive mb-7 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm [--arrival-delay:80ms]">
              <Image
                src="/images/logo.svg"
                alt="Best Surrey"
                width={72}
                height={72}
                priority
              />
            </div>

            <h1 className="hero-arrive font-display text-6xl font-semibold leading-none text-forest-green md:text-7xl [--arrival-delay:220ms]">
              Best Surrey
            </h1>
            <p className="hero-arrive mt-4 font-body text-xs font-bold uppercase tracking-[0.32em] text-warm-gold [--arrival-delay:360ms]">
              The finest in the county
            </p>
            <p className="hero-arrive mt-6 max-w-xl text-lg leading-relaxed text-gray-700 font-body [--arrival-delay:500ms]">
              Curated restaurants, cafés, activities and experiences across Surrey.
              Locally researched. Honestly ranked.
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
        <section className="bg-parchment">
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
