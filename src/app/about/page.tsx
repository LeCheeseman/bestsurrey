import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata: Metadata = {
  title: 'About Best Surrey',
  description: 'How Best Surrey researches, curates and ranks local restaurants, cafés, pubs, activities and places to visit across Surrey.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <PageHeader
        h1="About Best Surrey"
        intro="Best Surrey is a curated local directory for restaurants, cafés, pubs, family days out, activities and places to visit across Surrey."
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About' },
        ]}
      />

      <main className="bg-cream min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              How listings are selected
            </h2>
            <p className="text-gray-700 font-body leading-relaxed">
              We prioritise places with a clear local reputation, useful visitor information,
              strong category fit and enough verified detail to help people make a decision.
              Listings are grouped by town, category and specialist interests such as family
              dining, vegan restaurants, country pubs, soft play and days out.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              How rankings work
            </h2>
            <p className="text-gray-700 font-body leading-relaxed">
              Rankings combine editorial judgement, category fit, completeness of verified
              information and available reputation signals. Sponsored listings are labelled
              separately from editorial picks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Corrections
            </h2>
            <p className="text-gray-700 font-body leading-relaxed">
              Venue details change. Always check directly with the venue before travelling,
              booking or buying tickets. If something is wrong, the listing can be updated
              after the source information has been verified.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
