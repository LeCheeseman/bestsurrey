/**
 * Taxonomy constants — single source of truth for all valid slugs.
 *
 * These are used for:
 *  - Next.js generateStaticParams (build-time route generation)
 *  - Runtime slug validation (notFound() dispatch)
 *  - DB seed data
 *  - Slug collision detection (see validation.ts)
 *
 * IMPORTANT: Town slugs and category slugs share the top-level URL namespace
 * (e.g. /guildford/ and /restaurants/ are both top-level routes handled by the
 * same [slug] segment). They MUST NOT overlap. The collision check in
 * validation.ts enforces this at module load time — adding a slug to both
 * lists will throw during build and dev startup.
 */

// ─── Towns ────────────────────────────────────────────────────────────────────

export const TOWNS = [
  // Tier 1 — priority now
  { slug: 'guildford',        name: 'Guildford'           },
  { slug: 'woking',           name: 'Woking'              },
  { slug: 'epsom',            name: 'Epsom'               },
  { slug: 'camberley',        name: 'Camberley'           },
  { slug: 'redhill',          name: 'Redhill'             },
  { slug: 'farnham',          name: 'Farnham'             },
  // Tier 2 — priority soon
  { slug: 'reigate',          name: 'Reigate'             },
  { slug: 'godalming',        name: 'Godalming'           },
  { slug: 'leatherhead',      name: 'Leatherhead'         },
  { slug: 'cobham',           name: 'Cobham'              },
  { slug: 'weybridge',        name: 'Weybridge'           },
  { slug: 'esher',            name: 'Esher'               },
  { slug: 'walton-on-thames', name: 'Walton-on-Thames'    },
  // Tier 3 — later
  { slug: 'dorking',          name: 'Dorking'             },
  { slug: 'haslemere',        name: 'Haslemere'           },
  { slug: 'oxted',            name: 'Oxted'               },
  { slug: 'virginia-water',   name: 'Virginia Water'      },
  { slug: 'cranleigh',        name: 'Cranleigh'           },
  { slug: 'staines',          name: 'Staines-upon-Thames' },
] as const

export type TownSlug = (typeof TOWNS)[number]['slug']

export const TOWN_SLUGS = TOWNS.map((t) => t.slug) as TownSlug[]

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { slug: 'restaurants',       name: 'Restaurants'       },
  { slug: 'pubs-bars',         name: 'Pubs & Bars'       },
  { slug: 'cafes-brunch',      name: 'Brunch'            },
  { slug: 'things-to-do',      name: 'Things To Do'      },
  { slug: 'kids-family',       name: 'Kids & Family'     },
  { slug: 'indoor-activities', name: 'Indoor Activities' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as CategorySlug[]

// ─── Subcategories (grouped by parent category slug) ─────────────────────────

export const SUBCATEGORIES = [
  // Restaurants
  { slug: 'fine-dining',            name: 'Fine Dining',         categorySlug: 'restaurants'       },
  { slug: 'date-night',             name: 'Date Night',          categorySlug: 'restaurants'       },
  { slug: 'casual-dining',          name: 'Casual Dining',       categorySlug: 'restaurants'       },
  { slug: 'family-dining',          name: 'Family Dining',       categorySlug: 'restaurants'       },
  { slug: 'sunday-roast',           name: 'Sunday Roast',        categorySlug: 'restaurants'       },

  // Pubs & Bars
  { slug: 'gastropubs',             name: 'Gastropubs',          categorySlug: 'pubs-bars'         },
  { slug: 'traditional-pubs',       name: 'Traditional Pubs',    categorySlug: 'pubs-bars'         },
  { slug: 'country-pubs',           name: 'Country Pubs',        categorySlug: 'pubs-bars'         },
  { slug: 'beer-gardens',           name: 'Beer Gardens',        categorySlug: 'pubs-bars'         },
  { slug: 'wine-bars',              name: 'Wine Bars',           categorySlug: 'pubs-bars'         },
  { slug: 'cocktail-bars',          name: 'Cocktail Bars',       categorySlug: 'pubs-bars'         },

  // Brunch
  { slug: 'coffee-shops',           name: 'Coffee Shops',        categorySlug: 'cafes-brunch'      },
  { slug: 'brunch-spots',           name: 'Brunch Spots',        categorySlug: 'cafes-brunch'      },
  { slug: 'bakeries',               name: 'Bakeries',            categorySlug: 'cafes-brunch'      },

  // Things To Do
  { slug: 'walks-nature',           name: 'Walks & Nature',      categorySlug: 'things-to-do'      },
  { slug: 'historic-sites',         name: 'Historic Sites',      categorySlug: 'things-to-do'      },
  { slug: 'gardens-parks',          name: 'Gardens & Parks',     categorySlug: 'things-to-do'      },
  { slug: 'days-out',               name: 'Days Out',            categorySlug: 'things-to-do'      },
  { slug: 'arts-culture',           name: 'Arts & Culture',      categorySlug: 'things-to-do'      },
  { slug: 'entertainment',          name: 'Entertainment',       categorySlug: 'things-to-do'      },

  // Kids & Family
  { slug: 'soft-play',              name: 'Soft Play',           categorySlug: 'kids-family'       },
  { slug: 'farms-animals',          name: 'Farms & Animals',     categorySlug: 'kids-family'       },
  { slug: 'outdoor-play',           name: 'Outdoor Play',        categorySlug: 'kids-family'       },
  { slug: 'museums-education',      name: 'Museums & Education', categorySlug: 'kids-family'       },

  // Indoor Activities
  { slug: 'escape-rooms',           name: 'Escape Rooms',        categorySlug: 'indoor-activities' },
  { slug: 'bowling',                name: 'Bowling',             categorySlug: 'indoor-activities' },
  { slug: 'climbing',               name: 'Climbing',            categorySlug: 'indoor-activities' },
  { slug: 'mini-golf',              name: 'Mini Golf',           categorySlug: 'indoor-activities' },
  { slug: 'trampoline-parks',       name: 'Trampoline Parks',    categorySlug: 'indoor-activities' },
] as const

export type SubcategorySlug = (typeof SUBCATEGORIES)[number]['slug']

export const SUBCATEGORY_SLUGS = SUBCATEGORIES.map((s) => s.slug) as SubcategorySlug[]

// ─── Helper lookups ───────────────────────────────────────────────────────────

export const TOWN_BY_SLUG = Object.fromEntries(
  TOWNS.map((t) => [t.slug, t])
) as Record<TownSlug, (typeof TOWNS)[number]>

export const CATEGORY_BY_SLUG = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
) as Record<CategorySlug, (typeof CATEGORIES)[number]>

export const SUBCATEGORIES_BY_CATEGORY = SUBCATEGORIES.reduce<
  Record<CategorySlug, typeof SUBCATEGORIES[number][]>
>((acc, sub) => {
  const key = sub.categorySlug as CategorySlug
  if (!acc[key]) acc[key] = []
  acc[key].push(sub)
  return acc
}, {} as Record<CategorySlug, typeof SUBCATEGORIES[number][]>)
