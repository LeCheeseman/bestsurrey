'use client'

import { useEffect, useMemo, useState } from 'react'

type ListingImage = {
  url: string
  alt: string
  caption?: string
  isPrimary: boolean
  sourceUrl?: string
  sourceType?: string
}

type TaxonomyItem = { id: string; name: string; slug: string; categoryId?: string }
type Listing = {
  id: string
  name: string
  slug: string
  websiteUrl: string | null
  phoneNumber: string | null
  addressLine1: string | null
  postcode: string | null
  latitude: string | null
  longitude: string | null
  shortSummary: string | null
  images: ListingImage[]
  status: 'draft' | 'review' | 'published' | 'unpublished'
  verified: boolean
  editorialNotes: string | null
  familyFriendly: boolean | null
  priceBand: string | null
  issueFlags: string[]
  issueCount: number
  townName: string
  townSlug: string
  categoryName: string
  categorySlug: string
  subcategories: TaxonomyItem[]
}

type Candidate = {
  url: string
  sourcePageUrl: string
  sourceType: string
  reason: string
  score: number
}

type Taxonomy = {
  towns: TaxonomyItem[]
  categories: TaxonomyItem[]
  subcategories: TaxonomyItem[]
}

const emptyTaxonomy: Taxonomy = { towns: [], categories: [], subcategories: [] }
const statuses = ['published', 'review', 'draft', 'unpublished'] as const
const issueLabels: Record<string, string> = {
  has_issues: 'Needs cleanup',
  dead_website: 'Dead website',
  invalid_image_json: 'Invalid image data',
  missing_image: 'Missing image',
  duplicate_name_town: 'Duplicate name',
  shared_website: 'Shared website',
  missing_faq: 'Missing Q&A',
  thin_summary: 'Thin summary',
  thin_description: 'Thin description',
  missing_website: 'Missing website',
  all: 'All listings',
}
const issueOptions = [
  'has_issues',
  'dead_website',
  'invalid_image_json',
  'missing_image',
  'duplicate_name_town',
  'shared_website',
  'missing_faq',
  'thin_description',
  'missing_website',
  'all',
]

function primaryImage(listing: Listing | null) {
  return listing?.images?.find((image) => image.isPrimary) ?? listing?.images?.[0] ?? null
}

function buttonClass(active = false) {
  return [
    'rounded border px-3 py-2 text-sm font-medium transition',
    active ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-300 bg-white text-gray-800 hover:border-gray-500',
  ].join(' ')
}

function searchUrl(query: string) {
  return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`)
  return data as T
}

export default function AdminListingQaClient() {
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(emptyTaxonomy)
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [q, setQ] = useState('')
  const [town, setTown] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('published')
  const [imageFilter, setImageFilter] = useState('all')
  const [issueFilter, setIssueFilter] = useState('has_issues')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [imageMessage, setImageMessage] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedSubcategorySlugs, setSelectedSubcategorySlugs] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [manualFile, setManualFile] = useState<File | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateLoading, setCandidateLoading] = useState(false)

  const selected = listings.find((listing) => listing.slug === selectedSlug) ?? listings[0] ?? null
  const currentImage = primaryImage(selected)
  const selectedIndex = selected ? listings.findIndex((listing) => listing.slug === selected.slug) : -1
  const compatibleSubcategories = useMemo(() => {
    const categoryId = taxonomy.categories.find((item) => item.slug === selectedCategory)?.id
    return taxonomy.subcategories.filter((item) => !categoryId || item.categoryId === categoryId)
  }, [selectedCategory, taxonomy.categories, taxonomy.subcategories])

  async function loadListings() {
    setLoading(true)
    setMessage('')
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (town) params.set('town', town)
    if (category) params.set('category', category)
    if (status !== 'all') params.set('status', status)
    if (imageFilter !== 'all') params.set('image', imageFilter)
    if (issueFilter !== 'all') params.set('issue', issueFilter)
    params.set('limit', '120')

    try {
      const data = await api<{ listings: Listing[] }>(`/api/admin/listings?${params.toString()}`)
      setListings(data.listings)
      setSelectedSlug((current) => data.listings.find((listing) => listing.slug === current)?.slug ?? data.listings[0]?.slug ?? '')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load listings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api<Taxonomy>('/api/admin/taxonomy')
      .then(setTaxonomy)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load taxonomy.'))
  }, [])

  useEffect(() => {
    void loadListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [town, category, status, imageFilter, issueFilter])

  useEffect(() => {
    if (!selected) return
    setNotes(selected.editorialNotes ?? '')
    setSelectedCategory(selected.categorySlug)
    setSelectedSubcategorySlugs(selected.subcategories.map((item) => item.slug))
    setCandidates([])
    setManualUrl('')
    setManualFile(null)
    setImageMessage('')
  }, [selected?.slug])

  useEffect(() => {
    const allowed = new Set(compatibleSubcategories.map((item) => item.slug))
    setSelectedSubcategorySlugs((slugs) => slugs.filter((slug) => allowed.has(slug)))
  }, [compatibleSubcategories])

  async function saveListing(patch: Partial<Listing> & { subcategorySlugs?: string[]; categorySlug?: string }) {
    if (!selected) return false
    setSaving(true)
    setMessage('')
    try {
      await api(`/api/admin/listings/${selected.slug}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setListings((items) =>
        items.map((item) =>
          item.slug === selected.slug
            ? {
                ...item,
                status: patch.status ?? item.status,
                verified: patch.verified ?? item.verified,
                editorialNotes: patch.editorialNotes === undefined ? item.editorialNotes : patch.editorialNotes,
                categorySlug: patch.categorySlug ?? item.categorySlug,
                categoryName: taxonomy.categories.find((cat) => cat.slug === patch.categorySlug)?.name ?? item.categoryName,
                subcategories: patch.subcategorySlugs
                  ? taxonomy.subcategories.filter((sub) => patch.subcategorySlugs?.includes(sub.slug))
                  : item.subcategories,
              }
            : item,
        ),
      )
      setMessage('Saved.')
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save listing.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function saveAndReload(patch: Partial<Listing> & { subcategorySlugs?: string[]; categorySlug?: string }) {
    const ok = await saveListing(patch)
    if (ok) await loadListings()
  }

  function updateListingImage(slug: string, image: ListingImage) {
    setListings((items) =>
      items.map((item) => {
        if (item.slug !== slug) return item
        const issueFlags = item.issueFlags.filter((flag) => !['missing_image', 'invalid_image_json'].includes(flag))
        return { ...item, images: [image], issueFlags, issueCount: issueFlags.length }
      }),
    )
  }

  async function findOfficialImages() {
    if (!selected?.websiteUrl) {
      setMessage('This listing has no website URL. Paste a manual image URL instead.')
      return
    }
    setCandidateLoading(true)
    setMessage('')
    setImageMessage('')
    try {
      const data = await api<{ candidates: Candidate[] }>('/api/admin/images/candidates', {
        method: 'POST',
        body: JSON.stringify({ websiteUrl: selected.websiteUrl }),
      })
      setCandidates(data.candidates)
      setImageMessage(data.candidates.length ? `Found ${data.candidates.length} candidate images.` : 'No usable images found on the official site.')
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Could not find images.')
    } finally {
      setCandidateLoading(false)
    }
  }

  async function previewManualUrl() {
    if (!manualUrl.trim()) return
    setCandidateLoading(true)
    setMessage('')
    setImageMessage('')
    try {
      const data = await api<{ candidates: Candidate[] }>('/api/admin/images/candidates', {
        method: 'POST',
        body: JSON.stringify({ manualUrl }),
      })
      setCandidates((items) => [...data.candidates, ...items.filter((item) => item.url !== data.candidates[0]?.url)])
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Could not preview image URL.')
    } finally {
      setCandidateLoading(false)
    }
  }

  async function applyImage(candidate: Candidate) {
    if (!selected) return
    setSaving(true)
    setMessage('')
    setImageMessage('')
    try {
      const data = await api<{ image: ListingImage }>('/api/admin/images/apply', {
        method: 'POST',
        body: JSON.stringify({
          slug: selected.slug,
          imageUrl: candidate.url,
          sourcePageUrl: candidate.sourcePageUrl,
          sourceType: candidate.sourceType,
          alt: `${selected.name} in ${selected.townName}`,
          caption: `${selected.name}, ${selected.townName}`,
        }),
      })
      updateListingImage(selected.slug, data.image)
      setImageMessage('Image uploaded and listing updated.')
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Could not apply image.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadManualFile() {
    if (!selected || !manualFile) return
    setSaving(true)
    setImageMessage('')
    try {
      const formData = new FormData()
      formData.set('slug', selected.slug)
      formData.set('file', manualFile)
      formData.set('alt', `${selected.name} in ${selected.townName}`)
      formData.set('caption', `${selected.name}, ${selected.townName}`)
      formData.set('sourceUrl', manualFile.name)

      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Upload failed: ${response.status}`)

      updateListingImage(selected.slug, data.image)
      setManualFile(null)
      setImageMessage('Manual image uploaded and listing updated.')
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Could not upload image file.')
    } finally {
      setSaving(false)
    }
  }

  function selectRelative(delta: number) {
    if (selectedIndex < 0) return
    const next = listings[selectedIndex + delta]
    if (next) setSelectedSlug(next.slug)
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <header className="border-b border-gray-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Best Surrey admin</p>
            <h1 className="mt-1 text-2xl font-semibold">Listing cleanup queue</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">Pick a category, work through the flagged listings, then keep, research, or remove each one from the site.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span>{listings.length} in queue</span>
            {selected ? <span>Reviewing {selectedIndex + 1} of {listings.length}</span> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Queue filters</h2>
            <div className="mt-4 space-y-3">
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void loadListings()
                }}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search name, slug, postcode"
              />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2 text-sm">
                <option value="">All categories</option>
                {taxonomy.categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={town} onChange={(event) => setTown(event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                  <option value="">All towns</option>
                  {taxonomy.towns.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select value={issueFilter} onChange={(event) => setIssueFilter(event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                  {issueOptions.map((value) => (
                    <option key={value} value={value}>
                      {issueLabels[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                  <option value="all">Any status</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select value={imageFilter} onChange={(event) => setImageFilter(event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                  <option value="missing">Missing image</option>
                  <option value="present">Has image</option>
                  <option value="all">Any image</option>
                </select>
              </div>
              <button onClick={() => void loadListings()} className={buttonClass(true)} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh queue'}
              </button>
            </div>
          </section>

          <section className="max-h-[calc(100vh-280px)] overflow-auto rounded border border-gray-200 bg-white">
            {listings.map((listing) => (
              <button
                key={listing.slug}
                onClick={() => setSelectedSlug(listing.slug)}
                className={[
                  'block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50',
                  selected?.slug === listing.slug ? 'bg-emerald-50' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold">{listing.name}</span>
                  <span className={listing.images.length ? 'text-xs text-emerald-700' : 'text-xs text-rose-700'}>
                    {listing.images.length ? 'image' : 'missing'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {listing.townName} · {listing.categoryName} · {listing.status}
                </p>
                {listing.issueCount > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {listing.issueFlags.slice(0, 3).map((flag) => (
                      <span key={flag} className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                        {issueLabels[flag] ?? flag.replaceAll('_', ' ')}
                      </span>
                    ))}
                    {listing.issueCount > 3 ? <span className="text-[11px] text-gray-500">+{listing.issueCount - 3}</span> : null}
                  </div>
                ) : null}
              </button>
            ))}
            {!loading && listings.length === 0 ? <p className="p-4 text-sm text-gray-600">No listings match these filters.</p> : null}
          </section>
        </aside>

        <section className="space-y-5">
          {message ? <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">{message}</div> : null}

          {selected ? (
            <>
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded border border-gray-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">{selected.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {selected.townName} · {selected.categoryName} · {selected.addressLine1 || selected.postcode || selected.slug}
                      </p>
                      {selected.websiteUrl ? (
                        <a href={selected.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-emerald-800 underline">
                          Open official website
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => selectRelative(-1)} className={buttonClass()} disabled={selectedIndex <= 0}>
                        Previous
                      </button>
                      <button onClick={() => selectRelative(1)} className={buttonClass()} disabled={selectedIndex >= listings.length - 1}>
                        Next
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded border border-gray-200 bg-gray-100">
                      {currentImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentImage.url} alt={currentImage.alt} className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-sm text-gray-600">No current image</div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm leading-6 text-gray-700">{selected.shortSummary || 'No short summary.'}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded bg-gray-100 px-2 py-1">status: {selected.status}</span>
                        <span className="rounded bg-gray-100 px-2 py-1">verified: {selected.verified ? 'yes' : 'no'}</span>
                        {selected.priceBand ? <span className="rounded bg-gray-100 px-2 py-1">price: {selected.priceBand}</span> : null}
                        {selected.familyFriendly ? <span className="rounded bg-gray-100 px-2 py-1">family friendly</span> : null}
                      </div>
                      {selected.issueCount > 0 ? (
                        <div className="rounded border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Cleanup flags</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selected.issueFlags.map((flag) => (
                              <span key={flag} className="rounded bg-white px-2 py-1 text-xs font-medium text-amber-950">
                                {issueLabels[flag] ?? flag.replaceAll('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">No cleanup flags.</div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => void saveAndReload({ verified: true, status: 'published' })} className={buttonClass(true)} disabled={saving}>
                          Keep
                        </button>
                        <button onClick={() => void saveAndReload({ status: 'review' })} className={buttonClass()} disabled={saving}>
                          Research
                        </button>
                        <button onClick={() => void saveAndReload({ status: 'unpublished' })} className="rounded border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-800 hover:border-rose-500" disabled={saving}>
                          Remove from site
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold">Category QA</h3>
                  <div className="mt-3 space-y-3">
                    <label className="block text-xs font-medium text-gray-700" htmlFor="category">
                      Main category
                    </label>
                    <select id="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2 text-sm">
                      {taxonomy.categories.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-gray-700">Subcategories</p>
                      <p className="text-xs text-gray-500">{selectedSubcategorySlugs.length} selected</p>
                    </div>
                    <div className="grid max-h-72 gap-2 overflow-auto rounded border border-gray-200 p-2">
                      {compatibleSubcategories.map((item) => (
                        <label
                          key={item.slug}
                          className={[
                            'flex cursor-pointer items-start gap-2 rounded border px-3 py-2 text-sm transition',
                            selectedSubcategorySlugs.includes(item.slug)
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                              : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubcategorySlugs.includes(item.slug)}
                            onChange={(event) => {
                              setSelectedSubcategorySlugs((slugs) =>
                                event.target.checked ? [...slugs, item.slug] : slugs.filter((slug) => slug !== item.slug),
                              )
                            }}
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-medium">{item.name}</span>
                            <span className="block text-xs text-gray-500">{item.slug}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        void saveListing({
                          categorySlug: selectedCategory,
                          subcategorySlugs: selectedSubcategorySlugs,
                        })
                      }
                      className={buttonClass(true)}
                      disabled={saving}
                    >
                      Save categories
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold">Editorial notes</h3>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-3 min-h-28 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                <button onClick={() => void saveListing({ editorialNotes: notes })} className={`${buttonClass(true)} mt-3`} disabled={saving}>
                  Save notes
                </button>
              </section>

              <section className="rounded border border-gray-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Image candidates</h3>
                    <p className="mt-1 text-sm text-gray-600">Use the official-site finder, paste a direct official image URL, or upload a file manually.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void findOfficialImages()} className={buttonClass(true)} disabled={candidateLoading || !selected.websiteUrl}>
                      {candidateLoading ? 'Finding...' : 'Find from official site'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input value={manualUrl} onChange={(event) => setManualUrl(event.target.value)} className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Paste direct image URL" />
                  <button onClick={() => void previewManualUrl()} className={buttonClass()} disabled={candidateLoading || !manualUrl.trim()}>
                    Preview URL
                  </button>
                </div>

                <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
                  <label className="block text-xs font-medium text-gray-700" htmlFor="manual-image-upload">
                    Upload image file manually
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      id="manual-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(event) => setManualFile(event.target.files?.[0] ?? null)}
                      className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                    <button onClick={() => void uploadManualFile()} className={buttonClass(true)} disabled={saving || !manualFile}>
                      Upload file
                    </button>
                  </div>
                  {manualFile ? <p className="mt-2 text-xs text-gray-600">{manualFile.name} · {(manualFile.size / 1024 / 1024).toFixed(2)}MB</p> : null}
                </div>

                {imageMessage ? <div className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">{imageMessage}</div> : null}

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <a className={buttonClass()} href={searchUrl(`${selected.name} ${selected.townName} official photos`)} target="_blank" rel="noreferrer">
                    Search web
                  </a>
                  <a className={buttonClass()} href={searchUrl(`${selected.name} ${selected.townName} site:facebook.com`)} target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                  <a className={buttonClass()} href={searchUrl(`${selected.name} ${selected.townName} site:instagram.com`)} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                  <a className={buttonClass()} href={`https://www.google.com/search?${new URLSearchParams({ tbm: 'isch', q: `${selected.name} ${selected.townName}` }).toString()}`} target="_blank" rel="noreferrer">
                    Image search
                  </a>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {candidates.map((candidate) => (
                    <article key={candidate.url} className="overflow-hidden rounded border border-gray-200 bg-white">
                      <div className="bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={candidate.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </div>
                      <div className="space-y-3 p-3">
                        <p className="line-clamp-2 text-xs text-gray-600">{candidate.reason}</p>
                        <div className="flex items-center justify-between gap-2">
                          <a href={candidate.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-800 underline">
                            Open image
                          </a>
                          <button onClick={() => void applyImage(candidate)} className={buttonClass(true)} disabled={saving}>
                            Use image
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="rounded border border-gray-200 bg-white p-8 text-center text-gray-600">
              {loading ? 'Loading listings...' : 'No listing selected.'}
            </section>
          )}
        </section>
      </div>
    </main>
  )
}
