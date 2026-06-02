import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { adminToolsConfigured, isAdminLoggedIn } from '@/lib/admin-auth'

export const metadata: Metadata = {
  title: 'Admin login | Best Surrey',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { next?: string; error?: string }
}) {
  if (!adminToolsConfigured()) redirect('/')
  if (isAdminLoggedIn()) redirect(searchParams?.next || '/admin')

  const next = searchParams?.next?.startsWith('/admin') ? searchParams.next : '/admin'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10 text-gray-950">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Best Surrey admin</p>
        <h1 className="mt-2 text-2xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-gray-600">Enter the admin password to edit listings.</p>

        {searchParams?.error && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Incorrect password.
          </p>
        )}

        <form action="/api/admin/login" method="POST" className="mt-5 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  )
}
