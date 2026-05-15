import Link from 'next/link'

const flagLinks = [
  { label: 'Needs cleanup', issue: 'has_issues' },
  { label: 'Missing image', issue: 'missing_image' },
  { label: '2 or fewer photos', issue: 'low_photo_count' },
  { label: 'Possible low-res image', issue: 'possible_low_res_image' },
  { label: 'Duplicate name', issue: 'duplicate_name_town' },
  { label: 'Shared website', issue: 'shared_website' },
  { label: 'Thin description', issue: 'thin_description' },
  { label: 'Missing website', issue: 'missing_website' },
]

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 text-gray-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Best Surrey admin</p>
          <h1 className="mt-1 text-3xl font-semibold">Admin</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Jump into the cleanup queue by issue type, or work through every listing by category.
          </p>
        </div>

        <section className="rounded border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Find listings by flag</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {flagLinks.map((flag) => (
              <Link
                key={flag.issue}
                href={`/admin/listing-qa?issue=${flag.issue}`}
                className="rounded border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
              >
                {flag.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link href="/admin/listing-qa" className="rounded border border-gray-200 bg-white p-5 hover:border-emerald-700">
            <h2 className="text-sm font-semibold">Cleanup queue</h2>
            <p className="mt-2 text-sm text-gray-600">Review listings with issues.</p>
          </Link>
          <Link href="/admin/category-review" className="rounded border border-gray-200 bg-white p-5 hover:border-emerald-700">
            <h2 className="text-sm font-semibold">Category review</h2>
            <p className="mt-2 text-sm text-gray-600">Work through listings category by category.</p>
          </Link>
        </section>
      </div>
    </main>
  )
}
