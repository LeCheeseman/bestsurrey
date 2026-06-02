import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { adminToolsEnabled } from '@/lib/admin-tools'
import { isAdminLoggedIn } from '@/lib/admin-auth'
import AdminListingQaClient from './AdminListingQaClient'

export const metadata = {
  title: 'Listing QA | Best Surrey Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminListingQaPage({
  searchParams,
}: {
  searchParams?: { listing?: string; issue?: string }
}) {
  if (!adminToolsEnabled()) notFound()
  if (!isAdminLoggedIn()) {
    const params = new URLSearchParams()
    if (searchParams?.listing) params.set('listing', searchParams.listing)
    if (searchParams?.issue) params.set('issue', searchParams.issue)
    const next = `/admin/listing-qa${params.size ? `?${params.toString()}` : ''}`
    redirect(`/admin/login?next=${encodeURIComponent(next)}`)
  }
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading admin...</div>}>
      <AdminListingQaClient />
    </Suspense>
  )
}
