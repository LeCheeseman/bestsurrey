import Link from 'next/link'

interface TownFilterRowProps {
  towns:        Array<{ slug: string; name: string; count?: number }>
  categorySlug?: string  // if set, links to /{town}/{category}/; otherwise /{town}/
  activeTown?:  string
}

export function TownFilterRow({ towns, categorySlug, activeTown }: TownFilterRowProps) {
  if (towns.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {towns.map((town) => {
        const href = categorySlug ? `/${town.slug}/${categorySlug}/` : `/${town.slug}/`
        const isActive = town.slug === activeTown

        return (
          <Link
            key={town.slug}
            href={href}
            className={`text-sm px-3 py-1.5 rounded-full border font-body transition-colors ${
              isActive
                ? 'bg-forest-green text-white border-forest-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-forest-green hover:text-forest-green'
            }`}
          >
            {town.name}
            {town.count !== undefined && town.count > 0 && (
              <span className="ml-1 text-xs opacity-70">({town.count})</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
