'use client'

import { useState } from 'react'
import type { FaqItem } from '@/types'

interface FaqSectionProps {
  items: FaqItem[]
}

export function FaqSection({ items }: FaqSectionProps) {
  const [open, setOpen] = useState<number | null>(null)

  if (!items || items.length === 0) return null

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left font-body text-sm font-medium text-gray-800 hover:bg-mist-green transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{item.question}</span>
            <span className="ml-4 text-forest-green text-lg leading-none" aria-hidden="true">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="px-4 py-3 text-sm text-gray-600 font-body border-t border-gray-100 bg-white">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
