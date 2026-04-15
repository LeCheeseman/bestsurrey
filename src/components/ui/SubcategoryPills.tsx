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
            className={`text-sm px-3 py-1.5 rounded-full border font-body transition-colors ${
              isActive
                ? 'bg-forest-green text-white border-forest-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-forest-green hover:text-forest-green'
            }`}
          >
            {sub.name}
          </Link>
        )
      })}
    </div>
  )
}
