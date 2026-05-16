// Thrive@Home landing page.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Thrive@Home — Caring for the people who matter most',
  description: 'AI-powered senior care coordination that keeps families connected and loved ones safe.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      <header className="px-8 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" style={{ color: '#1B3A6B' }}>Thrive@Home</span>
        </div>
        <nav className="flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full font-medium transition-colors"
            style={{ color: '#1B3A6B', border: '2px solid #1B3A6B' }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-full font-medium text-white transition-colors"
            style={{ backgroundColor: '#2A9D8F' }}
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: '#1B3A6B' }}>
          Caring for the people<br />who matter most
        </h1>
        <p className="text-xl mb-10 max-w-2xl" style={{ color: '#2A9D8F' }}>
          AI-powered senior care coordination that keeps families connected,
          loved ones safe, and care teams informed — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-full text-xl font-semibold text-white"
            style={{ backgroundColor: '#2A9D8F', minHeight: '52px', display: 'flex', alignItems: 'center' }}
          >
            Start caring better
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-full text-xl font-semibold"
            style={{ color: '#1B3A6B', border: '2px solid #1B3A6B', minHeight: '52px', display: 'flex', alignItems: 'center' }}
          >
            Sign in
          </Link>
        </div>
      </main>

      <footer className="px-8 py-6 text-center" style={{ color: '#9ca3af' }}>
        <p>© 2025 Thrive@Home. All rights reserved.</p>
      </footer>
    </div>
  )
}
