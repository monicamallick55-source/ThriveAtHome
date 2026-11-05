import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import SiteNav from '@/components/shared/SiteNav'


const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-mono',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: 'ThriveAtHome',
  description: 'AI-powered senior care coordination for families.',
  openGraph: {
    title: 'ThriveAtHome — Where Seniors Thrive Together',
    description: 'AI-powered senior care coordination for families.',
    type: 'website',
    siteName: 'ThriveAtHome',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThriveAtHome — Where Seniors Thrive Together',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${dmSans.variable} ${dmMono.variable} min-h-full flex flex-col antialiased`}
      >
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
