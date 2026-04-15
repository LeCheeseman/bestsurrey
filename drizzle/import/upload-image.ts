/**
 * Image upload helper — uploads a local file or remote URL to Supabase Storage.
 *
 * Usage:
 *   npm run upload:image -- --file /path/to/image.jpg --listing the-ivy-brasserie-guildford
 *   npm run upload:image -- --url https://example.com/photo.jpg --listing the-ivy-brasserie-guildford
 *
 * Options:
 *   --file    <path>   local file to upload
 *   --url     <url>    remote image URL to fetch and upload
 *   --listing <slug>   listing slug (used as folder name in storage)
 *   --primary          mark this image as the primary image (default: true for first image)
 *   --alt     <text>   alt text for the image (default: listing slug)
 *   --bucket  <name>   Supabase Storage bucket name (default: listing-images)
 *
 * The script prints the public URL and the JSON snippet to paste into your CSV's
 * images column (or directly into Supabase Studio).
 *
 * Prerequisites:
 *   - Create a "listing-images" bucket in Supabase Storage (Dashboard → Storage)
 *   - Set bucket to public so Next.js <Image> can serve it without auth
 */

import { createClient }  from '@supabase/supabase-js'
import { readFileSync }  from 'fs'
import { basename, extname } from 'path'

// ─── Parse args ───────────────────────────────────────────────────────────────

const args   = process.argv.slice(2)
const getArg = (flag: string) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined }

const filePath   = getArg('--file')
const remoteUrl  = getArg('--url')
const listingSlug = getArg('--listing')
const altText    = getArg('--alt')    ?? listingSlug ?? 'image'
const bucket     = getArg('--bucket') ?? 'listing-images'
const isPrimary  = !args.includes('--no-primary')

if (!filePath && !remoteUrl) {
  console.error('Provide --file <path> or --url <url>')
  process.exit(1)
}
if (!listingSlug) {
  console.error('Provide --listing <slug>')
  process.exit(1)
}

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let buffer: Buffer
  let filename: string
  let contentType: string

  if (filePath) {
    // Local file
    buffer   = readFileSync(filePath)
    filename = basename(filePath)
    contentType = guessMimeType(filename)
  } else {
    // Remote URL — fetch and upload
    const response = await fetch(remoteUrl!)
    if (!response.ok) {
      console.error(`Failed to fetch ${remoteUrl}: ${response.status} ${response.statusText}`)
      process.exit(1)
    }
    buffer      = Buffer.from(await response.arrayBuffer())
    contentType = response.headers.get('content-type') ?? 'image/jpeg'
    filename    = guessFilename(remoteUrl!, contentType)
  }

  // Path inside the bucket: {listing-slug}/{filename}
  const storagePath = `${listingSlug}/${filename}`

  console.log(`Uploading ${filename} (${(buffer.byteLength / 1024).toFixed(1)} KB) → ${bucket}/${storagePath}`)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,  // overwrite if already exists
    })

  if (error) {
    console.error('Upload failed:', error.message)
    process.exit(1)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath)

  const imageRecord = { url: publicUrl, alt: altText, isPrimary }

  console.log('\nPublic URL:')
  console.log(publicUrl)
  console.log('\nImages JSON (paste into CSV or Supabase Studio):')
  console.log(JSON.stringify([imageRecord]))
  console.log('\nDone.')
}

function guessMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp',
    '.gif': 'image/gif',  '.avif': 'image/avif',
  }
  return map[ext] ?? 'image/jpeg'
}

function guessFilename(url: string, contentType: string): string {
  try {
    const pathname = new URL(url).pathname
    const base = basename(pathname)
    if (base && extname(base)) return base
  } catch { /* ignore */ }

  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png',
    'image/webp': '.webp', 'image/avif': '.avif',
  }
  return `image${extMap[contentType] ?? '.jpg'}`
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
