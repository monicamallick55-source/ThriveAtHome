import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Thrive@Home — Live independently with confidence',
  description: 'AI-powered senior independence platform.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
