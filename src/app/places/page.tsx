import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PageHeader } from '@/components/ui/PageHeader'
import { TownCard } from '@/components/ui/TownCard'
import { getListingCountsByTown } from '@/lib/queries/taxonomy'
import { TOWNS } from '@/lib/taxonomy/constants'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Places in Surrey',
  description: 'Browse the Best Surrey directory by town, from Guildford and Woking to smaller Surrey towns and villages.',
  alternates: { canonical: '/places' },
}

const TOWN_GROUPS = [
  {
    name: 'Main Surrey towns',
    slugs: ['guildford', 'woking', 'epsom', 'camberley', 'redhill', 'farnham'],
  },
  {
    name: 'Surrey Hills and market towns',
    slugs: ['dorking', 'godalming', 'haslemere', 'cranleigh', 'reigate'],
  },
  {
    name: 'North Surrey and riverside towns',
    slugs: ['weybridge', 'walton-on-thames', 'staines', 'chertsey'],
  },
  {
    name: 'Villages and smaller areas',
    slugs: ['cobham', 'esher', 'oxted', 'virginia-water', 'leatherhead'],
  },
] as const

export default async function PlacesPage() {
  let townCounts: Record<string, number> = {}

  try {
    townCounts = await getListingCountsByTown()
  } catch {
    // DB unreachable at build time; counts refresh through ISR.
  }

  return (
    <>
      <SiteHeader />

      <PageHeader
        h1="Places in Surrey"
        intro="Browse restaurants, cafés, pubs, family days out and activities by Surrey town."
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Places' },
        ]}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {TOWN_GROUPS.map((group) => {
            const towns = group.slugs
              .map((slug) => TOWNS.find((town) => town.slug === slug))
              .filter((town): town is typeof TOWNS[number] => Boolean(town))

            return (
              <section key={group.name}>
                <h2 className="font-display text-lg font-semibold text-forest-green mb-4">
                  {group.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {towns.map((town) => (
                    <TownCard
                      key={town.slug}
                      name={town.name}
                      slug={town.slug}
                      count={townCounts[town.slug] ?? 0}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
