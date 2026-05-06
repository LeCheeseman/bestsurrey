/**
 * SiteFooter — categories, towns, legal links.
 * Phase 2 will implement the full design.
 */

import Link from 'next/link'
import { CATEGORIES, TOWNS } from '@/lib/taxonomy/constants'

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-display text-sm font-semibold text-forest-green mb-3">Categories</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}/`} className="hover:text-forest-green">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-forest-green mb-3">Places</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {TOWNS.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.slug}/`} className="hover:text-forest-green">{t.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-forest-green mb-3">Best Surrey</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/places/" className="hover:text-forest-green">Places</Link></li>
            <li><Link href="/about/"  className="hover:text-forest-green">About</Link></li>
          </ul>
        </div>

        <div className="text-xs text-gray-400 self-end">
          <p>© {new Date().getFullYear()} Best Surrey</p>
          <p className="mt-1">bestsurrey.co.uk</p>
        </div>
      </div>
    </footer>
  )
}
