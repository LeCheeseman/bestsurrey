import { NextRequest, NextResponse } from 'next/server'
import { get as httpsGet, RequestOptions } from 'node:https'
import { adminToolsDisabledResponse, adminToolsEnabled } from '@/lib/admin-tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Candidate = {
  url: string
  sourcePageUrl: string
  sourceType: 'official_site' | 'manual'
  reason: string
  score: number
}

type CandidateBody = {
  websiteUrl?: string | null
  manualUrl?: string | null
}

const browserHeaders = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'en-GB,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  referer: 'https://www.google.com/',
}

type WebsiteFetchResult = {
  ok: boolean
  status: number
  url: string
  text: () => Promise<string>
}

function attrsFromTag(tag: string) {
  const attrs: Record<string, string> = {}
  const attrRegex = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g
  let match: RegExpExecArray | null
  while ((match = attrRegex.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? match[5] ?? ''
  }
  return attrs
}

function absoluteUrl(base: string, value?: string | null) {
  if (!value) return null
  const cleaned = value.trim()
  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('blob:')) return null
  try {
    return new URL(cleaned, base).toString()
  } catch {
    return null
  }
}

function normalizeImageUrl(url: string) {
  if (url.includes('static.wixstatic.com/media/')) {
    return url
      .replace(/\/v1\/fill\/[^/]+\//, '/v1/fill/w_1400,h_933,al_c,q_85,enc_auto/')
      .replace(/,blur_\d+/g, '')
      .replace(/enc_avif/g, 'enc_auto')
  }
  return url
}

function isTinyTransformedImage(url: string) {
  if (url.includes('static.wixstatic.com/media/')) return false
  const width = url.match(/[?&,/]w[_=](\d+)/i)?.[1]
  const height = url.match(/[?&,/]h[_=](\d+)/i)?.[1]
  return Boolean((width && Number(width) < 450) || (height && Number(height) < 300))
}

function srcsetBest(srcset: string) {
  const candidates = srcset
    .split(',')
    .map((part) => {
      const [url, width] = part.trim().split(/\s+/)
      return { url, width: Number(width?.replace(/[^\d.]/g, '') || 0) }
    })
    .filter((item) => item.url)
  candidates.sort((a, b) => b.width - a.width)
  return candidates[0]?.url
}

function scoreImage(url: string, attrs: Record<string, string>) {
  const haystack = [url, attrs.alt, attrs.class, attrs.id, attrs.title].filter(Boolean).join(' ').toLowerCase()
  if (isBlockedAsset(haystack)) return -100
  let score = 40
  if (haystack.includes('hero')) score += 22
  if (haystack.includes('gallery')) score += 18
  if (haystack.includes('restaurant') || haystack.includes('food') || haystack.includes('venue')) score += 10
  if (haystack.includes('logo')) score -= 35
  if (haystack.includes('icon') || haystack.includes('sprite') || haystack.includes('avatar')) score -= 25
  if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(url)) score += 8
  return score
}

function isBlockedAsset(haystack: string) {
  return [
    'logo',
    'icon',
    'sprite',
    'avatar',
    'facebook',
    'instagram',
    'youtube',
    'twitter',
    'linkedin',
    'tripadvisor',
    'placeholder',
    'loading',
    'spinner',
    'favicon',
    'siteground',
    'cloudsbackground',
    'monitorwithgears',
    '.svg',
  ].some((word) => haystack.includes(word))
}

function extractCandidates(html: string, pageUrl: string) {
  const candidates: Candidate[] = []
  const tags = html.match(/<(meta|link|img)\b[^>]*>/gi) ?? []

  for (const tag of tags) {
    const attrs = attrsFromTag(tag)
    const tagName = tag.match(/^<(\w+)/)?.[1]?.toLowerCase()
    const property = (attrs.property || attrs.name || '').toLowerCase()
    const rel = (attrs.rel || '').toLowerCase()

    if (tagName === 'meta' && ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(property)) {
      const url = absoluteUrl(pageUrl, attrs.content)
      if (url && !isTinyTransformedImage(url)) candidates.push({ url: normalizeImageUrl(url), sourcePageUrl: pageUrl, sourceType: 'official_site', reason: property, score: 95 })
    }

    if (tagName === 'link' && rel.includes('image_src')) {
      const url = absoluteUrl(pageUrl, attrs.href)
      if (url && !isTinyTransformedImage(url)) candidates.push({ url: normalizeImageUrl(url), sourcePageUrl: pageUrl, sourceType: 'official_site', reason: 'link:image_src', score: 82 })
    }

    if (tagName === 'img') {
      const raw = attrs.src || attrs['data-src'] || attrs['data-lazy-src'] || attrs['data-original'] || srcsetBest(attrs.srcset || '')
      const url = absoluteUrl(pageUrl, raw)
      if (url) {
        const score = scoreImage(url, attrs)
        if (score > 0 && !isTinyTransformedImage(url)) {
          candidates.push({ url: normalizeImageUrl(url), sourcePageUrl: pageUrl, sourceType: 'official_site', reason: attrs.alt ? `img: ${attrs.alt}` : 'img tag', score })
        }
      }
    }
  }

  const unique = new Map<string, Candidate>()
  for (const candidate of candidates) {
    if (!/^https?:\/\//i.test(candidate.url)) continue
    if (isBlockedAsset([candidate.url, candidate.reason].join(' ').toLowerCase())) continue
    const existing = unique.get(candidate.url)
    if (!existing || candidate.score > existing.score) unique.set(candidate.url, candidate)
  }

  return [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 24)
}

export async function POST(request: NextRequest) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const body = (await request.json()) as CandidateBody
  const manualUrl = body.manualUrl?.trim()
  if (manualUrl) {
    const url = absoluteUrl('https://example.com', manualUrl)
    if (!url) return NextResponse.json({ error: 'That image URL is not valid.' }, { status: 400 })
    return NextResponse.json({
      candidates: [{ url, sourcePageUrl: url, sourceType: 'manual', reason: 'manual URL', score: 100 }],
    })
  }

  const websiteUrl = body.websiteUrl?.trim()
  if (!websiteUrl) return NextResponse.json({ error: 'No website URL provided.' }, { status: 400 })

  let pageUrl: string
  try {
    pageUrl = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).toString()
  } catch {
    return NextResponse.json({ error: 'Website URL is not valid.' }, { status: 400 })
  }

  async function insecureFetchWebsite(url: string): Promise<WebsiteFetchResult> {
    return new Promise((resolve, reject) => {
      const requestUrl = new URL(url)
      const options: RequestOptions = {
        protocol: requestUrl.protocol,
        hostname: requestUrl.hostname,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        port: requestUrl.port || undefined,
        rejectUnauthorized: false,
        timeout: 12000,
        headers: browserHeaders,
      }

      const request = httpsGet(options, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume()
          const nextUrl = new URL(response.headers.location, url).toString()
          insecureFetchWebsite(nextUrl).then(resolve).catch(reject)
          return
        }

        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        response.on('end', () => {
          resolve({
            ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode ?? 0,
            url,
            text: async () => Buffer.concat(chunks).toString('utf8'),
          })
        })
      })

      request.on('timeout', () => {
        request.destroy(new Error('Official site fetch timed out.'))
      })
      request.on('error', reject)
    })
  }

  async function fetchWebsite(url: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: {
          ...browserHeaders,
        },
      })
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    let response: Response
    let insecureCertificateFallback = false
    try {
      response = await fetchWebsite(pageUrl)
    } catch {
      response = (await insecureFetchWebsite(pageUrl)) as Response
      insecureCertificateFallback = true
    }
    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({
          candidates: [],
          warning:
            'The official site is blocking server-side image discovery with HTTP 403. The URL may still be correct. Use Image search, Facebook, Instagram, or paste/upload an image manually for this listing.',
        })
      }
      return NextResponse.json({ error: `Official site returned HTTP ${response.status}.` }, { status: 502 })
    }
    const html = await response.text()
    if (/default server vhost|siteground web hosting|domain name is either not yet pointed/i.test(html)) {
      return NextResponse.json(
        { error: 'The official website is currently returning a hosting/default page, not the real business website. Use manual official social/gallery URLs for this listing.' },
        { status: 502 },
      )
    }
    const candidates = extractCandidates(html, response.url || pageUrl)
    return NextResponse.json({
      candidates,
      warning: insecureCertificateFallback ? 'This site has a broken HTTPS certificate; candidates were fetched with admin-only certificate verification disabled.' : undefined,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not fetch the official site.' }, { status: 502 })
  }
}
