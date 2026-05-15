import Link from 'next/link'
import type { ReactNode } from 'react'

interface CategoryCardProps {
  name:        string
  slug:        string
  icon?:       ReactNode
  description?: string
  count?:      number
  label?:      string
  accent?:     'green' | 'gold' | 'terracotta' | 'violet' | 'rose' | 'blue'
}

const accentStyles = {
  green:      { border: 'border-t-mid-green',      icon: 'bg-mist-green text-forest-green',      label: 'bg-mist-green text-forest-green' },
  gold:       { border: 'border-t-warm-gold',      icon: 'bg-amber-50 text-amber-800',           label: 'bg-amber-50 text-amber-800' },
  terracotta: { border: 'border-t-orange-500',     icon: 'bg-orange-50 text-orange-800',         label: 'bg-orange-50 text-orange-800' },
  violet:     { border: 'border-t-violet-600',     icon: 'bg-violet-50 text-violet-800',         label: 'bg-violet-50 text-violet-800' },
  rose:       { border: 'border-t-rose-500',       icon: 'bg-rose-50 text-rose-800',             label: 'bg-rose-50 text-rose-800' },
  blue:       { border: 'border-t-blue-500',       icon: 'bg-blue-50 text-blue-800',             label: 'bg-blue-50 text-blue-800' },
}

export function CategoryCard({
  name,
  slug,
  icon,
  description,
  count,
  label,
  accent = 'green',
}: CategoryCardProps) {
  const styles = accentStyles[accent]

  return (
    <Link
      href={`/${slug}/`}
      className={[
        'group flex min-h-44 flex-col rounded-xl border border-gray-200 border-t-4 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md',
        styles.border,
      ].join(' ')}
    >
      {icon && (
        <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl [&_svg]:h-6 [&_svg]:w-6 ${styles.icon}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="space-y-2">
        <h3 className="font-body text-lg font-bold leading-tight text-gray-950">
          {name}
        </h3>
        {count !== undefined && (
          <p className="text-sm font-semibold text-gray-600 font-body">
            {count > 0 ? `${count} place${count === 1 ? '' : 's'}` : 'Coming soon'}
          </p>
        )}
      </div>

      {description && (
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-700 font-body">
          {description}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        {label && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles.label}`}>
            {label}
          </span>
        )}
        <span className="ml-auto text-xl leading-none text-gray-500 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}
