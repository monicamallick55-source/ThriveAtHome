import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import SiteNav from '@/components/shared/SiteNav'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: false,
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-mono',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'ThriveAtHome',
  description: 'AI-powered senior care coordination for families.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} min-h-full flex flex-col antialiased`}
      >
        <SiteNav />
        {children}
      </body>
    </html>
  )
}