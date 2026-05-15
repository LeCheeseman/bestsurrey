import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { adminToolsEnabled } from '@/lib/admin-tools'
import AdminListingQaClient from './AdminListingQaClient'

export const metadata = {
  title: 'Listing QA | Best Surrey Admin',
  robots: { index: false, follow: false },
}

export default function AdminListingQaPage() {
  if (!adminToolsEnabled()) notFound()
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading admin...</div>}>
      <AdminListingQaClient />
    </Suspense>
  )
}
