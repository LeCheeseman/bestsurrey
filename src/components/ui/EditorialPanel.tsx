import Link from 'next/link'

export type EditorialLink = {
  label: string
  href: string
  description?: string
}

export type EditorialBlock = {
  eyebrow: string
  title: string
  body: string
  links: EditorialLink[]
}

export function EditorialPanel({ block }: { block: EditorialBlock }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-7">
      <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-warm-gold">
        {block.eyebrow}
      </p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div>
          <h2 className="max-w-3xl font-display text-2xl font-semibold leading-tight text-forest-green md:text-3xl">
            {block.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 font-body">
            {block.body}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {block.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-gray-100 bg-parchment/60 p-4 transition-all hover:-translate-y-0.5 hover:border-mid-green hover:bg-mist-green"
            >
              <span className="font-body text-sm font-bold text-gray-950 group-hover:text-forest-green">
                {link.label}
              </span>
              {link.description && (
                <span className="mt-1 block text-sm leading-5 text-gray-600 font-body">
                  {link.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
