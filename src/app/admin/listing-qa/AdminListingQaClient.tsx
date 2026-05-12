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
type ListingCategory = TaxonomyItem & { isPrimary: boolean }
type ListingMatch = {
  slug: string
  name: string
  townName: string
  categoryName: string
  websiteUrl: string | null
  status: string
}
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
  longDescription: string | null
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
  categories: ListingCategory[]
  subcategories: TaxonomyItem[]
  duplicateNameMatches: ListingMatch[]
  sharedWebsiteMatches: ListingMatch[]
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

type DetailsForm = {
  name: string
  websiteUrl: string
  phoneNumber: string
  addressLine1: string
  postcode: string
  shortSummary: string
  longDescription: string
  familyFriendly: '' | 'true' | 'false'
  priceBand: string
}

type QueueOverrides = Partial<{
  q: string
  town: string
  category: string
  status: string
  verifiedFilter: string
  imageFilter: string
  issueFilter: string
  selectedSlug: string
}>

type ListingPaging = {
  limit: number
  offset: number
  count: number
  total: number
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
  'thin_description',
  'missing_website',
  'all',
]

type AdminListingQaClientProps = {
  mode?: 'qa' | 'category-review'
}

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

export default function AdminListingQaClient({ mode = 'qa' }: AdminListingQaClientProps) {
  const categoryReviewMode = mode === 'category-review'
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(emptyTaxonomy)
  const [listings, setListings] = useState<Listing[]>([])
  const [queueTotal, setQueueTotal] = useState(0)
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [returnToSlug, setReturnToSlug] = useState('')
  const [q, setQ] = useState('')
  const [town, setTown] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('published')
  const [verifiedFilter, setVerifiedFilter] = useState(categoryReviewMode ? 'all' : 'all')
  const [imageFilter, setImageFilter] = useState('all')
  const [issueFilter, setIssueFilter] = useState(categoryReviewMode ? 'all' : 'has_issues')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [imageMessage, setImageMessage] = useState('')
  const [details, setDetails] = useState<DetailsForm>({
    name: '',
    websiteUrl: '',
    phoneNumber: '',
    addressLine1: '',
    postcode: '',
    shortSummary: '',
    longDescription: '',
    familyFriendly: '',
    priceBand: '',
  })
  const [notes, setNotes] = useState('')
  const [selectedSubcategorySlugs, setSelectedSubcategorySlugs] = useState<string[]>([])
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([])
  const [categoryToAdd, setCategoryToAdd] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [manualFiles, setManualFiles] = useState<File[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateLoading, setCandidateLoading] = useState(false)

  const selected = listings.find((listing) => listing.slug === selectedSlug) ?? listings[0] ?? null
  const currentImage = primaryImage(selected)
  const selectedIndex = selected ? listings.findIndex((listing) => listing.slug === selected.slug) : -1
  const currentCategorySlugs = useMemo(() => {
    if (selectedCategorySlugs.length > 0) return selectedCategorySlugs
    if (selected?.categories?.length) return selected.categories.map((item) => item.slug)
    return selected?.categorySlug ? [selected.categorySlug] : []
  }, [selected?.categories, selected?.categorySlug, selectedCategorySlugs])
  const compatibleSubcategories = useMemo(() => {
    const categoryIds = new Set(taxonomy.categories.filter((item) => currentCategorySlugs.includes(item.slug)).map((item) => item.id))
    return taxonomy.subcategories.filter((item) => !item.categoryId || categoryIds.has(item.categoryId))
  }, [currentCategorySlugs, taxonomy.categories, taxonomy.subcategories])

  async function loadListings(overrides: QueueOverrides = {}) {
    setLoading(true)
    setMessage('')
    const params = new URLSearchParams()
    const nextQ = overrides.q ?? q
    const nextTown = overrides.town ?? town
    const nextCategory = overrides.category ?? category
    const nextStatus = overrides.status ?? status
    const nextVerifiedFilter = overrides.verifiedFilter ?? verifiedFilter
    const nextImageFilter = overrides.imageFilter ?? imageFilter
    const nextIssueFilter = overrides.issueFilter ?? issueFilter
    if (nextQ.trim()) params.set('q', nextQ.trim())
    if (nextTown) params.set('town', nextTown)
    if (nextCategory) params.set('category', nextCategory)
    if (nextStatus !== 'all') params.set('status', nextStatus)
    if (nextVerifiedFilter !== 'all') params.set('verified', nextVerifiedFilter)
    if (nextImageFilter !== 'all') params.set('image', nextImageFilter)
    if (nextIssueFilter !== 'all') params.set('issue', nextIssueFilter)
    params.set('limit', '120')

    try {
      const data = await api<{ listings: Listing[]; paging: ListingPaging }>(`/api/admin/listings?${params.toString()}`)
      setListings(data.listings)
      setQueueTotal(data.paging.total)
      setSelectedSlug((current) => {
        const preferred = overrides.selectedSlug ?? current
        return data.listings.find((listing) => listing.slug === preferred)?.slug ?? data.listings[0]?.slug ?? ''
      })
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
  }, [town, category, status, verifiedFilter, imageFilter, issueFilter])

  useEffect(() => {
    if (!selected) return
    setDetails({
      name: selected.name,
      websiteUrl: selected.websiteUrl ?? '',
      phoneNumber: selected.phoneNumber ?? '',
      addressLine1: selected.addressLine1 ?? '',
      postcode: selected.postcode ?? '',
      shortSummary: selected.shortSummary ?? '',
      longDescription: selected.longDescription ?? '',
      familyFriendly: selected.familyFriendly === null ? '' : selected.familyFriendly ? 'true' : 'false',
      priceBand: selected.priceBand ?? '',
    })
    setNotes(selected.editorialNotes ?? '')
    const categories = selected.categories?.length ? selected.categories : [{ id: selected.categorySlug, name: selected.categoryName, slug: selected.categorySlug, isPrimary: true }]
    setSelectedCategorySlugs(categories.map((item) => item.slug))
    setSelectedSubcategorySlugs(selected.subcategories.map((item) => item.slug))
    setCategoryToAdd('')
    setCandidates([])
    setManualUrl('')
    setManualFiles([])
    setImageMessage('')
  }, [selected?.slug])

  useEffect(() => {
    const allowed = new Set(compatibleSubcategories.map((item) => item.slug))
    setSelectedSubcategorySlugs((slugs) => slugs.filter((slug) => allowed.has(slug)))
  }, [compatibleSubcategories])

  const categoryChoices = useMemo(() => {
    const currentSubcategories = new Set(selectedSubcategorySlugs)
    const currentCategories = new Set(currentCategorySlugs)
    return [
      ...taxonomy.categories
        .filter((item) => !currentCategories.has(item.slug))
        .map((item) => ({
          value: `category:${item.slug}`,
          label: `Add main category: ${item.name}`,
        })),
      ...compatibleSubcategories
        .filter((item) => !currentSubcategories.has(item.slug))
        .map((item) => ({
          value: `subcategory:${item.slug}`,
          label: `Subcategory: ${item.name}`,
        })),
    ]
  }, [compatibleSubcategories, currentCategorySlugs, selectedSubcategorySlugs, taxonomy.categories])

  async function saveListing(patch: Partial<Listing> & { subcategorySlugs?: string[]; categorySlug?: string; categorySlugs?: string[] }) {
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
                name: patch.name ?? item.name,
                websiteUrl: patch.websiteUrl === undefined ? item.websiteUrl : patch.websiteUrl,
                phoneNumber: patch.phoneNumber === undefined ? item.phoneNumber : patch.phoneNumber,
                addressLine1: patch.addressLine1 === undefined ? item.addressLine1 : patch.addressLine1,
                postcode: patch.postcode === undefined ? item.postcode : patch.postcode,
                shortSummary: patch.shortSummary === undefined ? item.shortSummary : patch.shortSummary,
                longDescription: patch.longDescription === undefined ? item.longDescription : patch.longDescription,
                familyFriendly: patch.familyFriendly === undefined ? item.familyFriendly : patch.familyFriendly,
                priceBand: patch.priceBand === undefined ? item.priceBand : patch.priceBand,
                editorialNotes: patch.editorialNotes === undefined ? item.editorialNotes : patch.editorialNotes,
                categorySlug: patch.categorySlugs?.[0] ?? patch.categorySlug ?? item.categorySlug,
                categoryName: taxonomy.categories.find((cat) => cat.slug === (patch.categorySlugs?.[0] ?? patch.categorySlug))?.name ?? item.categoryName,
                categories: patch.categorySlugs
                  ? patch.categorySlugs
                      .map((slug, index) => {
                        const category = taxonomy.categories.find((item) => item.slug === slug)
                        return category ? { ...category, isPrimary: index === 0 } : null
                      })
                      .filter((category): category is ListingCategory => Boolean(category))
                  : item.categories,
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

  async function saveAndReload(patch: Partial<Listing> & { subcategorySlugs?: string[]; categorySlug?: string; categorySlugs?: string[] }) {
    const ok = await saveListing(patch)
    if (!ok) return
    if (patch.status === 'unpublished' && returnToSlug) {
      const targetSlug = returnToSlug
      setReturnToSlug('')
      setQ(targetSlug)
      setTown('')
      setCategory('')
      setStatus('all')
      setVerifiedFilter('all')
      setImageFilter('all')
      setIssueFilter('all')
      await loadListings({
        q: targetSlug,
        town: '',
        category: '',
        status: 'all',
        verifiedFilter: 'all',
        imageFilter: 'all',
        issueFilter: 'all',
        selectedSlug: targetSlug,
      })
      return
    }
    await loadListings()
  }

  async function completeListing() {
    if (!selected) return
    const completedSlug = selected.slug
    const completedName = selected.name
    const ok = await saveListing({ verified: true, status: 'published' })
    if (!ok) return

    const nextListings = listings.filter((listing) => listing.slug !== completedSlug)
    setListings(nextListings)
    setQueueTotal((total) => Math.max(0, total - 1))
    setSelectedSlug(nextListings[Math.min(selectedIndex, nextListings.length - 1)]?.slug ?? '')
    setMessage(categoryReviewMode ? `${completedName} marked reviewed.` : `${completedName} marked complete and removed from this QA queue.`)
  }

  async function removeSelectedFromSite() {
    if (!selected) return
    const removedSlug = selected.slug
    const removedName = selected.name
    setSaving(true)
    setMessage('')
    try {
      await api(`/api/admin/listings/${removedSlug}/remove`, {
        method: 'POST',
      })

      if (returnToSlug) {
        const targetSlug = returnToSlug
        setReturnToSlug('')
        setQ(targetSlug)
        setTown('')
        setCategory('')
        setStatus('all')
        setVerifiedFilter('all')
        setImageFilter('all')
        setIssueFilter('all')
        await loadListings({
          q: targetSlug,
          town: '',
          category: '',
          status: 'all',
          verifiedFilter: 'all',
          imageFilter: 'all',
          issueFilter: 'all',
          selectedSlug: targetSlug,
        })
      } else {
        const nextListings = listings.filter((listing) => listing.slug !== removedSlug)
        setListings(nextListings)
        setQueueTotal((total) => Math.max(0, total - 1))
        setSelectedSlug(nextListings[Math.min(selectedIndex, nextListings.length - 1)]?.slug ?? '')
      }
      setMessage(`${removedName} was removed from the live site.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not remove listing.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCategories(categorySlugs = currentCategorySlugs, subcategorySlugs = selectedSubcategorySlugs) {
    await saveListing({ categorySlugs, subcategorySlugs })
  }

  async function removeSubcategory(slug: string) {
    const nextSlugs = selectedSubcategorySlugs.filter((item) => item !== slug)
    setSelectedSubcategorySlugs(nextSlugs)
    await saveCategories(currentCategorySlugs, nextSlugs)
  }

  async function removeCategory(slug: string) {
    const baseCategorySlugs = currentCategorySlugs
    if (baseCategorySlugs.length <= 1) {
      setMessage('A listing needs at least one main category.')
      return
    }
    const nextCategorySlugs = baseCategorySlugs.filter((item) => item !== slug)
    const allowedCategoryIds = new Set(taxonomy.categories.filter((item) => nextCategorySlugs.includes(item.slug)).map((item) => item.id))
    const nextSubcategorySlugs = selectedSubcategorySlugs.filter((subcategorySlug) => {
      const subcategory = taxonomy.subcategories.find((item) => item.slug === subcategorySlug)
      return !subcategory?.categoryId || allowedCategoryIds.has(subcategory.categoryId)
    })
    setSelectedCategorySlugs(nextCategorySlugs)
    setSelectedSubcategorySlugs(nextSubcategorySlugs)
    await saveCategories(nextCategorySlugs, nextSubcategorySlugs)
  }

  async function addCategoryChoice() {
    if (!categoryToAdd) return
    const [kind, slug] = categoryToAdd.split(':')
    if (!slug) return

    if (kind === 'category') {
      const baseCategorySlugs = currentCategorySlugs
      const nextCategorySlugs = baseCategorySlugs.includes(slug) ? baseCategorySlugs : [...baseCategorySlugs, slug]
      setSelectedCategorySlugs(nextCategorySlugs)
      setCategoryToAdd('')
      await saveCategories(nextCategorySlugs, selectedSubcategorySlugs)
      return
    }

    if (kind === 'subcategory') {
      const nextSlugs = [...new Set([...selectedSubcategorySlugs, slug])]
      setSelectedSubcategorySlugs(nextSlugs)
      setCategoryToAdd('')
      await saveCategories(currentCategorySlugs, nextSlugs)
    }
  }

  async function saveDetails() {
    await saveListing({
      name: details.name,
      websiteUrl: details.websiteUrl || null,
      phoneNumber: details.phoneNumber || null,
      addressLine1: details.addressLine1 || null,
      postcode: details.postcode || null,
      shortSummary: details.shortSummary || null,
      longDescription: details.longDescription || null,
      familyFriendly: details.familyFriendly === '' ? null : details.familyFriendly === 'true',
      priceBand: details.priceBand || null,
    })
  }

  async function reviewListingInAdmin(slug: string) {
    if (selected?.slug && selected.slug !== slug) setReturnToSlug(selected.slug)
    setQ(slug)
    setTown('')
    setCategory('')
    setStatus('all')
    setVerifiedFilter('all')
    setImageFilter('all')
    setIssueFilter('all')
    await loadListings({
      q: slug,
      town: '',
      category: '',
      status: 'all',
      verifiedFilter: 'all',
      imageFilter: 'all',
      issueFilter: 'all',
      selectedSlug: slug,
    })
  }

  async function mergeDuplicate(sourceSlug: string) {
    if (!selected) return
    const ok = window.confirm(`Merge ${sourceSlug} into ${selected.slug} and remove the duplicate from the live site?`)
    if (!ok) return

    const targetSlug = selected.slug
    setSaving(true)
    setMessage('')
    try {
      const data = await api<{ listing?: Listing }>(`/api/admin/listings/${targetSlug}/merge`, {
        method: 'POST',
        body: JSON.stringify({ sourceSlug }),
      })
      if (data.listing) {
        setListings((items) => items.map((item) => (item.slug === targetSlug ? data.listing as Listing : item)))
        setSelectedSlug(targetSlug)
      }
      setMessage('Duplicate merged and removed from the live site.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not merge duplicate.')
    } finally {
      setSaving(false)
    }
  }

  async function removeDuplicate(sourceSlug: string) {
    if (!selected) return
    const ok = window.confirm(`Remove duplicate ${sourceSlug} from the live site?`)
    if (!ok) return

    setSaving(true)
    setMessage('')
    try {
      await api(`/api/admin/listings/${sourceSlug}/remove`, {
        method: 'POST',
      })
      setMessage('Duplicate removed from the live site.')
      await loadListings({ selectedSlug: selected.slug })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not remove duplicate.')
    } finally {
      setSaving(false)
    }
  }

  function detailField<K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) {
    setDetails((current) => ({ ...current, [key]: value }))
  }

  function updateListingImages(slug: string, images: ListingImage[]) {
    setListings((items) =>
      items.map((item) => {
        if (item.slug !== slug) return item
        const issueFlags = item.issueFlags.filter((flag) => !['missing_image', 'invalid_image_json'].includes(flag))
        return { ...item, images, issueFlags, issueCount: issueFlags.length }
      }),
    )
  }

  async function removeGalleryImage(index: number) {
    if (!selected) return
    const images = selected.images
      .filter((_, imageIndex) => imageIndex !== index)
      .map((image, imageIndex) => ({ ...image, isPrimary: imageIndex === 0 }))
    const ok = await saveListing({ images })
    if (ok) updateListingImages(selected.slug, images)
  }

  async function makePrimaryImage(index: number) {
    if (!selected || index === 0) return
    const image = selected.images[index]
    if (!image) return
    const images = [image, ...selected.images.filter((_, imageIndex) => imageIndex !== index)].map((item, imageIndex) => ({
      ...item,
      isPrimary: imageIndex === 0,
    }))
    const ok = await saveListing({ images })
    if (ok) updateListingImages(selected.slug, images)
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
      const data = await api<{ candidates: Candidate[]; warning?: string }>('/api/admin/images/candidates', {
        method: 'POST',
        body: JSON.stringify({ websiteUrl: selected.websiteUrl }),
      })
      setCandidates(data.candidates)
      setImageMessage(data.warning ?? (data.candidates.length ? `Found ${data.candidates.length} candidate images.` : 'No usable images found on the official site.'))
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
      const data = await api<{ image: ListingImage; images: ListingImage[] }>('/api/admin/images/apply', {
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
      updateListingImages(selected.slug, data.images)
      setImageMessage('Image uploaded and added to the gallery.')
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Could not apply image.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadManualFiles() {
    if (!selected || manualFiles.length === 0) return
    setSaving(true)
    setImageMessage('')
    try {
      let images = selected.images
      for (const file of manualFiles) {
        const formData = new FormData()
        formData.set('slug', selected.slug)
        formData.set('file', file)
        formData.set('alt', `${selected.name} in ${selected.townName}`)
        formData.set('caption', `${selected.name}, ${selected.townName}`)
        formData.set('sourceUrl', file.name)

        const response = await fetch('/api/admin/images/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || `Upload failed: ${response.status}`)
        images = data.images
      }

      updateListingImages(selected.slug, images)
      setManualFiles([])
      setImageMessage(`${manualFiles.length} image${manualFiles.length === 1 ? '' : 's'} uploaded and added to the gallery.`)
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

  async function returnToOriginal() {
    if (!returnToSlug) return
    const targetSlug = returnToSlug
    setReturnToSlug('')
    setQ(targetSlug)
    setTown('')
    setCategory('')
    setStatus('all')
    setVerifiedFilter('all')
    setImageFilter('all')
    setIssueFilter('all')
    await loadListings({
      q: targetSlug,
      town: '',
      category: '',
      status: 'all',
      verifiedFilter: 'all',
      imageFilter: 'all',
      issueFilter: 'all',
      selectedSlug: targetSlug,
    })
  }

  function matchRows(matches: ListingMatch[]) {
    return (
      <div className="mt-2 divide-y divide-amber-200 rounded border border-amber-200 bg-white">
        {matches.map((match) => (
          <div key={match.slug} className="p-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-gray-950">{match.name}</p>
                <p className="text-xs text-gray-600">
                  {match.townName} · {match.categoryName} · {match.status}
                </p>
                <p className="mt-1 break-all text-xs text-gray-500">{match.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void reviewListingInAdmin(match.slug)} className="text-xs font-medium text-emerald-800 underline" type="button">
                  Review in admin
                </button>
                <a href={`/listings/${match.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-800 underline">
                  Open public
                </a>
                {match.websiteUrl ? (
                  <a href={match.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-800 underline">
                    Website
                  </a>
                ) : null}
                {selected && match.slug !== selected.slug ? (
                  <>
                    <button onClick={() => void removeDuplicate(match.slug)} className="text-xs font-medium text-rose-800 underline" type="button" disabled={saving}>
                      Remove duplicate
                    </button>
                    <button onClick={() => void mergeDuplicate(match.slug)} className="text-xs font-medium text-rose-800 underline" type="button" disabled={saving}>
                      Merge into current
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <header className="border-b border-gray-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Best Surrey admin</p>
            <h1 className="mt-1 text-2xl font-semibold">{categoryReviewMode ? 'Category review' : 'Listing cleanup queue'}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              {categoryReviewMode
                ? 'Work through every listing in a selected category or town. Save edits as you go, then mark reviewed when that listing is clean.'
                : 'Save edits as you go. A listing only leaves this queue when you click Submit complete, Research, or Remove from site.'}
            </p>
            <nav className="mt-3 flex flex-wrap gap-2 text-sm">
              <a href="/admin/listing-qa" className={categoryReviewMode ? 'text-emerald-800 underline' : 'font-semibold text-gray-950'}>
                Cleanup queue
              </a>
              <span className="text-gray-300">/</span>
              <a href="/admin/category-review" className={categoryReviewMode ? 'font-semibold text-gray-950' : 'text-emerald-800 underline'}>
                Category review
              </a>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span>
              Showing {listings.length} of {queueTotal} {categoryReviewMode ? 'listings' : 'in queue'}
            </span>
            {selected ? <span>Reviewing {selectedIndex + 1} of {listings.length}</span> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold">{categoryReviewMode ? 'Review filters' : 'Queue filters'}</h2>
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
              {categoryReviewMode ? (
                <select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2 text-sm">
                  <option value="all">Any review state</option>
                  <option value="false">Not reviewed</option>
                  <option value="true">Reviewed</option>
                </select>
              ) : null}
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
                {loading ? 'Loading...' : categoryReviewMode ? 'Refresh listings' : 'Refresh queue'}
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
              {returnToSlug ? (
                <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>You are reviewing a duplicate. Removing it will return you to the original listing.</span>
                    <button onClick={() => void returnToOriginal()} className="font-medium underline" type="button">
                      Back to original
                    </button>
                  </div>
                </div>
              ) : null}
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
                          {selected.duplicateNameMatches.length > 0 ? (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-amber-950">Possible duplicate name matches</p>
                              {matchRows(selected.duplicateNameMatches)}
                            </div>
                          ) : null}
                          {selected.sharedWebsiteMatches.length > 0 ? (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-amber-950">Other listings using the same website</p>
                              {matchRows(selected.sharedWebsiteMatches)}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">No cleanup flags.</div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => void completeListing()} className={buttonClass(true)} disabled={saving}>
                          {categoryReviewMode ? 'Mark reviewed' : 'Submit complete'}
                        </button>
                        <button onClick={() => void saveAndReload({ status: 'review' })} className={buttonClass()} disabled={saving}>
                          Research
                        </button>
                        <button onClick={() => void removeSelectedFromSite()} className="rounded border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-800 hover:border-rose-500" disabled={saving}>
                          Remove from site
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold">Category QA</h3>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-gray-700">Currently listed in</p>
                      <p className="text-xs text-gray-500">{selectedSubcategorySlugs.length + currentCategorySlugs.length} total</p>
                    </div>
                    <div className="flex flex-wrap gap-2 rounded border border-gray-200 bg-gray-50 p-3">
                      {currentCategorySlugs.map((slug, index) => {
                        const category = taxonomy.categories.find((item) => item.slug === slug)
                        return (
                          <span key={slug} className="inline-flex items-center gap-2 rounded border border-emerald-200 bg-white px-3 py-2 text-sm">
                            <span>
                              <span className="font-medium">{category?.name ?? slug}</span>
                              <span className="ml-1 text-xs text-gray-500">{index === 0 ? 'primary' : 'main'}</span>
                            </span>
                            <button
                              onClick={() => void removeCategory(slug)}
                              className="rounded px-1 text-base font-semibold leading-none text-rose-700 hover:bg-rose-50 disabled:text-gray-300"
                              type="button"
                              disabled={saving || currentCategorySlugs.length <= 1}
                              aria-label={`Remove ${category?.name ?? slug}`}
                            >
                              x
                            </button>
                          </span>
                        )
                      })}
                      {selectedSubcategorySlugs.length > 0 ? (
                        selectedSubcategorySlugs.map((slug) => {
                          const subcategory = taxonomy.subcategories.find((item) => item.slug === slug)
                          return (
                            <span key={slug} className="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm">
                              <span>{subcategory?.name ?? slug}</span>
                              <button
                                onClick={() => void removeSubcategory(slug)}
                                className="rounded px-1 text-base font-semibold leading-none text-rose-700 hover:bg-rose-50"
                                type="button"
                                disabled={saving}
                                aria-label={`Remove ${subcategory?.name ?? slug}`}
                              >
                                x
                              </button>
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-sm text-gray-500">No subcategory pages attached.</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select value={categoryToAdd} onChange={(event) => setCategoryToAdd(event.target.value)} className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-2 text-sm">
                        <option value="">Select category or subcategory to add</option>
                        {categoryChoices.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => void addCategoryChoice()} className={buttonClass(true)} disabled={saving || !categoryToAdd}>
                        Add
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">Adding a main category now keeps the existing primary category and adds the new one alongside it. Use the red x to remove a category.</p>
                  </div>
                </div>
              </section>

              <section className="rounded border border-gray-200 bg-white p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold">Listing details</h3>
                  <a href={`/listings/${selected.slug}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-800 underline">
                    Open public listing
                  </a>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Name
                    <input value={details.name} onChange={(event) => detailField('name', event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" />
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    Website
                    <input value={details.websiteUrl} onChange={(event) => detailField('websiteUrl', event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" placeholder="https://..." />
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    Phone
                    <input value={details.phoneNumber} onChange={(event) => detailField('phoneNumber', event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" />
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    Address
                    <input value={details.addressLine1} onChange={(event) => detailField('addressLine1', event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" />
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    Postcode
                    <input value={details.postcode} onChange={(event) => detailField('postcode', event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-gray-700">
                      Price
                      <select value={details.priceBand} onChange={(event) => detailField('priceBand', event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950">
                        <option value="">Unknown</option>
                        <option value="£">£</option>
                        <option value="££">££</option>
                        <option value="£££">£££</option>
                        <option value="££££">££££</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-gray-700">
                      Family friendly
                      <select value={details.familyFriendly} onChange={(event) => detailField('familyFriendly', event.target.value as DetailsForm['familyFriendly'])} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950">
                        <option value="">Unknown</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>
                </div>
                <label className="mt-3 block text-xs font-medium text-gray-700">
                  Short summary
                  <textarea value={details.shortSummary} onChange={(event) => detailField('shortSummary', event.target.value)} className="mt-1 min-h-24 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" />
                </label>
                <label className="mt-3 block text-xs font-medium text-gray-700">
                  Long description
                  <textarea value={details.longDescription} onChange={(event) => detailField('longDescription', event.target.value)} className="mt-1 min-h-40 w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal text-gray-950" />
                </label>
                <button onClick={() => void saveDetails()} className={`${buttonClass(true)} mt-3`} disabled={saving}>
                  Save listing details
                </button>
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
                    <h3 className="text-sm font-semibold">Image gallery</h3>
                    <p className="mt-1 text-sm text-gray-600">Add multiple images, set the first image as primary, and remove any bad gallery images.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void findOfficialImages()} className={buttonClass(true)} disabled={candidateLoading || !selected.websiteUrl}>
                      {candidateLoading ? 'Finding...' : 'Find from official site'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {selected.images.map((image, index) => (
                    <article key={`${image.url}-${index}`} className="overflow-hidden rounded border border-gray-200 bg-white">
                      <div className="bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={image.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </div>
                      <div className="space-y-2 p-3">
                        <p className="line-clamp-2 text-xs text-gray-600">{image.caption || image.alt || image.url}</p>
                        <div className="flex flex-wrap gap-2">
                          {index === 0 ? (
                            <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">Primary</span>
                          ) : (
                            <button onClick={() => void makePrimaryImage(index)} className="text-xs font-medium text-emerald-800 underline" type="button" disabled={saving}>
                              Make primary
                            </button>
                          )}
                          <a href={image.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-800 underline">
                            Open
                          </a>
                          <button onClick={() => void removeGalleryImage(index)} className="text-xs font-medium text-rose-800 underline" type="button" disabled={saving}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {selected.images.length === 0 ? <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No gallery images yet.</div> : null}
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
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(event) => setManualFiles(Array.from(event.target.files ?? []))}
                      className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                    <button onClick={() => void uploadManualFiles()} className={buttonClass(true)} disabled={saving || manualFiles.length === 0}>
                      Upload file{manualFiles.length === 1 ? '' : 's'}
                    </button>
                  </div>
                  {manualFiles.length > 0 ? (
                    <p className="mt-2 text-xs text-gray-600">
                      {manualFiles.length} selected · {(manualFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)}MB
                    </p>
                  ) : null}
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
