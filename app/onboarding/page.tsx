'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

export const runtime = 'edge'

const QuinnOnboarding = dynamic(() => import('@/components/onboarding/QuinnOnboarding'), {
  ssr: false,
})

export default function OnboardingPage() {
  const router = useRouter()
  const [useVoice, setUseVoice] = useState<boolean | null>(null)

  if (useVoice === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-navy)' }}>
            Welcome to ThriveAtHome
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            How would you like to get started?
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setUseVoice(true)}
              className="w-full py-4 rounded-xl font-semibold text-lg"
              style={{ background: 'var(--color-navy)', color: 'var(--color-cream)' }}
            >
              🎙️ Talk with Aria (voice guided)
            </button>
            <button
              onClick={() => setUseVoice(false)}
              className="w-full py-4 rounded-xl font-semibold text-lg border-2"
              style={{ borderColor: 'var(--color-navy)', color: 'var(--color-navy)' }}
            >
              ✍️ Fill in a form instead
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (useVoice) {
    return (
      <QuinnOnboarding
        onComplete={(preferredName) => {
          router.push('/dashboard')
        }}
        onBack={() => setUseVoice(null)}
      />
    )
  }

  // Form fallback — redirect to step-1
  router.push('/onboarding/step-1')
  return null
}
