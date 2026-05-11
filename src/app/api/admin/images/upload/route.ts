import { NextRequest, NextResponse } from 'next/server'
import { adminToolsDisabledResponse, adminToolsEnabled, normalizeSlug } from '@/lib/admin-tools'
import { uploadListingImage } from '@/lib/admin-image-upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  try {
    const formData = await request.formData()
    const slug = normalizeSlug(String(formData.get('slug') || ''))
    const file = formData.get('file')
    if (!slug || !(file instanceof File)) {
      return NextResponse.json({ error: 'Listing slug and image file are required.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const result = await uploadListingImage({
      slug,
      bytes,
      contentType: file.type || 'application/octet-stream',
      alt: String(formData.get('alt') || ''),
      caption: String(formData.get('caption') || ''),
      sourceUrl: String(formData.get('sourceUrl') || file.name || ''),
      sourceType: 'manual_upload',
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not upload image file.' }, { status: 500 })
  }
}
