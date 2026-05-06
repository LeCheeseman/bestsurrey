import { db } from '@/lib/db'
import { listings, categories, towns } from '@/lib/db/schema'
import { and, count, eq, sql } from 'drizzle-orm'

async function main() {
  const [summary] = await db
    .select({
      total: count(listings.id),
      missingImages: sql<number>`count(*) filter (
        where ${listings.images} is null
          or jsonb_typeof(${listings.images}) <> 'array'
          or jsonb_array_length(${listings.images}) = 0
      )`,
      missingFaq: sql<number>`count(*) filter (
        where ${listings.faq} is null
          or jsonb_typeof(${listings.faq}) <> 'array'
          or jsonb_array_length(${listings.faq}) = 0
      )`,
      missingOpeningHours: sql<number>`count(*) filter (where ${listings.openingHours} is null)`,
      missingGeo: sql<number>`count(*) filter (where ${listings.latitude} is null or ${listings.longitude} is null)`,
      placeholderUrls: sql<number>`count(*) filter (
        where coalesce(${listings.websiteUrl}, '') like '%example.com%'
          or coalesce(${listings.images}::text, '') like '%example.com%'
      )`,
    })
    .from(listings)
    .where(eq(listings.status, 'published'))

  console.log('Published listing content audit')
  console.table(summary)

  const weakestPages = await db
    .select({
      town: towns.slug,
      category: categories.slug,
      total: count(listings.id),
      withImages: sql<number>`count(*) filter (
        where ${listings.images} is not null
          and jsonb_typeof(${listings.images}) = 'array'
          and jsonb_array_length(${listings.images}) > 0
      )`,
      withFaq: sql<number>`count(*) filter (
        where ${listings.faq} is not null
          and jsonb_typeof(${listings.faq}) = 'array'
          and jsonb_array_length(${listings.faq}) > 0
      )`,
    })
    .from(listings)
    .innerJoin(towns, eq(listings.townId, towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(and(eq(listings.status, 'published')))
    .groupBy(towns.slug, categories.slug)
    .orderBy(count(listings.id))
    .limit(25)

  console.log('\nLowest-coverage town/category pages')
  console.table(weakestPages)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).then(() => process.exit(0))
