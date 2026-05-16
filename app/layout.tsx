// Root layout for Thrive@Home.
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Thrive@Home',
  description: 'AI-powered senior care coordination for families.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
