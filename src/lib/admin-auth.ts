import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const adminSessionCookie = 'best_surrey_admin'

export function adminToolsConfigured() {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ENABLE_ADMIN_TOOLS === 'true' && Boolean(process.env.ADMIN_PASSWORD)
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'admin' : '')
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || adminPassword()
}

export function adminSessionToken() {
  return createHash('sha256').update(`best-surrey-admin:${sessionSecret()}`).digest('hex')
}

export function validAdminPassword(value: string) {
  const expected = adminPassword()
  if (!expected) return false
  const actualBuffer = Buffer.from(value)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function isAdminSessionValue(value?: string) {
  if (!value || !adminToolsConfigured()) return false
  const actualBuffer = Buffer.from(value)
  const expectedBuffer = Buffer.from(adminSessionToken())
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function isAdminRequest(request: NextRequest) {
  return isAdminSessionValue(request.cookies.get(adminSessionCookie)?.value)
}

export function isAdminLoggedIn() {
  return isAdminSessionValue(cookies().get(adminSessionCookie)?.value)
}

export function adminUnauthorizedResponse() {
  return NextResponse.json({ error: 'Admin login required.' }, { status: 401 })
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  }
}
