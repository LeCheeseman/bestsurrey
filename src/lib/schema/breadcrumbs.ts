/**
 * JSON-LD: BreadcrumbList schema.
 * Each page template constructs its own breadcrumb trail and passes it here.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'

export interface BreadcrumbItem {
  name: string
  /** Omit for the last (current) item — schema.org does not require a URL on the final item */
  path?: string
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  }
}

// ─── Per-template breadcrumb builders ─────────────────────────────────────────

export function categoryBreadcrumbs(categoryName: string, categorySlug: string) {
  return buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: categoryName },
  ])
}

export function townBreadcrumbs(townName: string, townSlug: string) {
  return buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: townName },
  ])
}

export function townCategoryBreadcrumbs(
  townName: string,
  townSlug: string,
  categoryName: string,
  categorySlug: string
) {
  return buildBreadcrumbSchema([
    { name: 'Home',       path: '/'                         },
    { name: townName,     path: `/${townSlug}/`             },
    { name: categoryName },
  ])
}

export function subcategoryBreadcrumbs(
  categoryName: string,
  categorySlug: string,
  subcategoryName: string
) {
  return buildBreadcrumbSchema([
    { name: 'Home',         path: '/'               },
    { name: categoryName,   path: `/${categorySlug}/` },
    { name: subcategoryName },
  ])
}

export function listingBreadcrumbs(
  categoryName: string,
  categorySlug: string,
  townName: string,
  townSlug: string,
  listingName: string
) {
  return buildBreadcrumbSchema([
    { name: 'Home',                          path: '/'                              },
    { name: categoryName,                    path: `/${categorySlug}/`              },
    { name: `${categoryName} in ${townName}`, path: `/${townSlug}/${categorySlug}/` },
    { name: listingName },
  ])
}

export function guideBreadcrumbs(guideTitle: string) {
  return buildBreadcrumbSchema([
    { name: 'Home',   path: '/'       },
    { name: 'Guides', path: '/guides/' },
    { name: guideTitle },
  ])
}
