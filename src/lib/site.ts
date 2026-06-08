const DEFAULT_SITE_URL = 'https://www.bestsurrey.co.uk'

export function normalizeSiteUrl(value?: string | null): string {
  if (!value) return DEFAULT_SITE_URL

  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'bestsurrey.co.uk') {
      parsed.hostname = 'www.bestsurrey.co.uk'
    }
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
