import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import postgres from 'postgres'

type ManifestRow = {
  listing_slug: string
  name: string
  local_file: string
  storage_path: string
  alt: string
  caption: string
  source_page_url: string
  source_image_url: string
  source_type: string
}

const args = process.argv.slice(2)
const getArg = (flag: string) => {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

const manifestPath = getArg('--manifest') ?? 'outputs/image-enrichment/image-upload-manifest.csv'
const bucket = getArg('--bucket') ?? 'listing-images'
const reportPath = getArg('--report') ?? 'outputs/image-enrichment/image-upload-report.csv'
const dryRun = args.includes('--dry-run')
const limit = getArg('--limit') ? Number(getArg('--limit')) : undefined
const updateDatabase = !args.includes('--upload-only')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL must be set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)
const sql = postgres(databaseUrl, { prepare: false })

function imageJson(row: ManifestRow, publicUrl: string) {
  return [
    {
      url: publicUrl,
      alt: row.alt || `${row.name}`,
      caption: row.caption || row.name,
      isPrimary: true,
      sourceUrl: row.source_page_url || row.source_image_url || '',
      sourceType: row.source_type || 'official_site',
    },
  ]
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Could not list buckets: ${error.message}`)

  const existing = buckets.find((item) => item.name === bucket)
  if (!existing) {
    if (dryRun) return 'would_create'
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/webp'],
    })
    if (createError) throw new Error(`Could not create bucket "${bucket}": ${createError.message}`)
    return 'created'
  }

  if (!existing.public) {
    if (dryRun) return 'would_make_public'
    const { error: updateError } = await supabase.storage.updateBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/webp'],
    })
    if (updateError) throw new Error(`Could not make bucket "${bucket}" public: ${updateError.message}`)
    return 'made_public'
  }

  return 'exists_public'
}

async function main() {
  const rows = parse(readFileSync(manifestPath), {
    columns: true,
    skip_empty_lines: true,
  }) as ManifestRow[]
  const selected = limit ? rows.slice(0, limit) : rows

  const slugs = selected.map((row) => row.listing_slug)
  const existing = await sql`
    select slug,
      images is not null
        and jsonb_typeof(images) = 'array'
        and jsonb_array_length(images) > 0 as has_images
    from listings
    where slug = any(${slugs})
  `
  const found = new Map(existing.map((row) => [row.slug, row]))
  const missing = selected.filter((row) => !found.has(row.listing_slug))
  if (missing.length > 0) {
    throw new Error(`Manifest contains ${missing.length} slugs not found in DB: ${missing.slice(0, 10).map((row) => row.listing_slug).join(', ')}`)
  }

  const bucketStatus = await ensureBucket()
  const report: Array<Record<string, string>> = []

  for (const row of selected) {
    const dbRow = found.get(row.listing_slug)
    if (dbRow?.has_images) {
      report.push({ listing_slug: row.listing_slug, status: 'skipped_existing_db_image', storage_path: row.storage_path, public_url: '', error: '' })
      continue
    }

    const buffer = readFileSync(row.local_file)
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(row.storage_path)
    const publicUrl = publicData.publicUrl

    if (dryRun) {
      report.push({ listing_slug: row.listing_slug, status: 'dry_run_ok', storage_path: row.storage_path, public_url: publicUrl, error: '' })
      continue
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(row.storage_path, buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      })

    if (uploadError) {
      report.push({ listing_slug: row.listing_slug, status: 'upload_error', storage_path: row.storage_path, public_url: publicUrl, error: uploadError.message })
      continue
    }

    if (updateDatabase) {
      await sql`
        update listings
        set images = ${sql.json(imageJson(row, publicUrl))},
            updated_at = now()
        where slug = ${row.listing_slug}
      `
    }

    report.push({ listing_slug: row.listing_slug, status: updateDatabase ? 'uploaded_and_updated' : 'uploaded', storage_path: row.storage_path, public_url: publicUrl, error: '' })
  }

  const headers = ['listing_slug', 'status', 'storage_path', 'public_url', 'error']
  writeFileSync(
    reportPath,
    [
      headers.join(','),
      ...report.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')),
    ].join('\n'),
  )

  const counts = report.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  console.log(JSON.stringify({
    dryRun,
    manifestPath,
    bucket,
    bucketStatus,
    selected: selected.length,
    reportPath,
    counts,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sql.end()
  })

