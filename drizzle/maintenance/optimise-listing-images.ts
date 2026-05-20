import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import postgres from 'postgres'
import sharp from 'sharp'
import type { ListingImage } from '../../src/types/db-shapes'

type ListingRow = {
  id: string
  slug: string
  images: ListingImage[] | null
}

type ManifestRow = {
  runId: string
  mode: 'dry-run' | 'apply'
  listingSlug: string
  imageIndex: number
  status: string
  oldUrl: string
  newUrl: string
  oldStoragePath: string
  newStoragePath: string
  oldBytes: number
  newBytes: number
  oldWidth: number | null
  oldHeight: number | null
  newWidth: number | null
  newHeight: number | null
  error: string
}

const args = process.argv.slice(2)
const hasFlag = (flag: string) => args.includes(flag)
const getArg = (name: string, fallback?: string) => {
  const inline = args.find((arg) => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1] ?? fallback
}

const apply = hasFlag('--apply')
const dryRun = !apply
const limit = Number(getArg('--limit', '25'))
const offset = Number(getArg('--offset', '0'))
const quality = Number(getArg('--quality', '82'))
const maxWidth = Number(getArg('--max-width', '1600'))
const minSavingRatio = Number(getArg('--min-saving-ratio', '0.08'))
const skipUnderBytes = Number(getArg('--skip-under-bytes', '350000'))
const bucket = getArg('--bucket', 'listing-images')!
const manifestPath = getArg('--manifest', `outputs/image-optimisation/${new Date().toISOString().replace(/[:.]/g, '-')}-${dryRun ? 'dry-run' : 'apply'}.jsonl`)!
const runId = createHash('sha1').update(`${Date.now()}-${Math.random()}`).digest('hex').slice(0, 10)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl || !supabaseUrl || !serviceRoleKey) {
  console.error('DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(1)
}

if (!Number.isFinite(limit) || limit < 1) throw new Error('--limit must be a positive number.')
if (!Number.isFinite(offset) || offset < 0) throw new Error('--offset must be zero or a positive number.')
if (!Number.isFinite(maxWidth) || maxWidth < 400) throw new Error('--max-width must be at least 400.')
if (!Number.isFinite(quality) || quality < 40 || quality > 95) throw new Error('--quality must be between 40 and 95.')

const sql = postgres(databaseUrl, { prepare: false })
const supabase = createClient(supabaseUrl, serviceRoleKey)
const supabaseHost = new URL(supabaseUrl).hostname

function normalizeImages(value: unknown): ListingImage[] {
  if (Array.isArray(value)) return value as ListingImage[]
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function extractStoragePath(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== supabaseHost && !parsed.hostname.endsWith('.supabase.co')) return null
    const prefix = `/storage/v1/object/public/${bucket}/`
    if (!parsed.pathname.startsWith(prefix)) return null
    return decodeURIComponent(parsed.pathname.slice(prefix.length))
  } catch {
    return null
  }
}

function optimisedStoragePath(oldPath: string, content: Buffer) {
  const slashIndex = oldPath.lastIndexOf('/')
  const dir = slashIndex === -1 ? '' : oldPath.slice(0, slashIndex)
  const filename = slashIndex === -1 ? oldPath : oldPath.slice(slashIndex + 1)
  const base = filename.replace(/\.[a-z0-9]+$/i, '')
  const hash = createHash('sha1').update(content).digest('hex').slice(0, 8)
  const nextName = `${base}-opt-${maxWidth}w-q${quality}-${hash}.webp`
  return dir ? `${dir}/${nextName}` : nextName
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.5',
      'user-agent': 'BestSurrey image optimiser',
    },
  })
  if (!response.ok) throw new Error(`download ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  return {
    bytes: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') ?? '',
  }
}

async function optimise(input: Buffer) {
  const source = sharp(input, { failOn: 'none' }).rotate()
  const oldMetadata = await source.metadata()
  const output = await source
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer()
  const newMetadata = await sharp(output).metadata()
  return { output, oldMetadata, newMetadata }
}

function manifestLine(row: ManifestRow) {
  return `${JSON.stringify(row)}\n`
}

async function main() {
  mkdirSync(dirname(manifestPath), { recursive: true })

  const rows = await sql<ListingRow[]>`
    select id, slug, images
    from listings
    where images is not null
      and jsonb_typeof(images) = 'array'
      and jsonb_array_length(images) > 0
    order by slug
    limit ${limit}
    offset ${offset}
  `

  const manifestRows: ManifestRow[] = []
  let listingsUpdated = 0

  for (const row of rows) {
    const images = normalizeImages(row.images)
    let changed = false
    const nextImages = [...images]

    for (const [imageIndex, image] of images.entries()) {
      const oldUrl = image.url
      const oldStoragePath = extractStoragePath(oldUrl)
      const baseManifest = {
        runId,
        mode: dryRun ? 'dry-run' as const : 'apply' as const,
        listingSlug: row.slug,
        imageIndex,
        oldUrl,
        newUrl: '',
        oldStoragePath: oldStoragePath ?? '',
        newStoragePath: '',
        oldBytes: 0,
        newBytes: 0,
        oldWidth: null,
        oldHeight: null,
        newWidth: null,
        newHeight: null,
        error: '',
      }

      if (!oldStoragePath) {
        manifestRows.push({ ...baseManifest, status: 'skipped_not_supabase_storage' })
        continue
      }

      try {
        const downloaded = await downloadImage(oldUrl)
        const oldBytes = downloaded.bytes.length
        const { output, oldMetadata, newMetadata } = await optimise(downloaded.bytes)
        const newBytes = output.length
        const oldWidth = oldMetadata.width ?? null
        const oldHeight = oldMetadata.height ?? null
        const newWidth = newMetadata.width ?? null
        const newHeight = newMetadata.height ?? null
        const alreadySmallWebp = oldBytes <= skipUnderBytes && downloaded.contentType.includes('webp') && (oldWidth ?? 0) <= maxWidth
        const savingRatio = oldBytes > 0 ? (oldBytes - newBytes) / oldBytes : 0

        if (alreadySmallWebp) {
          manifestRows.push({
            ...baseManifest,
            status: 'skipped_already_small_webp',
            oldBytes,
            newBytes,
            oldWidth,
            oldHeight,
            newWidth,
            newHeight,
          })
          continue
        }

        if (newBytes >= oldBytes || savingRatio < minSavingRatio) {
          manifestRows.push({
            ...baseManifest,
            status: 'skipped_not_enough_saving',
            oldBytes,
            newBytes,
            oldWidth,
            oldHeight,
            newWidth,
            newHeight,
          })
          continue
        }

        const newStoragePath = optimisedStoragePath(oldStoragePath, output)
        const { data } = supabase.storage.from(bucket).getPublicUrl(newStoragePath)

        if (dryRun) {
          manifestRows.push({
            ...baseManifest,
            status: 'would_optimise',
            newUrl: data.publicUrl,
            newStoragePath,
            oldBytes,
            newBytes,
            oldWidth,
            oldHeight,
            newWidth,
            newHeight,
          })
          continue
        }

        const { error: uploadError } = await supabase.storage.from(bucket).upload(newStoragePath, output, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        })
        if (uploadError) throw new Error(`upload: ${uploadError.message}`)

        nextImages[imageIndex] = {
          ...image,
          url: data.publicUrl,
          byteSize: newBytes,
          contentType: 'image/webp',
        }
        changed = true

        manifestRows.push({
          ...baseManifest,
          status: 'optimised',
          newUrl: data.publicUrl,
          newStoragePath,
          oldBytes,
          newBytes,
          oldWidth,
          oldHeight,
          newWidth,
          newHeight,
        })
      } catch (error) {
        manifestRows.push({
          ...baseManifest,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (apply && changed) {
      await sql`
        update listings
        set images = ${sql.json(JSON.parse(JSON.stringify(nextImages)))},
            updated_at = now()
        where id = ${row.id}
      `
      listingsUpdated += 1
    }
  }

  writeFileSync(manifestPath, manifestRows.map(manifestLine).join(''))

  const counts = manifestRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})
  const totalOldBytes = manifestRows.reduce((sum, row) => sum + row.oldBytes, 0)
  const totalNewBytes = manifestRows.reduce((sum, row) => sum + row.newBytes, 0)

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'apply',
    runId,
    limit,
    offset,
    quality,
    maxWidth,
    skipUnderBytes,
    minSavingRatio,
    manifestPath,
    listingsScanned: rows.length,
    listingsUpdated,
    counts,
    totalOldMB: Number((totalOldBytes / 1024 / 1024).toFixed(2)),
    totalNewMB: Number((totalNewBytes / 1024 / 1024).toFixed(2)),
    estimatedSavingMB: Number(((totalOldBytes - totalNewBytes) / 1024 / 1024).toFixed(2)),
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
