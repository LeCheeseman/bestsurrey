import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { adminToolsEnabled } from '@/lib/admin-tools'
import AdminListingQaClient from '../listing-qa/AdminListingQaClient'

export const metadata = {
  title: 'Category Review | Best Surrey Admin',
  robots: { index: false, follow: false },
}

export default function AdminCategoryReviewPage() {
  if (!adminToolsEnabled()) notFound()
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading admin...</div>}>
      <AdminListingQaClient mode="category-review" />
    </Suspense>
  )
}
