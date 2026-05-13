import { createClient } from '@supabase/supabase-js'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, listings, towns } from '@/lib/db/schema'
import type { ListingImage } from '@/types/db-shapes'

export const listingImageBucket = 'listing-images'

const contentTypeToExt: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export function supportedImageExt(contentType: string) {
  return contentTypeToExt[contentType.toLowerCase()]
}

function storageSafe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function normalizeImages(value: unknown): ListingImage[] {
  if (Array.isArray(value)) return value as ListingImage[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function supabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Image uploads are not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

async function ensurePublicBucket(supabase: ReturnType<typeof supabaseClient>) {
  const bucketOptions = {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: Object.keys(contentTypeToExt),
  }
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Could not list Supabase buckets: ${error.message}`)
  const existing = buckets.find((item) => item.name === listingImageBucket)
  if (!existing) {
    const { error: createError } = await supabase.storage.createBucket(listingImageBucket, bucketOptions)
    if (createError) throw new Error(`Could not create ${listingImageBucket}: ${createError.message}`)
    return
  }
  const { error: updateError } = await supabase.storage.updateBucket(listingImageBucket, bucketOptions)
  if (updateError) throw new Error(`Could not update ${listingImageBucket} settings: ${updateError.message}`)
}

export async function uploadListingImage({
  slug,
  bytes,
  contentType,
  alt,
  caption,
  sourceUrl,
  sourceType,
}: {
  slug: string
  bytes: Buffer
  contentType: string
  alt?: string
  caption?: string
  sourceUrl?: string
  sourceType: string
}) {
  const ext = supportedImageExt(contentType)
  if (!ext) throw new Error(`Unsupported image type: ${contentType || 'unknown'}. Use JPG, PNG, WebP or AVIF.`)
  if (bytes.length < 8_000) throw new Error('Image is too small to use as a listing photo.')
  if (bytes.length > 8 * 1024 * 1024) throw new Error('Image is over 8MB. Choose a smaller image.')

  const [listing] = await db
    .select({
      id: listings.id,
      name: listings.name,
      slug: listings.slug,
      townName: towns.name,
      townSlug: towns.slug,
      categorySlug: categories.slug,
      images: listings.images,
    })
    .from(listings)
    .innerJoin(towns, eq(listings.townId, towns.id))
    .innerJoin(categories, eq(listings.primaryCategoryId, categories.id))
    .where(eq(listings.slug, slug))
    .limit(1)

  if (!listing) throw new Error('Listing not found.')

  const supabase = supabaseClient()
  await ensurePublicBucket(supabase)

  const storagePath = [
    storageSafe(listing.townSlug),
    storageSafe(listing.categorySlug),
    storageSafe(listing.slug),
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
  ].join('/')

  const { error: uploadError } = await supabase.storage.from(listingImageBucket).upload(storagePath, bytes, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  })
  if (uploadError) throw new Error(`Could not upload image: ${uploadError.message}`)

  const { data } = supabase.storage.from(listingImageBucket).getPublicUrl(storagePath)
  const image: ListingImage = {
    url: data.publicUrl,
    alt: alt?.trim() || `${listing.name} in ${listing.townName}`,
    caption: caption?.trim() || `${listing.name}, ${listing.townName}`,
    isPrimary: !Array.isArray(listing.images) || listing.images.length === 0,
    sourceUrl: sourceUrl || '',
    sourceType,
  }
  const existingImages = normalizeImages(listing.images)
  const images = existingImages.length === 0 ? [image] : [...existingImages, image]

  await db
    .update(listings)
    .set({ images: sql`${JSON.stringify(images)}::jsonb`, updatedAt: new Date() })
    .where(eq(listings.id, listing.id))

  return { image, images, storagePath }
}
