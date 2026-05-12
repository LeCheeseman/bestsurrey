import { notFound } from 'next/navigation'
import { adminToolsEnabled } from '@/lib/admin-tools'
import AdminListingQaClient from '../listing-qa/AdminListingQaClient'

export const metadata = {
  title: 'Category Review | Best Surrey Admin',
  robots: { index: false, follow: false },
}

export default function AdminCategoryReviewPage() {
  if (!adminToolsEnabled()) notFound()
  return <AdminListingQaClient mode="category-review" />
}
