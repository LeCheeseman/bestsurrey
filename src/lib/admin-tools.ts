import { NextResponse } from 'next/server'

export function adminToolsEnabled() {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ENABLE_ADMIN_TOOLS === 'true' && Boolean(process.env.ADMIN_PASSWORD)
}

export function adminToolsDisabledResponse() {
  return NextResponse.json({ error: 'Admin tools are disabled.' }, { status: 404 })
}

export function normalizeSlug(value: string) {
  return value.trim().toLowerCase()
}
