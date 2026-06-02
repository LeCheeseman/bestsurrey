import { NextRequest, NextResponse } from 'next/server'
import { adminSessionCookie } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set(adminSessionCookie, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  response.cookies.set('best_surrey_admin_ui', '', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
