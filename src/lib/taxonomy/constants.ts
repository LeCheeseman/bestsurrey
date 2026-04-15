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
  { slug: 'guildford',  name: 'Guildford'  },
  { slug: 'woking',     name: 'Woking'     },
  { slug: 'farnham',    name: 'Farnham'    },
  { slug: 'reigate',    name: 'Reigate'    },
  { slug: 'epsom',      name: 'Epsom'      },
  { slug: 'dorking',    name: 'Dorking'    },
  { slug: 'weybridge',  name: 'Weybridge'  },
  { slug: 'cobham',     name: 'Cobham'     },
] as const

export type TownSlug = (typeof TOWNS)[number]['slug']

export const TOWN_SLUGS = TOWNS.map((t) => t.slug) as TownSlug[]

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { slug: 'restaurants',     name: 'Restaurants'       },
  { slug: 'cafes-brunch',    name: 'Cafés & Brunch'    },
  { slug: 'kids-activities', name: 'Kids Activities'   },
  { slug: 'things-to-do',    name: 'Things To Do'      },
  { slug: 'activity-venues', name: 'Activity Venues'   },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as CategorySlug[]

// ─── Subcategories (grouped by parent category slug) ─────────────────────────

export const SUBCATEGORIES = [
  // Restaurants
  { slug: 'vegan-restaurants',      name: 'Vegan',             categorySlug: 'restaurants'     },
  { slug: 'vegetarian-restaurants', name: 'Vegetarian',        categorySlug: 'restaurants'     },
  { slug: 'fine-dining',            name: 'Fine Dining',       categorySlug: 'restaurants'     },
  { slug: 'casual-dining',          name: 'Casual Dining',     categorySlug: 'restaurants'     },
  { slug: 'pubs-gastropubs',        name: 'Pubs & Gastropubs', categorySlug: 'restaurants'     },
  { slug: 'brunch',                 name: 'Brunch',            categorySlug: 'restaurants'     },
  { slug: 'date-night',             name: 'Date Night',        categorySlug: 'restaurants'     },
  { slug: 'family-dining',          name: 'Family Dining',     categorySlug: 'restaurants'     },
  { slug: 'takeaway',               name: 'Takeaway',          categorySlug: 'restaurants'     },

  // Cafés & Brunch
  { slug: 'coffee-shops',           name: 'Coffee Shops',      categorySlug: 'cafes-brunch'    },
  { slug: 'brunch-spots',           name: 'Brunch Spots',      categorySlug: 'cafes-brunch'    },
  { slug: 'bakeries',               name: 'Bakeries',          categorySlug: 'cafes-brunch'    },
  { slug: 'tea-rooms',              name: 'Tea Rooms',         categorySlug: 'cafes-brunch'    },

  // Kids Activities
  { slug: 'soft-play',              name: 'Soft Play',         categorySlug: 'kids-activities' },
  { slug: 'outdoor-play',           name: 'Outdoor Play',      categorySlug: 'kids-activities' },
  { slug: 'farms-animals',          name: 'Farms & Animals',   categorySlug: 'kids-activities' },
  { slug: 'museums-education',      name: 'Museums & Education', categorySlug: 'kids-activities' },
  { slug: 'arts-crafts',            name: 'Arts & Crafts',     categorySlug: 'kids-activities' },
  { slug: 'indoor-kids-activities', name: 'Indoor Activities', categorySlug: 'kids-activities' },
  { slug: 'outdoor-kids-activities',name: 'Outdoor Activities',categorySlug: 'kids-activities' },

  // Things To Do
  { slug: 'walks-nature',           name: 'Walks & Nature',    categorySlug: 'things-to-do'    },
  { slug: 'historic-sites',         name: 'Historic Sites',    categorySlug: 'things-to-do'    },
  { slug: 'gardens-parks',          name: 'Gardens & Parks',   categorySlug: 'things-to-do'    },
  { slug: 'entertainment',          name: 'Entertainment',     categorySlug: 'things-to-do'    },
  { slug: 'days-out',               name: 'Days Out',          categorySlug: 'things-to-do'    },

  // Activity Venues
  { slug: 'go-karting',             name: 'Go-Karting',        categorySlug: 'activity-venues' },
  { slug: 'bowling',                name: 'Bowling',           categorySlug: 'activity-venues' },
  { slug: 'mini-golf',              name: 'Mini Golf',         categorySlug: 'activity-venues' },
  { slug: 'climbing',               name: 'Climbing',          categorySlug: 'activity-venues' },
  { slug: 'laser-tag',              name: 'Laser Tag',         categorySlug: 'activity-venues' },
  { slug: 'escape-rooms',           name: 'Escape Rooms',      categorySlug: 'activity-venues' },
  { slug: 'swimming',               name: 'Swimming',          categorySlug: 'activity-venues' },
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
