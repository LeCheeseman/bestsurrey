import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL must be set')

const applySafe = process.argv.includes('--apply-safe')
const outputPath =
  process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length) ??
  'outputs/listing-qa/data-quality-cleanup-audit.csv'

const sql = postgres(databaseUrl, { max: 1 })

type ListingRow = {
  id: string
  slug: string
  name: string
  status: string
  town_id: string
  town: string
  category: string
  website_url: string | null
  phone_number: string | null
  address_line1: string | null
  address_line2: string | null
  postcode: string | null
  latitude: string | null
  longitude: string | null
  short_summary: string | null
  long_description: string | null
  images: unknown
  faq: unknown
  family_friendly: boolean | null
  dog_friendly: boolean | null
  vegan_friendly: boolean | null
  vegetarian_friendly: boolean | null
  wheelchair_accessible: boolean | null
  indoor: boolean | null
  outdoor: boolean | null
  good_for_groups: boolean | null
  booking_required: boolean | null
  parking: string | null
  price_band: string | null
  editorial_notes: string | null
}

type Action = {
  action: 'safe_merge_exact_duplicate' | 'safe_remove_known_bad' | 'safe_fix_image_string' | 'review_duplicate_name_town' | 'review_shared_website'
  confidence: 'safe' | 'review'
  canonical_slug?: string
  source_slug?: string
  slug?: string
  group_key?: string
  reason: string
  applied: boolean
}

function csvCell(value: unknown) {
  return JSON.stringify(value ?? '')
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizeWebsite(value: string | null) {
  if (!value?.trim()) return ''
  try {
    const url = new URL(value.trim())
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return value.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFor(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function betterText(target: string | null, source: string | null) {
  if (!target?.trim()) return source
  if (!source?.trim()) return target
  return source.length > target.length ? source : target
}

function scoreCanonical(row: ListingRow) {
  return [
    row.status === 'published' ? 1000 : 0,
    Array.isArray(row.images) && row.images.length > 0 ? 100 : 0,
    Array.isArray(row.faq) && row.faq.length > 0 ? 50 : 0,
    row.website_url ? 30 : 0,
    row.phone_number ? 20 : 0,
    row.postcode ? 10 : 0,
    row.long_description?.length ?? 0,
  ].reduce((sum, value) => sum + value, 0)
}

function canonicalFor(rows: ListingRow[]) {
  return [...rows].sort((a, b) => scoreCanonical(b) - scoreCanonical(a) || a.slug.localeCompare(b.slug))[0]
}

async function listingSubcategoryIds(listingId: string) {
  const rows = await sql<{ subcategory_id: string }[]>`
    select subcategory_id
    from listing_subcategories
    where listing_id = ${listingId}
  `
  return rows.map((row) => row.subcategory_id)
}

async function mergeListingIntoTarget(target: ListingRow, source: ListingRow) {
  const [currentTarget] = await sql<ListingRow[]>`
    select
      l.id,
      l.slug,
      l.name,
      l.status,
      l.town_id,
      t.name as town,
      c.name as category,
      l.website_url,
      l.phone_number,
      l.address_line1,
      l.address_line2,
      l.postcode,
      l.latitude,
      l.longitude,
      l.short_summary,
      l.long_description,
      l.images,
      l.faq,
      l.family_friendly,
      l.dog_friendly,
      l.vegan_friendly,
      l.vegetarian_friendly,
      l.wheelchair_accessible,
      l.indoor,
      l.outdoor,
      l.good_for_groups,
      l.booking_required,
      l.parking,
      l.price_band,
      l.editorial_notes
    from listings l
    join towns t on t.id = l.town_id
    join categories c on c.id = l.primary_category_id
    where l.id = ${target.id}
    limit 1
  `
  if (currentTarget) target = currentTarget

  const targetSubcategories = await listingSubcategoryIds(target.id)
  const sourceSubcategories = await listingSubcategoryIds(source.id)
  const mergedSubcategoryIds = [...new Set([...targetSubcategories, ...sourceSubcategories])]
  const mergedImages = uniqueBy([...asArray<Record<string, unknown>>(target.images), ...asArray<Record<string, unknown>>(source.images)], (image) =>
    String(image.url ?? ''),
  ).filter((image) => image.url)
  const mergedFaq = uniqueBy([...asArray<Record<string, unknown>>(target.faq), ...asArray<Record<string, unknown>>(source.faq)], (faq) =>
    `${faq.question ?? ''}:${faq.answer ?? ''}`,
  ).filter((faq) => faq.question || faq.answer)
  const today = new Date().toISOString().slice(0, 10)
  const targetNotes = [
    target.editorial_notes?.trim(),
    `Auto-merged duplicate "${source.name}" (${source.slug}) into this listing on ${today}.`,
  ]
    .filter(Boolean)
    .join('\n\n')
  const sourceNotes = [source.editorial_notes?.trim(), `Auto-merged into ${target.slug} on ${today}.`]
    .filter(Boolean)
    .join('\n\n')

  await sql.begin(async (tx) => {
    await tx`delete from listing_subcategories where listing_id = ${target.id}`
    if (mergedSubcategoryIds.length > 0) {
      await tx`
        insert into listing_subcategories ${tx(mergedSubcategoryIds.map((subcategoryId) => ({
          listing_id: target.id,
          subcategory_id: subcategoryId,
        })))}
        on conflict do nothing
      `
    }

    await tx`
      update listings
      set
        website_url = ${target.website_url || source.website_url || null},
        phone_number = ${target.phone_number || source.phone_number || null},
        address_line1 = ${target.address_line1 || source.address_line1 || null},
        address_line2 = ${target.address_line2 || source.address_line2 || null},
        postcode = ${target.postcode || source.postcode || null},
        latitude = ${target.latitude || source.latitude || null},
        longitude = ${target.longitude || source.longitude || null},
        short_summary = ${betterText(target.short_summary, source.short_summary)},
        long_description = ${betterText(target.long_description, source.long_description)},
        images = ${mergedImages.length > 0 ? sql.json(mergedImages as never) : null},
        faq = ${mergedFaq.length > 0 ? sql.json(mergedFaq as never) : null},
        family_friendly = ${target.family_friendly ?? source.family_friendly},
        dog_friendly = ${target.dog_friendly ?? source.dog_friendly},
        vegan_friendly = ${target.vegan_friendly ?? source.vegan_friendly},
        vegetarian_friendly = ${target.vegetarian_friendly ?? source.vegetarian_friendly},
        wheelchair_accessible = ${target.wheelchair_accessible ?? source.wheelchair_accessible},
        indoor = ${target.indoor ?? source.indoor},
        outdoor = ${target.outdoor ?? source.outdoor},
        good_for_groups = ${target.good_for_groups ?? source.good_for_groups},
        booking_required = ${target.booking_required ?? source.booking_required},
        parking = ${target.parking || source.parking || null},
        price_band = ${target.price_band || source.price_band || null},
        editorial_notes = ${targetNotes},
        updated_at = now()
      where id = ${target.id}
    `

    await tx`
      update listings
      set
        status = 'unpublished',
        verified = false,
        editorial_notes = ${sourceNotes},
        updated_at = now()
      where id = ${source.id}
    `
    await tx`delete from listing_subcategories where listing_id = ${source.id}`
  })
}

async function main() {
  const rows = await sql<ListingRow[]>`
    select
      l.id,
      l.slug,
      l.name,
      l.status,
      l.town_id,
      t.name as town,
      c.name as category,
      l.website_url,
      l.phone_number,
      l.address_line1,
      l.address_line2,
      l.postcode,
      l.latitude,
      l.longitude,
      l.short_summary,
      l.long_description,
      l.images,
      l.faq,
      l.family_friendly,
      l.dog_friendly,
      l.vegan_friendly,
      l.vegetarian_friendly,
      l.wheelchair_accessible,
      l.indoor,
      l.outdoor,
      l.good_for_groups,
      l.booking_required,
      l.parking,
      l.price_band,
      l.editorial_notes
    from listings l
    join towns t on t.id = l.town_id
    join categories c on c.id = l.primary_category_id
    where l.status = 'published'
    order by t.name, l.name, l.slug
  `

  const actions: Action[] = []
  const exactDuplicateGroups = new Map<string, ListingRow[]>()
  const duplicateNameTownGroups = new Map<string, ListingRow[]>()
  const sharedWebsiteGroups = new Map<string, ListingRow[]>()

  for (const row of rows) {
    const nameTownKey = `${row.town_id}:${normalizeName(row.name)}`
    duplicateNameTownGroups.set(nameTownKey, [...(duplicateNameTownGroups.get(nameTownKey) ?? []), row])

    const websiteKey = normalizeWebsite(row.website_url)
    if (websiteKey) {
      exactDuplicateGroups.set(`${nameTownKey}:${websiteKey}`, [...(exactDuplicateGroups.get(`${nameTownKey}:${websiteKey}`) ?? []), row])
      sharedWebsiteGroups.set(websiteKey, [...(sharedWebsiteGroups.get(websiteKey) ?? []), row])
    }

    if (row.name === 'Camberley Public House' && row.website_url?.includes('collectivelycamberley.co.uk/business/camberley-public-house')) {
      actions.push({
        action: 'safe_remove_known_bad',
        confidence: 'safe',
        slug: row.slug,
        reason: 'Known non-existent placeholder listing from Collectively Camberley.',
        applied: false,
      })
    }
  }

  for (const [key, group] of exactDuplicateGroups) {
    if (group.length < 2) continue
    const canonical = canonicalFor(group)
    for (const source of group.filter((row) => row.id !== canonical.id)) {
      actions.push({
        action: 'safe_merge_exact_duplicate',
        confidence: 'safe',
        canonical_slug: canonical.slug,
        source_slug: source.slug,
        group_key: key,
        reason: `Exact duplicate: same normalized name, same town, same website. Canonical is ${canonical.slug}.`,
        applied: false,
      })
    }
  }

  for (const [key, group] of duplicateNameTownGroups) {
    if (group.length < 2) continue
    const websites = new Set(group.map((row) => normalizeWebsite(row.website_url)).filter(Boolean))
    if (websites.size <= 1) continue
    const canonical = canonicalFor(group)
    actions.push({
      action: 'review_duplicate_name_town',
      confidence: 'review',
      canonical_slug: canonical.slug,
      source_slug: group.filter((row) => row.id !== canonical.id).map((row) => row.slug).join('|'),
      group_key: key,
      reason: `Same normalized name and town, but website data differs or is missing: ${group.map((row) => row.slug).join(', ')}.`,
      applied: false,
    })
  }

  for (const [key, group] of sharedWebsiteGroups) {
    const names = new Set(group.map((row) => normalizeName(row.name)))
    if (group.length < 2 || names.size <= 1) continue
    actions.push({
      action: 'review_shared_website',
      confidence: 'review',
      canonical_slug: canonicalFor(group).slug,
      source_slug: group.map((row) => row.slug).join('|'),
      group_key: key,
      reason: `Multiple different listing names share this website: ${group.map((row) => `${row.name} (${row.slug})`).join(', ')}.`,
      applied: false,
    })
  }

  const imageStringRows = await sql<{ slug: string; name: string; town: string; image_url: string }[]>`
    select l.slug, l.name, t.name as town, l.images #>> '{}' as image_url
    from listings l
    join towns t on t.id = l.town_id
    where l.status = 'published'
      and jsonb_typeof(l.images) = 'string'
      and l.images #>> '{}' ~ '^https?://'
  `
  for (const row of imageStringRows) {
    actions.push({
      action: 'safe_fix_image_string',
      confidence: 'safe',
      slug: row.slug,
      reason: 'Images field is a JSON string URL; convert it to the normal image-array structure.',
      applied: false,
    })
  }

  if (applySafe) {
    const bySlug = new Map(rows.map((row) => [row.slug, row]))
    for (const action of actions) {
      if (action.confidence !== 'safe') continue

      if (action.action === 'safe_remove_known_bad' && action.slug) {
        await sql`
          update listings
          set status = 'unpublished',
              verified = false,
              editorial_notes = concat_ws(E'\n\n', nullif(editorial_notes, ''), 'Auto-removed as known bad placeholder listing.'),
              updated_at = now()
          where slug = ${action.slug}
        `
        await sql`delete from listing_subcategories where listing_id = (select id from listings where slug = ${action.slug})`
        action.applied = true
      }

      if (action.action === 'safe_merge_exact_duplicate' && action.canonical_slug && action.source_slug) {
        const target = bySlug.get(action.canonical_slug)
        const source = bySlug.get(action.source_slug)
        if (target && source) {
          await mergeListingIntoTarget(target, source)
          action.applied = true
        }
      }

      if (action.action === 'safe_fix_image_string' && action.slug) {
        const row = imageStringRows.find((item) => item.slug === action.slug)
        if (row) {
          await sql`
            update listings
            set images = ${sql.json([{ url: row.image_url, alt: `${row.name} in ${row.town}`, isPrimary: true }] as never)},
                updated_at = now()
            where slug = ${row.slug}
          `
          action.applied = true
        }
      }
    }
  }

  const headers = ['action', 'confidence', 'applied', 'canonical_slug', 'source_slug', 'slug', 'group_key', 'reason']
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(
    outputPath,
    [
      headers.join(','),
      ...actions.map((action) => headers.map((header) => csvCell(action[header as keyof Action])).join(',')),
    ].join('\n'),
  )

  const summary = actions.reduce<Record<string, number>>((acc, action) => {
    const key = `${action.applied ? 'applied' : 'pending'}:${action.action}`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  console.log(JSON.stringify({ mode: applySafe ? 'apply-safe' : 'audit', outputPath, actions: actions.length, summary }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sql.end()
  })
