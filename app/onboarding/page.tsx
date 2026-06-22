// Onboarding page — redirects already-enrolled family members to /dashboard.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export const metadata: Metadata = { title: 'Set Up Profile — ThriveAtHome' }

export default async function OnboardingPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (member) redirect('/dashboard')
  return <OnboardingForm />
}
