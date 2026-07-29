'use client'

import { useEffect, useState } from 'react'
import type { OpeningHours } from '@/types'

interface OpeningHoursTableProps {
  hours: OpeningHours
}

const DAY_LABELS: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: 'monday',    label: 'Monday'    },
  { key: 'tuesday',   label: 'Tuesday'   },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday'  },
  { key: 'friday',    label: 'Friday'    },
  { key: 'saturday',  label: 'Saturday'  },
  { key: 'sunday',    label: 'Sunday'    },
]

function currentSurreyWeekday() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    timeZone: 'Europe/London',
  }).format(new Date()).toLowerCase() as keyof OpeningHours
}

export function OpeningHoursTable({ hours }: OpeningHoursTableProps) {
  const [today, setToday] = useState<keyof OpeningHours | null>(null)

  useEffect(() => {
    const updateToday = () => setToday(currentSurreyWeekday())

    updateToday()
    const interval = window.setInterval(updateToday, 60 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <dl className="space-y-1 text-sm font-body">
      {DAY_LABELS.map(({ key, label }) => {
        const day = hours[key]
        const isToday = key === today

        return (
          <div
            key={key}
            className={`flex justify-between py-1 px-2 rounded ${isToday ? 'bg-mist-green font-medium' : ''}`}
          >
            <dt className={isToday ? 'text-forest-green' : 'text-gray-600'}>{label}</dt>
            <dd className={isToday ? 'text-forest-green' : 'text-gray-800'}>
              {!day
                ? <span className="text-gray-400">—</span>
                : 'closed' in day && day.closed
                ? <span className="text-gray-400">Closed</span>
                : 'open' in day && day.open
                ? `${day.open} – ${day.close}`
                : <span className="text-gray-400">—</span>
              }
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
