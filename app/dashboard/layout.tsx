import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getUnreadCount } from '@/lib/data/member-messages'
import { DashNavClient } from '@/components/dashboard/DashNavClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? null
  const { count: unreadMessages } = memberId
    ? await getUnreadCount(memberId)
    : { count: 0 }
  const seniorName = fm
    ? `${fm.first_name ?? ''} ${fm.last_name ?? ''}`.trim() || 'Member'
    : 'Member'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg, #fafaf8)' }}>
      <DashNavClient seniorName={seniorName} unreadMessages={unreadMessages} />
      <main style={{ paddingBottom: '80px' }}>{children}</main>
    </div>
  )
}