import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { adminToolsEnabled } from '@/lib/admin-tools'
import { isAdminLoggedIn } from '@/lib/admin-auth'
import AdminListingQaClient from '../listing-qa/AdminListingQaClient'

export const metadata = {
  title: 'Category Review | Best Surrey Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminCategoryReviewPage() {
  if (!adminToolsEnabled()) notFound()
  if (!isAdminLoggedIn()) redirect('/admin/login?next=/admin/category-review')
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading admin...</div>}>
      <AdminListingQaClient mode="category-review" />
    </Suspense>
  )
}
