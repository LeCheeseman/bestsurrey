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
  featured?:   boolean
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
  featured = false,
}: CategoryCardProps) {
  const styles = accentStyles[accent]

  return (
    <Link
      href={`/${slug}/`}
      className={[
        'group flex min-h-64 flex-col rounded-2xl border border-gray-200 border-t-[5px] bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg',
        styles.border,
        featured ? 'lg:col-span-2' : '',
      ].join(' ')}
    >
      {icon && (
        <span className={`mb-7 flex h-16 w-16 items-center justify-center rounded-2xl ${styles.icon}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="space-y-2">
        <h3 className="font-body text-2xl font-bold leading-tight text-gray-950">
          {name}
        </h3>
        {count !== undefined && (
          <p className="text-lg font-medium text-gray-700 font-body">
            {count > 0 ? `${count} place${count === 1 ? '' : 's'}` : 'Coming soon'}
          </p>
        )}
      </div>

      {description && (
        <p className={`mt-8 text-base leading-relaxed text-gray-700 font-body ${featured ? 'max-w-2xl' : 'line-clamp-3'}`}>
          {description}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-4 pt-8">
        {label && (
          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${styles.label}`}>
            {label}
          </span>
        )}
        <span className="ml-auto text-3xl leading-none text-gray-500 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}
