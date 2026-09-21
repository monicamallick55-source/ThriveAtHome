// Member Self-Service Portal — seniors can log in directly via members.supabase_auth_id.
// Also accessible by family members who want to see their senior's view.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser, getMemberByDirectAuth } from '@/lib/data/members'
import { getUpcomingServiceBookings } from '@/lib/data/services'
import { getUpcomingTrackedItems, getSuggestedDates } from '@/lib/data/tracked-items'
import { getAddonCatalog, getMemberAddons, getEffectiveFamilySeatLimit, hasActiveAddon, getVideoDiaryEntries } from '@/lib/data/premium-addons'
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

  const [servicesRes, trackedRes, addonCatalogRes, memberAddonsRes, familySeatLimit, hasLongDistance] = await Promise.all([
    getUpcomingServiceBookings(member.id),
    getUpcomingTrackedItems(member.id),
    getAddonCatalog(),
    getMemberAddons(member.id),
    getEffectiveFamilySeatLimit(member.id),
    hasActiveAddon(member.id, 'long_distance_caregiver'),
  ])

  const { data: videoDiary } = hasLongDistance
    ? await getVideoDiaryEntries(member.id)
    : { data: [] }

  const suggestedDates = getSuggestedDates(member.date_of_birth, trackedRes.data ?? [])

  return (
    <MemberPortalClient
      member={member}
      upcomingServices={servicesRes.data ?? []}
      trackedItems={trackedRes.data ?? []}
      suggestedDates={suggestedDates}
      addonCatalog={addonCatalogRes.data}
      memberAddons={memberAddonsRes.data}
      familySeatLimit={familySeatLimit}
      hasLongDistanceAddon={hasLongDistance}
      initialVideoDiary={videoDiary ?? []}
    />
  )
}
