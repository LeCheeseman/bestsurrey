/**
 * Guides index page — /guides/
 * Lists all published editorial roundups.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader }   from '@/components/layout/SiteHeader'
import { SiteFooter }   from '@/components/layout/SiteFooter'
import { Breadcrumbs }  from '@/components/layout/Breadcrumbs'
import { JsonLd }       from '@/components/schema/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema/breadcrumbs'
import { db }           from '@/lib/db'
import { roundups }     from '@/lib/db/schema'
import { eq, desc }     from 'drizzle-orm'

export const revalidate = 3600

export const metadata: Metadata = {
  title:       'Guides — Best Surrey',
  description: 'Curated local guides from the Best Surrey editorial team. Hand-picked restaurants, activities and hidden gems across Surrey.',
  alternates:  { canonical: '/guides/' },
}

export default async function GuidesIndexPage() {
  let allRoundups: { slug: string; title: string; intro: string | null; publishedAt: Date | null }[] = []

  try {
    allRoundups = await db
      .select({
        slug:        roundups.slug,
        title:       roundups.title,
        intro:       roundups.intro,
        publishedAt: roundups.publishedAt,
      })
      .from(roundups)
      .where(eq(roundups.status, 'published'))
      .orderBy(desc(roundups.publishedAt))
  } catch {
    // DB unreachable at build time — page renders with empty state, updated via ISR at runtime
  }

  const breadcrumbItems = [
    { name: 'Home',   path: '/' },
    { name: 'Guides' },
  ]

  return (
    <>
      <SiteHeader />
      <JsonLd id="schema-guides" schema={buildBreadcrumbSchema(breadcrumbItems)} />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="mt-4 font-display text-4xl font-semibold text-forest-green">
            Guides
          </h1>
          <p className="mt-3 text-base text-gray-600 font-body max-w-2xl">
            Hand-picked lists and local knowledge from the Best Surrey editorial team.
          </p>
        </div>
      </div>

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10">

          {allRoundups.length === 0 && (
            <p className="text-sm text-gray-500 font-body">
              Guides coming soon — check back shortly.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRoundups.map((roundup) => (
              <Link
                key={roundup.slug}
                href={`/guides/${roundup.slug}/`}
                className="bg-white rounded-lg border border-gray-100 p-6 hover:border-forest-green transition-colors group"
              >
                <h2 className="font-display text-lg font-semibold text-forest-green group-hover:underline leading-snug">
                  {roundup.title}
                </h2>
                {roundup.intro && (
                  <p className="mt-2 text-sm text-gray-600 font-body line-clamp-3">
                    {roundup.intro}
                  </p>
                )}
                {roundup.publishedAt && (
                  <p className="mt-3 text-xs text-gray-400 font-body">
                    {new Date(roundup.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
