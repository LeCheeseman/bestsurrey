/**
 * SiteHeader — primary navigation with inline search.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Eat', href: '/restaurants/', match: ['/restaurants/', '/pubs-bars/', '/brunch/'] },
  { label: 'Do', href: '/things-to-do/', match: ['/things-to-do/'] },
  { label: 'Family', href: '/kids-family/', match: ['/kids-family/'] },
  { label: 'Activities', href: '/indoor-activities/', match: ['/indoor-activities/'] },
  { label: 'Places', href: '/places/', match: ['/places/'] },
]

export function SiteHeader() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-gray-100 backdrop-blur">
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
            {navItems.map((item) => {
              const active = item.match.some((href) => {
                const segment = href.replaceAll('/', '')
                return pathname === href || pathname.startsWith(href) || pathSegments.includes(segment)
              })
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'rounded-full px-3 py-1.5 transition-colors',
                      active
                        ? 'bg-mist-green font-semibold text-forest-green'
                        : 'hover:bg-parchment hover:text-forest-green',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

      </div>
    </header>
  )
}
