/**
 * Taxonomy seed — populates categories, subcategories, towns, and tags.
 *
 * Run via: npm run db:seed
 *
 * This is idempotent: uses INSERT ... ON CONFLICT DO NOTHING so it's safe
 * to re-run without duplicating data.
 */

import { db } from '../../src/lib/db'
import { categories, subcategories, towns, tags } from '../../src/lib/db/schema'
import { CATEGORIES, SUBCATEGORIES, TOWNS } from '../../src/lib/taxonomy/constants'
import { sql } from 'drizzle-orm'

async function seed() {
  console.log('Seeding taxonomy...')

  // ── Categories ──────────────────────────────────────────────────────────────

  const categoryMeta: Record<string, { icon: string; description: string }> = {
    restaurants: {
      icon: '🍽️',
      description: 'The best restaurants across Surrey, from casual dining to fine dining.',
    },
    'pubs-bars': {
      icon: '🍺',
      description: 'Pubs, gastropubs, beer gardens, wine bars and cocktail bars across Surrey.',
    },
    'cafes-brunch': {
      icon: '☕',
      description: 'The best brunch spots, coffee shops, bakeries and tea rooms across Surrey.',
    },
    'things-to-do': {
      icon: '🗺️',
      description: 'Things to do across Surrey — walks, historic sites, gardens and more.',
    },
    'kids-family': {
      icon: '🎠',
      description: 'The best family days out and children’s activities in Surrey.',
    },
    'indoor-activities': {
      icon: '🏁',
      description: 'Indoor activity venues across Surrey — bowling, climbing, soft play and more.',
    },
  }

  const categoryData = CATEGORIES.map((category, index) => ({
    ...category,
    sortOrder: index + 1,
    icon: categoryMeta[category.slug].icon,
    description: categoryMeta[category.slug].description,
  }))

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData.map((c) => ({
      name:      c.name,
      slug:      c.slug,
      sortOrder: c.sortOrder,
      icon:      c.icon,
      description: c.description,
    })))
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name:        sql`excluded.name`,
        sortOrder:   sql`excluded.sort_order`,
        icon:        sql`excluded.icon`,
        description: sql`excluded.description`,
        updatedAt:   new Date(),
      },
    })
    .returning({ id: categories.id, slug: categories.slug })

  console.log(`  Categories: ${insertedCategories.length} inserted`)

  // Build slug → id map (fetch all, not just inserted, in case re-running)
  const allCategories = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const categoryIdBySlug = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))

  // ── Subcategories ────────────────────────────────────────────────────────────

  const subcategoryData = SUBCATEGORIES.map((sub) => ({
    name:       sub.name,
    slug:       sub.slug,
    categoryId: categoryIdBySlug[sub.categorySlug],
    sortOrder:  SUBCATEGORIES.filter((item) => item.categorySlug === sub.categorySlug).findIndex((item) => item.slug === sub.slug) + 1,
  })).filter((s) => s.categoryId) // guard against missing parent

  const insertedSubcategories = await db
    .insert(subcategories)
    .values(subcategoryData)
    .onConflictDoUpdate({
      target: subcategories.slug,
      set: {
        name:       sql`excluded.name`,
        categoryId: sql`excluded.category_id`,
        sortOrder:  sql`excluded.sort_order`,
        updatedAt:  new Date(),
      },
    })
    .returning({ id: subcategories.id })

  console.log(`  Subcategories: ${insertedSubcategories.length} inserted`)

  // ── Towns ────────────────────────────────────────────────────────────────────

  const townData = [
    { slug: 'guildford',  name: 'Guildford',  description: 'Surrey\'s county town, known for its cobbled High Street, castle ruins, and thriving food scene.' },
    { slug: 'woking',     name: 'Woking',      description: 'A busy commuter town with a strong restaurant scene and easy access to the Surrey countryside.' },
    { slug: 'farnham',    name: 'Farnham',     description: 'A handsome Georgian market town with independent shops, cafés and the beautiful Surrey Hills nearby.' },
    { slug: 'reigate',    name: 'Reigate',     description: 'A charming market town on the edge of the North Downs with a relaxed, village-town feel.' },
    { slug: 'epsom',      name: 'Epsom',       description: 'Home to the famous racecourse and a thriving town centre with a good range of restaurants and cafés.' },
    { slug: 'dorking',    name: 'Dorking',     description: 'A picturesque market town surrounded by the Surrey Hills, with independent eateries and antique shops.' },
    { slug: 'weybridge',  name: 'Weybridge',   description: 'An affluent Thames-side town with a strong restaurant scene and good access to the wider county.' },
    { slug: 'cobham',     name: 'Cobham',      description: 'A village turned upmarket town, known for its riverside setting and quality dining options.' },
  ]

  const insertedTowns = await db
    .insert(towns)
    .values(townData.map((t) => ({
      name:        t.name,
      slug:        t.slug,
      description: t.description,
      county:      'Surrey',
    })))
    .onConflictDoNothing()
    .returning({ id: towns.id })

  console.log(`  Towns: ${insertedTowns.length} inserted`)

  // ── Tags ─────────────────────────────────────────────────────────────────────

  const tagData = [
    { slug: 'family-friendly',    name: 'Family Friendly'   },
    { slug: 'dog-friendly',       name: 'Dog Friendly'      },
    { slug: 'date-night',         name: 'Date Night'        },
    { slug: 'good-for-groups',    name: 'Good for Groups'   },
    { slug: 'romantic',           name: 'Romantic'          },
    { slug: 'vegan-friendly',     name: 'Vegan Friendly'    },
    { slug: 'vegetarian-friendly',name: 'Vegetarian Friendly'},
    { slug: 'gluten-free',        name: 'Gluten Free Options'},
    { slug: 'wheelchair-accessible', name: 'Wheelchair Accessible'},
    { slug: 'free-entry',         name: 'Free Entry'        },
    { slug: 'booking-required',   name: 'Booking Required'  },
    { slug: 'parking-available',  name: 'Parking Available' },
    { slug: 'public-transport',   name: 'Public Transport'  },
    { slug: 'indoor',             name: 'Indoor'            },
    { slug: 'outdoor',            name: 'Outdoor'           },
    { slug: 'budget-friendly',    name: 'Budget Friendly'   },
    { slug: 'special-occasion',   name: 'Special Occasion'  },
  ]

  const insertedTags = await db
    .insert(tags)
    .values(tagData)
    .onConflictDoNothing()
    .returning({ id: tags.id })

  console.log(`  Tags: ${insertedTags.length} inserted`)

  console.log('Taxonomy seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
