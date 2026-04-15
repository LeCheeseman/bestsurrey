/**
 * Search results page — /search?q=...&town=...&category=...
 *
 * Server component: reads searchParams, queries PG FTS, renders results.
 * Not indexed by search engines (search result pages have no SEO value).
 */

import type { Metadata } from 'next'
import { SiteHeader }  from '@/components/layout/SiteHeader'
import { SiteFooter }  from '@/components/layout/SiteFooter'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { searchListings } from '@/lib/queries/search'
import { TOWNS, CATEGORIES } from '@/lib/taxonomy/constants'

interface Props {
  searchParams: { q?: string; town?: string; category?: string }
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim()
  return {
    title:       q ? `"${q}" — Search` : 'Search',
    description: q ? `Best Surrey search results for "${q}"` : 'Search the Best Surrey directory.',
    robots:      { index: false, follow: false },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const query       = searchParams.q?.trim()        ?? ''
  const townSlug    = searchParams.town?.trim()     || undefined
  const categorySlug = searchParams.category?.trim() || undefined

  const results = query.length >= 2
    ? await searchListings(query, { townSlug, categorySlug })
    : []

  const activeTown     = TOWNS.find((t) => t.slug === townSlug)
  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug)

  return (
    <>
      <SiteHeader />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="font-display text-2xl font-semibold text-forest-green mb-5">
            Search Best Surrey
          </h1>

          {/* Search form — plain HTML, no JS required */}
          <form method="GET" action="/search">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="e.g. Italian restaurant, dog-friendly café..."
                autoComplete="off"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-green"
              />

              <select
                name="town"
                defaultValue={townSlug ?? ''}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body bg-white"
              >
                <option value="">All towns</option>
                {TOWNS.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>

              <select
                name="category"
                defaultValue={categorySlug ?? ''}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body bg-white"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-forest-green text-white font-body text-sm px-6 py-2.5 rounded-lg hover:bg-mid-green transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* No query entered */}
          {query.length < 2 && (
            <p className="text-sm text-gray-500 font-body">
              Enter a search term above to find places across Surrey.
            </p>
          )}

          {/* Query entered, no results */}
          {query.length >= 2 && results.length === 0 && (
            <div>
              <p className="text-sm text-gray-700 font-body">
                No results for <strong>&ldquo;{query}&rdquo;</strong>
                {activeTown ? ` in ${activeTown.name}` : ''}
                {activeCategory ? ` · ${activeCategory.name}` : ''}.
              </p>
              <p className="text-sm text-gray-500 font-body mt-2">
                Try broadening your search or removing a filter.
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <p className="text-sm text-gray-500 font-body mb-6">
                {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
                <strong>&ldquo;{query}&rdquo;</strong>
                {activeTown ? ` in ${activeTown.name}` : ''}
                {activeCategory ? ` · ${activeCategory.name}` : ''}
              </p>
              <ListingGrid listings={results} />
            </>
          )}

        </div>
      </main>

      <SiteFooter />
    </>
  )
}
