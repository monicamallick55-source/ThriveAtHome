import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth, getUserRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { MaReportSection } from '@/components/admin/MaReportSection'

export const metadata: Metadata = { title: 'Outcomes Dashboard — Admin' }

async function getAdminOutcomesData() {
  try {
    const admin = createAdminClient()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalMembers },
      { count: activeMembers },
      { count: callsThisMonth },
      { count: completedCallsThisMonth },
      { count: alertsThisWeek },
      { count: resolvedAlertsThisWeek },
      { count: totalVolunteers },
      { count: visitsThisMonth },
      { data: employers },
    ] = await Promise.all([
      admin.from('members').select('*', { count: 'exact', head: true }),
      admin.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('check_in_calls').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      admin.from('check_in_calls').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', thirtyDaysAgo),
      admin.from('notifications').select('*', { count: 'exact', head: true }).eq('severity', 'high').gte('created_at', sevenDaysAgo),
      admin.from('notifications').select('*', { count: 'exact', head: true }).eq('severity', 'high').eq('read', true).gte('created_at', sevenDaysAgo),
      admin.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('volunteer_visits').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      admin.from('employer_accounts').select('id, company_name, seats_purchased, seats_used, status').eq('status', 'active').order('company_name'),
    ])

    const callCompletionRate = (callsThisMonth ?? 0) > 0
      ? Math.round(((completedCallsThisMonth ?? 0) / (callsThisMonth ?? 1)) * 100)
      : 0

    const alertResolutionRate = (alertsThisWeek ?? 0) > 0
      ? Math.round(((resolvedAlertsThisWeek ?? 0) / (alertsThisWeek ?? 1)) * 100)
      : 0

    return {
      totalMembers: totalMembers ?? 0,
      activeMembers: activeMembers ?? 0,
      callCompletionRate,
      alertsThisWeek: alertsThisWeek ?? 0,
      alertResolutionRate,
      totalVolunteers: totalVolunteers ?? 0,
      visitsThisMonth: visitsThisMonth ?? 0,
      employers: employers ?? [],
    }
  } catch {
    return {
      totalMembers: 0,
      activeMembers: 0,
      callCompletionRate: 0,
      alertsThisWeek: 0,
      alertResolutionRate: 0,
      totalVolunteers: 0,
      visitsThisMonth: 0,
      employers: [],
    }
  }
}

export default async function AdminOutcomesPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const d = await getAdminOutcomesData()

  const platformMetrics = [
    { label: 'Total members', value: d.totalMembers.toLocaleString(), sub: `${d.activeMembers} active`, color: '#1e40af', bg: '#eff6ff', icon: '👥' },
    { label: 'Call completion rate (30d)', value: `${d.callCompletionRate}%`, sub: 'Aria morning catch-ups', color: '#065f46', bg: '#f0fdf4', icon: '📞' },
    { label: 'High-priority alerts (7d)', value: d.alertsThisWeek.toLocaleString(), sub: `${d.alertResolutionRate}% resolved`, color: '#9f1239', bg: '#fff1f2', icon: '🔔' },
    { label: 'Active volunteers', value: d.totalVolunteers.toLocaleString(), sub: 'Background-checked', color: '#92400e', bg: '#fefce8', icon: '🙋' },
    { label: 'Volunteer visits (30d)', value: d.visitsThisMonth.toLocaleString(), sub: 'Logged and verified', color: '#6b21a8', bg: '#faf5ff', icon: '🤝' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>← Admin</Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>Outcomes Dashboard</span>
        </div>
      </nav>

      <header style={{ backgroundColor: 'var(--color-navy)', padding: '24px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '8px' }}>Outcomes Dashboard</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.7)', margin: '0' }}>
            Platform-wide metrics and per-employer reporting. Date range filtering available in the API.
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '40px 32px', width: '100%' }}>

        {/* Platform metrics */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Platform Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {platformMetrics.map(m => (
              <div key={m.label} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--color-warm-grey)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 }}>{m.label}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: m.color, margin: '0 0 4px' }}>{m.value}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0' }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Per-employer breakdown */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: '0' }}>Employer Accounts</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0' }}>
              {d.employers.length} active employer{d.employers.length !== 1 ? 's' : ''}
            </p>
          </div>

          {d.employers.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '40px', textAlign: 'center', border: '1px solid var(--color-warm-grey)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>No employer accounts yet.</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0' }}>
                Employer partners are enrolled via the <Link href="/employers" style={{ color: 'var(--color-navy)' }}>employers page</Link>.
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warm-grey)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Company', 'Seats purchased', 'Seats used', 'Utilisation', 'Status'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.employers.map((emp: { id: string; company_name: string; seats_purchased: number; seats_used: number; status: string }, i: number) => {
                    const utilPct = emp.seats_purchased > 0 ? Math.round((emp.seats_used / emp.seats_purchased) * 100) : 0
                    return (
                      <tr key={emp.id} style={{ borderBottom: i < d.employers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>{emp.company_name}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)' }}>{emp.seats_purchased}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)' }}>{emp.seats_used}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', maxWidth: '80px' }}>
                              <div style={{ height: '6px', backgroundColor: utilPct > 80 ? '#059669' : utilPct > 40 ? '#d97706' : '#6b7280', borderRadius: '3px', width: `${Math.min(utilPct, 100)}%` }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', minWidth: '36px' }}>{utilPct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: '#065f46', backgroundColor: '#d1fae5', borderRadius: '4px', padding: '2px 8px' }}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* API access note */}
        <section style={{ marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: '#065f46', margin: '0 0 8px' }}>
              📊 Enterprise Reporting API
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065f46', margin: '0 0 12px', lineHeight: 1.6 }}>
              Medicare Advantage and enterprise partners can access cohort-level outcomes via{' '}
              <code style={{ backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontSize: '13px' }}>GET /api/enterprise/outcomes</code>.
              Cohorts fewer than 10 members are suppressed. API access is logged and rate-limited.
            </p>
          </div>
        </section>

        {/* MA Report Generator */}
        <section>
          <MaReportSection />
        </section>

      </main>
    </div>
  )
}
