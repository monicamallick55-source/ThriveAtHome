import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getUnreadCount } from '@/lib/data/member-messages'
import { DashNavClient } from '@/components/dashboard/DashNavClient'
import QuinnWidget from '@/components/shared/QuinnWidget'

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
    ? fm.full_name?.split(' ')[0] || 'Member'
    : 'Member'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg, #fafaf8)' }}>
      <DashNavClient seniorName={seniorName} unreadMessages={unreadMessages} />
      <main style={{ paddingBottom: '80px' }}>{children}</main>
      {/* Quinn chat + support — available on every dashboard page */}
      <QuinnWidget variant="teal" iconOnly />
      <a
        href="/dashboard/support"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '16px',
          zIndex: 39,
          backgroundColor: 'var(--color-navy)',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 600,
          padding: '6px 12px',
          borderRadius: '20px',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        Get Support
      </a>
    </div>
  )
}