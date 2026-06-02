import { NextRequest, NextResponse } from 'next/server'
import {
  adminCookieOptions,
  adminSessionCookie,
  adminSessionToken,
  adminToolsConfigured,
  validAdminPassword,
} from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value || '/admin')
  return next.startsWith('/admin') ? next : '/admin'
}

export async function POST(request: NextRequest) {
  if (!adminToolsConfigured()) return NextResponse.redirect(new URL('/', request.url))

  const formData = await request.formData()
  const next = safeNext(formData.get('next'))
  const password = String(formData.get('password') || '')

  if (!validAdminPassword(password)) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('error', '1')
    url.searchParams.set('next', next)
    return NextResponse.redirect(url)
  }

  const response = NextResponse.redirect(new URL(next, request.url))
  response.cookies.set(adminSessionCookie, adminSessionToken(), adminCookieOptions())
  response.cookies.set('best_surrey_admin_ui', '1', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })
  return response
}
