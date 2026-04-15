import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import type { BreadcrumbItem } from '@/lib/schema/breadcrumbs'

interface PageHeaderProps {
  h1:           string
  intro?:       string
  breadcrumbs?: BreadcrumbItem[]
}

export function PageHeader({ h1, intro, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <h1 className="font-display text-4xl font-semibold text-forest-green">{h1}</h1>
        {intro && (
          <p className="mt-3 text-base text-gray-600 max-w-2xl font-body">{intro}</p>
        )}
      </div>
    </div>
  )
}
