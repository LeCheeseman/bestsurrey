import Link from 'next/link'

interface SubcategoryPillsProps {
  subcategories: Array<{ slug: string; name: string }>
  activeSlug?:   string
}

export function SubcategoryPills({ subcategories, activeSlug }: SubcategoryPillsProps) {
  if (subcategories.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {subcategories.map((sub) => {
        const isActive = sub.slug === activeSlug
        return (
          <Link
            key={sub.slug}
            href={`/surrey/${sub.slug}/`}
            className={`rounded-full border px-4 py-2 text-sm font-medium font-body transition-all duration-300 hover:scale-105 ${
              isActive
                ? 'bg-forest-green text-white border-forest-green'
                : 'bg-white text-gray-800 border-gray-200 hover:border-mid-green hover:bg-mist-green hover:text-forest-green'
            }`}
          >
            {sub.name}
          </Link>
        )
      })}
    </div>
  )
}
