// Member Self-Service Portal — seniors can log in directly via members.supabase_auth_id.
// Also accessible by family members who want to see their senior's view.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser, getMemberByDirectAuth } from '@/lib/data/members'
import { getUpcomingServiceBookings } from '@/lib/data/services'
import { getUpcomingTrackedItems, ensureBirthdayTrackedItem } from '@/lib/data/tracked-items'
import MemberPortalClient from '@/components/MemberPortalClient'

export const metadata: Metadata = { title: 'My Portal — ThriveAtHome' }

export default async function MemberPortalPage() {
  const user = await requireAuth()

  // Try direct member auth first (senior logged in with their own account)
  let memberRes = await getMemberByDirectAuth(user.id)

  // If not a direct member login, try via family_members linkage
  if (!memberRes.data) {
    memberRes = await getMemberForAuthUser(user.id)
  }

  const { data: member, error } = memberRes

  if (!member || error) {
    // No member found — direct them to set up or onboard
    redirect('/onboarding')
  }

  await ensureBirthdayTrackedItem(member.id, member.date_of_birth)

  const [servicesRes, trackedRes] = await Promise.all([
    getUpcomingServiceBookings(member.id),
    getUpcomingTrackedItems(member.id),
  ])

  return (
    <MemberPortalClient
      member={member}
      upcomingServices={servicesRes.data ?? []}
      trackedItems={trackedRes.data ?? []}
    />
  )
}
