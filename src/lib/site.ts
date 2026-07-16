export const CANONICAL_HOST = 'www.bestsurrey.co.uk'
export const DEFAULT_SITE_URL = `https://${CANONICAL_HOST}`

export function normalizeSiteUrl(value?: string | null): string {
  if (!value) return DEFAULT_SITE_URL

  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'bestsurrey.co.uk') {
      parsed.hostname = CANONICAL_HOST
    }
    parsed.protocol = 'https:'
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)

export function canonicalPath(value: string = '/'): string {
  const source = value.trim() || '/'
  let pathname = source

  try {
    if (/^https?:\/\//i.test(source)) {
      pathname = new URL(source).pathname
    }
  } catch {
    pathname = source
  }

  pathname = pathname.split(/[?#]/)[0] || '/'
  if (!pathname.startsWith('/')) pathname = `/${pathname}`
  pathname = pathname.replace(/\/{2,}/g, '/').toLowerCase()

  if (pathname === '/') return '/'
  return pathname.replace(/\/+$/, '')
}

export function canonicalUrl(path: string = '/'): string {
  const pathname = canonicalPath(path)
  return pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}`
}
