import { NextRequest, NextResponse } from 'next/server'
import { CANONICAL_HOST, canonicalPath } from '@/lib/site'

const adminCookieName = 'best_surrey_admin'
const bestSurreyHosts = new Set(['bestsurrey.co.uk', CANONICAL_HOST])

const legacyRedirects = new Map<string, string>([
  ['/indoor-activities', '/kids-family'],
  ['/activity-venues', '/kids-family'],
  ['/kids-activities', '/kids-family'],
  ['/surrey/indoor-activities', '/kids-family'],
  ['/surrey/activity-venues', '/kids-family'],
  ['/surrey/kids-activities', '/kids-family'],
  ['/surrey/brunch', '/cafes-brunch'],
  ['/surrey/tea-rooms', '/cafes-brunch'],
  ['/surrey/sports-bars', '/pubs-bars'],
  ['/surrey/arts-crafts', '/kids-family'],
  ['/surrey/theme-parks', '/kids-family'],
  ['/surrey/holiday-activities', '/kids-family'],
  ['/surrey/go-karting', '/kids-family'],
  ['/surrey/cycling', '/things-to-do'],
  ['/surrey/axe-throwing', '/things-to-do'],
  ['/surrey/virtual-reality', '/things-to-do'],
  ['/surrey/laser-tag', '/kids-family'],
  ['/surrey/swimming', '/kids-family'],
])

function requestHost(request: NextRequest) {
  const host = request.headers.get('host') ?? request.nextUrl.hostname
  return host.split(':')[0]?.toLowerCase() ?? ''
}

function requestProtocol(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
    || request.nextUrl.protocol.replace(':', '').toLowerCase()
  )
}

function legacyRedirectPath(pathname: string) {
  const directMatch = legacyRedirects.get(pathname)
  if (directMatch) return directMatch

  const [, town, route] = pathname.match(/^\/([^/]+)\/(indoor-activities|activity-venues|kids-activities)$/) ?? []
  if (town && route) return `/${town}/kids-family`

  return null
}

function canonicalRedirect(request: NextRequest) {
  const host = requestHost(request)
  const isBestSurreyHost = bestSurreyHosts.has(host)
  const protocol = requestProtocol(request)
  const normalizedPath = canonicalPath(request.nextUrl.pathname)
  const finalPath = legacyRedirectPath(normalizedPath) ?? normalizedPath

  const target = new URL(request.url)
  if (isBestSurreyHost) {
    target.protocol = 'https:'
    target.hostname = CANONICAL_HOST
    target.port = ''
  }
  target.pathname = finalPath

  const needsRedirect =
    request.nextUrl.pathname !== finalPath
    || (isBestSurreyHost && host !== CANONICAL_HOST)
    || (isBestSurreyHost && protocol !== 'https')

  return needsRedirect ? NextResponse.redirect(target, 301) : null
}

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')
}

function adminToolsAvailable() {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ENABLE_ADMIN_TOOLS === 'true' && Boolean(process.env.ADMIN_PASSWORD)
}

function adminCookieToken() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || ''
  return btoa(`${username}:${password}`)
}

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'www-authenticate': 'Basic realm="Best Surrey Admin"',
    },
  })
}

function adminCookieAuthenticated(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true
  return request.cookies.get(adminCookieName)?.value === adminCookieToken()
}

function adminBasicAuthenticated(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true

  const password = process.env.ADMIN_PASSWORD
  if (!password) return false

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) return false

  const encoded = authHeader.slice('Basic '.length)
  const decoded = atob(encoded)
  const separator = decoded.indexOf(':')
  const username = separator >= 0 ? decoded.slice(0, separator) : ''
  const providedPassword = separator >= 0 ? decoded.slice(separator + 1) : ''
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin'

  return username === expectedUsername && providedPassword === password
}

export function middleware(request: NextRequest) {
  const redirect = canonicalRedirect(request)
  if (redirect) return redirect

  if (!isAdminPath(request.nextUrl.pathname)) return NextResponse.next()

  if (!adminToolsAvailable()) return new NextResponse('Not found', { status: 404 })
  if (adminCookieAuthenticated(request)) return NextResponse.next()
  if (!adminBasicAuthenticated(request)) return unauthorized()

  const response = NextResponse.next()
  response.cookies.set(adminCookieName, adminCookieToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-icon.png|icon.png|images/).*)'],
}
