import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCareWorkerByAuthId, getTodaysVisitsForWorker } from '@/lib/data/agencies'
import CareWorkerDashboardClient from '@/components/agency/CareWorkerDashboardClient'

export const metadata: Metadata = { title: 'Care Worker Dashboard — ThriveAtHome' }

export default async function CareWorkerDashboardPage() {
  const user = await requireAuth()
  const admin = createAdminClient()

  const { data: worker, error } = await getCareWorkerByAuthId(user.id)

  if (error || !worker) {
    // Also check family_members for admin access (allows admin to preview the page)
    const { data: fm } = await admin
      .from('family_members')
      .select('role')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    if (fm?.role !== 'admin') {
      redirect('/login')
    }
    // Admin preview — show empty state
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧑‍⚕️</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500 }}>Care Worker Portal</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Admin preview — no care worker account linked to this auth user.
          </p>
        </div>
      </div>
    )
  }

  const { data: todaysVisits } = await getTodaysVisitsForWorker(worker.id)

  return (
    <CareWorkerDashboardClient
      worker={worker}
      todaysVisits={todaysVisits ?? []}
    />
  )
}
