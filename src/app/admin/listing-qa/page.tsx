import { notFound } from 'next/navigation'
import { adminToolsEnabled } from '@/lib/admin-tools'
import AdminListingQaClient from './AdminListingQaClient'

export const metadata = {
  title: 'Listing QA | Best Surrey Admin',
  robots: { index: false, follow: false },
}

export default function AdminListingQaPage() {
  if (!adminToolsEnabled()) notFound()
  return <AdminListingQaClient />
}
