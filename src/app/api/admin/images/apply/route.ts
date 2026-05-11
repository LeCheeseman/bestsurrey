import { NextRequest, NextResponse } from 'next/server'
import { adminToolsDisabledResponse, adminToolsEnabled, normalizeSlug } from '@/lib/admin-tools'
import { uploadListingImage } from '@/lib/admin-image-upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ApplyBody = {
  slug: string
  imageUrl: string
  sourcePageUrl?: string
  sourceType?: string
  alt?: string
  caption?: string
}

export async function POST(request: NextRequest) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const body = (await request.json()) as ApplyBody
  const slug = normalizeSlug(body.slug || '')
  if (!slug || !body.imageUrl) return NextResponse.json({ error: 'Listing slug and image URL are required.' }, { status: 400 })

  let sourceUrl: string
  try {
    sourceUrl = new URL(body.imageUrl).toString()
  } catch {
    return NextResponse.json({ error: 'Image URL is not valid.' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'user-agent': 'BestSurrey admin image reviewer (+https://bestsurrey.co.uk)',
        accept: 'image/webp,image/png,image/jpeg,*/*;q=0.6',
      },
    })
    clearTimeout(timer)

    if (!response.ok) return NextResponse.json({ error: `Image fetch returned HTTP ${response.status}.` }, { status: 502 })
    const contentType = (response.headers.get('content-type') || '').split(';')[0].toLowerCase()
    const bytes = Buffer.from(await response.arrayBuffer())
    const result = await uploadListingImage({
      slug,
      bytes,
      contentType,
      alt: body.alt,
      caption: body.caption,
      sourceUrl: body.sourcePageUrl || sourceUrl,
      sourceType: body.sourceType || 'official_site',
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not apply image.' }, { status: 500 })
  }
}
