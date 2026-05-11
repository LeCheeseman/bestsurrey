import { NextRequest, NextResponse } from 'next/server'

const adminCookieName = 'best_surrey_admin'

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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
