import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import type { BreadcrumbItem } from '@/lib/schema/breadcrumbs'

interface PageHeaderProps {
  h1:           string
  intro?:       string
  breadcrumbs?: BreadcrumbItem[]
}

export function PageHeader({ h1, intro, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 pb-8 pt-7">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-parchment px-6 py-7 shadow-sm md:px-8 md:py-9">
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-none text-forest-green md:text-5xl">{h1}</h1>
        {intro && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-700 font-body">{intro}</p>
        )}
        </div>
      </div>
    </div>
  )
}
