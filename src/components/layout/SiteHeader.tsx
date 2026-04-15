/**
 * SiteHeader — primary navigation with inline search.
 */

import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link
          href="/"
          className="font-display text-forest-green font-semibold tracking-wide shrink-0"
        >
          Best Surrey
        </Link>

        {/* Search — stretches to fill available space */}
        <form method="GET" action="/search" className="flex-1 max-w-sm">
          <input
            type="search"
            name="q"
            placeholder="Search places..."
            autoComplete="off"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-green"
          />
        </form>

        {/* Primary nav */}
        <nav aria-label="Primary navigation" className="hidden sm:block">
          <ul className="flex items-center gap-5 text-sm font-body text-gray-600">
            <li><Link href="/restaurants/"   className="hover:text-forest-green transition-colors">Eat</Link></li>
            <li><Link href="/things-to-do/"  className="hover:text-forest-green transition-colors">Do</Link></li>
            <li><Link href="/kids-activities/" className="hover:text-forest-green transition-colors">Family</Link></li>
            <li><Link href="/activity-venues/" className="hover:text-forest-green transition-colors">Activities</Link></li>
            <li><Link href="/guides/"        className="hover:text-forest-green transition-colors">Guides</Link></li>
          </ul>
        </nav>

      </div>
    </header>
  )
}
