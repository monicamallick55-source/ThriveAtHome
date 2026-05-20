import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-mono',
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
        {children}
      </body>
    </html>
  )
}
