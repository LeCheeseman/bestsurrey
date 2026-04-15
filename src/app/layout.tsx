import type { Metadata } from 'next'
import { Cinzel, Poppins } from 'next/font/google'
import Script from 'next/script'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/schema/organization'
import './globals.css'

// Brand typography — see BestSurrey_BrandBook_v3
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-poppins',
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
    <html lang="en-GB" className={`${cinzel.variable} ${poppins.variable}`}>
      <body className="font-body bg-white text-gray-900 antialiased">
        {children}

        {/* Sitewide JSON-LD — Organization + WebSite */}
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  )
}
