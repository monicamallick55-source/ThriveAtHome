import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getGriefSupportRequestsForMember } from '@/lib/data/grief'
import GriefSupportClient from '@/components/grief/GriefSupportClient'
import { ToastProvider } from '@/components/ui/Toast'
import CrisisResourceBar from '@/components/shared/CrisisResourceBar'

export const metadata: Metadata = { title: 'Grief & Transition Support — ThriveAtHome' }

export default async function GriefSupportPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)

  const memberName = member?.preferred_name ?? member?.full_name ?? 'your loved one'
  const memberId = member?.id ?? ''

  const { data: existingRequests } = memberId
    ? await getGriefSupportRequestsForMember(memberId)
    : { data: [] }

  return (
    <ToastProvider>
      <GriefSupportClient
        memberName={(memberName ?? []) as any}
        existingRequests={existingRequests ?? []}
      />
      <CrisisResourceBar surface="grief" />
    </ToastProvider>
  )
}
