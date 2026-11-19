import type { ReactNode } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { DashNavClient } from '@/components/dashboard/DashNavClient'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  const memberData = user ? await getMemberForAuthUser(user.id) : null
  const member = memberData?.data
  const seniorName = member?.preferred_name ?? member?.full_name?.split(' ')[0] ?? 'Member'

  return (
    <div className="dashboard-shell">
      <DashNavClient seniorName={seniorName} />
      <main id="main-content" style={{ padding: '1.5rem', paddingBottom: '80px' }}>
        {children}
      </main>
    </div>
  )
}
