import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminToolsConfigured, adminUnauthorizedResponse, isAdminRequest } from '@/lib/admin-auth'

export function adminToolsEnabled() {
  return adminToolsConfigured()
}

export function adminToolsDisabledResponse() {
  return NextResponse.json({ error: 'Admin tools are disabled.' }, { status: 404 })
}

export function requireAdminRequest(request: NextRequest) {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()
  if (!isAdminRequest(request)) return adminUnauthorizedResponse()
  return null
}

export function normalizeSlug(value: string) {
  return value.trim().toLowerCase()
}
