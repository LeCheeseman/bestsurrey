import Image from 'next/image'

interface ResponsiveListingImageProps {
  src: string
  alt: string
  priority?: boolean
  sizes: string
}

export function ResponsiveListingImage({
  src,
  alt,
  priority = false,
  sizes,
}: ResponsiveListingImageProps) {
  const canOptimize = isSupabaseStorageUrl(src) || src.startsWith('/')

  if (canOptimize) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
        priority={priority}
        sizes={sizes}
      />
    )
  }

  return (
    // Legacy official-site image URLs are rendered directly until they are
    // ingested into Supabase Storage.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
      sizes={sizes}
    />
  )
}

function isSupabaseStorageUrl(src: string) {
  try {
    const url = new URL(src)
    return url.hostname.endsWith('.supabase.co') &&
      url.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}
