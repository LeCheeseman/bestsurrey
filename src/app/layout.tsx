import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/schema/organization'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bestsurrey.co.uk'),
  title: {
    default:  'Best Surrey — The Finest in the County',
    template: '%s | Best Surrey',
  },
  description:
    'The curated guide to the best restaurants, cafés, activities and things to do across Surrey.',
  openGraph: {
    siteName: 'Best Surrey',
    locale:   'en_GB',
    type:     'website',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema     = buildOrganizationSchema()
  const websiteSchema = buildWebSiteSchema()

  return (
    <html lang="en-GB" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-body bg-white text-gray-900 antialiased">
        {children}

        {/* Sitewide JSON-LD — Organization + WebSite (inline, server-rendered) */}
        <script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  )
}
