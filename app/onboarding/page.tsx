// Onboarding page — 3-step enrollment form built in Phase 6.
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Set Up Profile — ThriveAtHome' }

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1B3A6B' }}>Set Up Your Profile</h1>
        <p className="text-lg" style={{ color: '#6b7280' }}>This feature is coming soon.</p>
      </div>
    </div>
  )
}
