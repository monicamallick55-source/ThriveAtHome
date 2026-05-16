// Placeholder for Life Story — built in M16.
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Life Story — Thrive@Home' }

export default function LifeStoryPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1B3A6B' }}>Life Story</h1>
        <p className="text-lg" style={{ color: '#6b7280' }}>This feature is coming soon.</p>
      </div>
    </div>
  )
}
