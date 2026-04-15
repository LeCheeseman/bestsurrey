/**
 * SiteHeader — primary navigation.
 * Phase 2 will implement the full design. Stub establishes the structure.
 */

import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-forest-green font-semibold tracking-wide">
          Best Surrey
        </Link>

        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-6 text-sm font-body">
            <li><Link href="/restaurants/">Eat</Link></li>
            <li><Link href="/things-to-do/">Do</Link></li>
            <li><Link href="/kids-activities/">Family</Link></li>
            <li><Link href="/activity-venues/">Activities</Link></li>
            <li><Link href="/guides/">Guides</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
