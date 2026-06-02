'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

type AdminEditLinkProps = {
  slug: string
  label: string
  className: string
  children: ReactNode
}

export function AdminEditLink({ slug, label, className, children }: AdminEditLinkProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(document.cookie.split(';').some((cookie) => cookie.trim() === 'best_surrey_admin_ui=1'))
  }, [])

  if (!visible) return null

  return (
    <Link href={`/admin/listing-qa?listing=${slug}`} className={className} aria-label={label}>
      {children}
    </Link>
  )
}
