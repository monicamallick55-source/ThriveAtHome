import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getAAAForAdmin, getServiceUnitsForAAA, getClientAssessmentsForAAA, getAAAStats } from '@/lib/data/aaa'
import AAAAdminPortal from '@/components/aaa/AAAAdminPortal'

export const metadata: Metadata = { title: 'Area Agency on Aging — ThriveAtHome' }

export default async function AAAAdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)

  if (role !== 'aaa_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: aaa, error: aaaError } = await getAAAForAdmin(user.id)

  if (aaaError || !aaa) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏛️</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Area Agency on Aging Portal
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
              Your account is not yet linked to an Area Agency on Aging. Contact ThriveAtHome to set up your AAA account.
            </p>
            <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              In Supabase, set <strong>aaa_id</strong> on your <strong>family_members</strong> row to the UUID of your AAA to activate this portal.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const fiscalYear = new Date().getMonth() + 1 >= aaa.fiscal_year_start ? currentYear : currentYear - 1

  const [unitsRes, assessmentsRes, statsRes] = await Promise.all([
    getServiceUnitsForAAA(aaa.id, fiscalYear, 200),
    getClientAssessmentsForAAA(aaa.id),
    getAAAStats(aaa),
  ])

  return (
    <AAAAdminPortal
      aaa={aaa}
      initialUnits={unitsRes.data ?? []}
      initialAssessments={assessmentsRes.data ?? []}
      stats={statsRes.data}
    />
  )
}
