import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import EmployerDashboardClient from '@/components/employer/EmployerDashboardClient'

export const metadata: Metadata = { title: 'Employer Admin — ThriveAtHome' }

export default async function EmployerAdminPage() {
  const user = await requireAuth()

  const role = await getUserRole(user.id)
  if (role !== 'employer_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  const { data: adminRow } = await admin
    .from('family_members')
    .select('full_name, employer_account_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const adminName = adminRow?.full_name ?? user.email ?? 'Admin'
  const employerId = adminRow?.employer_account_id ?? null

  if (!employerId) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏢</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Employer Admin Portal
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
              Your account is not yet linked to an employer. Contact ThriveAtHome to set up your company account.
            </p>
            <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              In Supabase, set <strong>employer_account_id</strong> on your <strong>family_members</strong> row to activate this portal.
            </p>
          </div>
        </main>
      </div>
    )
  }

  type EmployerAccountRow = {
    company_name: string
    contact_name: string
    contact_email: string
    plan_tier: string
    status: string
    billing_start_date: string | null
    seats_purchased: number
    seats_used: number
    pepm_price_cents: number
    billing_cycle: string
  }

  const [accountRes, employeesRes, invitationsRes] = await Promise.all([
    admin
      .from('employer_accounts')
      .select('company_name, contact_name, contact_email, plan_tier, status, billing_start_date, seats_purchased, seats_used, pepm_price_cents, billing_cycle')
      .eq('id', employerId)
      .maybeSingle() as unknown as Promise<{ data: EmployerAccountRow | null; error: unknown }>,

    admin
      .from('family_members')
      .select('id, full_name, email, created_at, member_id')
      .eq('employer_account_id', employerId)
      .eq('role', 'family')
      .order('created_at', { ascending: false }),

    admin
      .from('employer_invitations')
      .select('id, email, status, created_at, expires_at, accepted_at')
      .eq('employer_account_id', employerId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!accountRes.data) {
    redirect('/dashboard')
  }

  const employees = employeesRes.data ?? []
  const seatsUsed = employees.length
  const memberIds = employees.map((e) => e.member_id).filter(Boolean) as string[]

  let checkInCount = 0
  let alertCount = 0

  if (memberIds.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [callsRes, alertsRes] = await Promise.all([
      admin
        .from('check_in_calls')
        .select('id', { count: 'exact', head: true })
        .in('member_id', memberIds)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo),
      admin
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .in('member_id', memberIds)
        .eq('acknowledged', false),
    ])
    checkInCount = callsRes.count ?? 0
    alertCount = alertsRes.count ?? 0
  }

  const account = accountRes.data

  return (
    <EmployerDashboardClient
      account={{
        company_name: account.company_name,
        contact_name: account.contact_name,
        contact_email: account.contact_email,
        plan_tier: account.plan_tier,
        status: account.status,
        billing_start_date: account.billing_start_date ?? null,
      }}
      employees={employees}
      invitations={invitationsRes.data ?? []}
      stats={{
        seats_used: seatsUsed,
        seats_purchased: account.seats_purchased,
        check_in_count_30d: checkInCount,
        open_alerts: alertCount,
        pepm_price_cents: account.pepm_price_cents ?? 1500,
        billing_cycle: account.billing_cycle ?? 'monthly',
      }}
      adminName={adminName}
    />
  )
}
