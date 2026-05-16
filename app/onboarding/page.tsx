// Onboarding page — 3-step enrollment form that creates the senior's profile.
import type { Metadata } from 'next'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export const metadata: Metadata = { title: 'Set Up Profile — ThriveAtHome' }

export default function OnboardingPage() {
  return <OnboardingForm />
}
