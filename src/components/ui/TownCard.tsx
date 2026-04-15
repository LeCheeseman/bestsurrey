import Link from 'next/link'

interface TownCardProps {
  name:         string
  slug:         string
  description?: string
  count?:       number
}

export function TownCard({ name, slug, description, count }: TownCardProps) {
  return (
    <Link
      href={`/${slug}/`}
      className="group flex flex-col gap-2 p-5 bg-white border border-gray-100 rounded-lg hover:border-forest-green hover:shadow-sm transition-all"
    >
      <h3 className="font-display text-base font-semibold text-forest-green group-hover:underline">
        {name}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 line-clamp-2 font-body">{description}</p>
      )}
      {count !== undefined && (
        <p className="text-xs text-gray-400 font-body mt-auto">
          {count > 0 ? `${count} place${count === 1 ? '' : 's'}` : 'Coming soon'}
        </p>
      )}
    </Link>
  )
}
