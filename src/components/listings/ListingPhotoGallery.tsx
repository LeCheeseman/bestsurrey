'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ListingImage } from '@/types'
import { ResponsiveListingImage } from './ResponsiveListingImage'

interface ListingPhotoGalleryProps {
  images: ListingImage[]
  listingName: string
}

export function ListingPhotoGallery({
  images,
  listingName,
}: ListingPhotoGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [hasScrollableOverflow, setHasScrollableOverflow] = useState(false)
  const galleryImages = images.length > 0
    ? [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    : []
  const [primary] = galleryImages

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const maxScrollLeft = element.scrollWidth - element.clientWidth
    setHasScrollableOverflow(maxScrollLeft > 8)
    setCanScrollPrevious(element.scrollLeft > 8)
    setCanScrollNext(element.scrollLeft < maxScrollLeft - 8)
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    updateScrollState()
    const frame = window.requestAnimationFrame(updateScrollState)
    element.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      window.cancelAnimationFrame(frame)
      element.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [galleryImages.length, updateScrollState])

  const scrollGallery = (direction: -1 | 1) => {
    const element = scrollRef.current
    if (!element) return

    const scrollDistance = Math.max(320, Math.min(660, element.clientWidth * 0.78))
    element.scrollBy({
      left: direction * scrollDistance,
      behavior: 'smooth',
    })
  }

  if (!primary) {
    return (
      <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-mist-green">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl">
          &#128205;
        </div>
      </div>
    )
  }

  if (galleryImages.length === 1) {
    return (
      <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-mist-green">
        <ResponsiveListingImage
          src={primary.url}
          alt={primary.alt}
          priority
          sizes="(max-width: 1180px) 100vw, 72rem"
        />
      </div>
    )
  }

  return (
    <div className="-mx-4 md:mx-0">
      <div className="relative">
        <div
          ref={scrollRef}
          aria-label={`${listingName} photo gallery`}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 pb-2 md:px-0"
        >
          {galleryImages.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className={[
                'relative shrink-0 snap-start overflow-hidden rounded-lg bg-mist-green',
                index === 0
                  ? 'h-[300px] w-[84vw] sm:h-[360px] md:h-[420px] md:w-[58%] lg:w-[660px]'
                  : 'h-[300px] w-[72vw] sm:h-[360px] sm:w-[360px] md:h-[420px] md:w-[340px]',
              ].join(' ')}
            >
              <ResponsiveListingImage
                src={image.url}
                alt={image.alt || `${listingName} photo ${index + 1}`}
                priority={index === 0}
                sizes={index === 0 ? '(max-width: 768px) 84vw, 660px' : '(max-width: 640px) 72vw, 360px'}
              />
              {index === 0 && galleryImages.length > 1 ? (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                  {galleryImages.length} photos
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {hasScrollableOverflow ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-3 md:flex">
            <button
              type="button"
              aria-label="Previous photo"
              title="Previous photo"
              disabled={!canScrollPrevious}
              onClick={() => scrollGallery(-1)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/95 text-2xl font-bold leading-none text-forest-green shadow-lg transition hover:bg-mist-green disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">&larr;</span>
            </button>
            <button
              type="button"
              aria-label="Next photo"
              title="Next photo"
              disabled={!canScrollNext}
              onClick={() => scrollGallery(1)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/95 text-2xl font-bold leading-none text-forest-green shadow-lg transition hover:bg-mist-green disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
