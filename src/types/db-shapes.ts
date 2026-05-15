/**
 * JSONB field shapes — used by the Drizzle schema to type jsonb columns.
 *
 * Kept separate from types/index.ts to avoid a circular dependency:
 *   schema.ts imports from db-shapes.ts
 *   types/index.ts imports InferSelectModel from schema.ts
 */

export interface ListingImage {
  url: string
  alt: string
  caption?: string
  isPrimary: boolean
  sourceUrl?: string
  sourceType?: string
  byteSize?: number
  contentType?: string
}

export interface OpeningHoursDay {
  open: string   // 'HH:MM' 24-hour
  close: string  // 'HH:MM' 24-hour
  closed?: never
}

export interface ClosedDay {
  closed: true
  open?: never
  close?: never
}

export type OpeningHoursDayValue = OpeningHoursDay | ClosedDay | null

export interface OpeningHours {
  monday:    OpeningHoursDayValue
  tuesday:   OpeningHoursDayValue
  wednesday: OpeningHoursDayValue
  thursday:  OpeningHoursDayValue
  friday:    OpeningHoursDayValue
  saturday:  OpeningHoursDayValue
  sunday:    OpeningHoursDayValue
}

export interface FaqItem {
  question: string
  answer: string
}

export interface RoundupBodyBlock {
  type: 'text' | 'heading'
  content: string
}
