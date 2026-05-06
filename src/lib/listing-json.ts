import type { FaqItem, ListingImage, OpeningHours } from '@/types'

/**
 * Some early imports stored JSONB values as JSON strings. Normalize at the
 * application edge so legacy rows keep rendering while the DB is cleaned up.
 */
function parseJsonString<T>(value: unknown): T | null {
  if (typeof value !== 'string') return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function normalizeListingImages(value: unknown): ListingImage[] {
  const parsed = parseJsonString<ListingImage[]>(value)
  const images = Array.isArray(value) ? value : parsed

  if (!Array.isArray(images)) return []

  return images
    .filter((image): image is ListingImage => (
      !!image &&
      typeof image === 'object' &&
      typeof image.url === 'string' &&
      image.url.length > 0
    ))
    .map((image) => ({
      ...image,
      alt: typeof image.alt === 'string' && image.alt.trim()
        ? image.alt
        : 'Best Surrey listing image',
      isPrimary: Boolean(image.isPrimary),
    }))
}

export function normalizeFaq(value: unknown): FaqItem[] {
  const parsed = parseJsonString<FaqItem[]>(value)
  const faq = Array.isArray(value) ? value : parsed

  if (!Array.isArray(faq)) return []

  return faq.filter((item): item is FaqItem => (
    !!item &&
    typeof item === 'object' &&
    typeof item.question === 'string' &&
    item.question.length > 0 &&
    typeof item.answer === 'string' &&
    item.answer.length > 0
  ))
}

export function normalizeOpeningHours(value: unknown): OpeningHours | null {
  const parsed = parseJsonString<OpeningHours>(value)
  const hours = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : parsed

  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return null
  return hours as OpeningHours
}
