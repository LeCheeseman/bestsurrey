/**
 * Breadcrumbs — renders a visible breadcrumb trail.
 * Pass the same items array used to build the BreadcrumbList JSON-LD.
 */

import Link from 'next/link'
import type { BreadcrumbItem } from '@/lib/schema/breadcrumbs'

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.path && !isLast ? (
                <Link href={item.path} className="hover:text-forest-green transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-gray-900' : ''}>
                  {item.name}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
