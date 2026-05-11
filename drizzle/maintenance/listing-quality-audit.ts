import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL must be set')

const outputPath = process.argv[2] ?? 'outputs/listing-qa/listing-quality-audit.csv'
const sql = postgres(databaseUrl, { max: 1 })

type ListingRow = {
  slug: string
  name: string
  town: string
  town_slug: string
  category: string
  category_slug: string
  status: string
  website_url: string | null
  postcode: string | null
  image_type: string | null
  image_count: number
  summary_len: number
  description_len: number
  same_name_town_count: number
  same_website_count: number
}

function csvCell(value: unknown) {
  return JSON.stringify(value ?? '')
}

function actionFor(flags: string[]) {
  if (flags.some((flag) => ['dead_website', 'invalid_image_json'].includes(flag))) return 'review'
  if (flags.includes('duplicate_name_town') && flags.includes('missing_image')) return 'review'
  if (flags.includes('missing_image')) return 'add_image'
  return 'keep'
}

function flagsFor(row: ListingRow) {
  const flags: string[] = []
  const url = row.website_url ?? ''

  if (!url) flags.push('missing_website')
  if (url.includes('collectivelycamberley.co.uk/business/camberley-public-house')) flags.push('dead_website')
  if (row.image_type && row.image_type !== 'array') flags.push('invalid_image_json')
  if (!row.image_type || row.image_count === 0) flags.push('missing_image')
  if (row.summary_len < 80) flags.push('thin_summary')
  if (row.description_len < 250) flags.push('thin_description')
  if (row.same_name_town_count > 1) flags.push('duplicate_name_town')
  if (row.same_website_count > 1 && url) flags.push('shared_website')

  return flags
}

async function main() {
  const rows = await sql<ListingRow[]>`
    with base as (
      select
        l.slug,
        l.name,
        t.name as town,
        t.slug as town_slug,
        c.name as category,
        c.slug as category_slug,
        l.status,
        l.website_url,
        l.postcode,
        jsonb_typeof(l.images) as image_type,
        case when jsonb_typeof(l.images) = 'array' then jsonb_array_length(l.images) else 0 end as image_count,
        length(coalesce(l.short_summary, '')) as summary_len,
        length(coalesce(l.long_description, '')) as description_len,
        count(*) over (partition by lower(regexp_replace(l.name, '[^a-zA-Z0-9]+', '', 'g')), t.id) as same_name_town_count,
        count(*) over (partition by nullif(l.website_url, '')) as same_website_count
      from listings l
      join towns t on t.id = l.town_id
      join categories c on c.id = l.primary_category_id
      where l.status = 'published'
    )
    select * from base
    order by town, category, name
  `

  const headers = [
    'recommended_action',
    'audit_flags',
    'human_decision',
    'notes',
    'slug',
    'name',
    'town',
    'category',
    'website_url',
    'image_type',
    'image_count',
    'same_name_town_count',
    'same_website_count',
  ]

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(
    outputPath,
    [
      headers.join(','),
      ...rows.map((row) => {
        const flags = flagsFor(row)
        const values: Record<string, unknown> = {
          recommended_action: actionFor(flags),
          audit_flags: flags.join('|'),
          human_decision: '',
          notes: '',
          ...row,
        }
        return headers.map((header) => csvCell(values[header])).join(',')
      }),
    ].join('\n'),
  )

  const flagCounts = rows.reduce<Record<string, number>>((acc, row) => {
    for (const flag of flagsFor(row)) acc[flag] = (acc[flag] ?? 0) + 1
    return acc
  }, {})

  console.log(JSON.stringify({ outputPath, rows: rows.length, flagCounts }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sql.end()
  })
