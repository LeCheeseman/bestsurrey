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
      className="group flex min-h-32 flex-col gap-3 rounded-xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-forest-green hover:shadow-md"
    >
      <h3 className="font-display text-2xl font-bold leading-tight text-forest-green">
        {name}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 line-clamp-2 font-body">{description}</p>
      )}
      {count !== undefined && (
        <p className="text-base font-semibold text-gray-500 font-body mt-auto">
          {count > 0 ? `${count} place${count === 1 ? '' : 's'}` : 'Coming soon'}
        </p>
      )}
    </Link>
  )
}
