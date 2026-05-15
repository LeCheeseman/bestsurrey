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
            className={`group/town inline-flex items-center overflow-hidden rounded-full border px-3 py-1.5 text-sm font-body transition-all duration-300 hover:scale-105 hover:px-4 ${
              isActive
                ? 'bg-forest-green text-white border-forest-green'
                : 'bg-white text-gray-700 border-gray-200 hover:border-mid-green hover:bg-mist-green hover:text-forest-green'
            }`}
          >
            <span className="transition-opacity duration-200 group-hover/town:hidden">{town.name}</span>
            <span className="hidden transition-opacity duration-200 group-hover/town:inline">Best in {town.name}</span>
            {town.count !== undefined && town.count > 0 && (
              <span className="ml-1 text-xs opacity-70">({town.count})</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
