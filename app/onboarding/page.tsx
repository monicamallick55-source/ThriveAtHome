// Onboarding page — redirects already-enrolled family members to /dashboard.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export const metadata: Metadata = { title: 'Set Up Profile — ThriveAtHome' }

export default async function OnboardingPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (member) redirect('/dashboard')

  // A senior enrolling themselves has family_members.relationship === 'self'
  // (set at signup). The whole form then speaks in the first person.
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const isSelf = fm?.relationship === 'self'

  return <OnboardingForm isSelf={isSelf} />
}
