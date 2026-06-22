'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: string
  full_name: string
  email: string
  created_at: string
  member_id: string | null
}

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string
  accepted_at: string | null
}

interface Stats {
  seats_used: number
  seats_purchased: number
  check_in_count_30d: number
  open_alerts: number
  pepm_price_cents: number
  billing_cycle: string
}

interface VolunteerSummary {
  volunteer_id: string
  volunteer_name: string
  volunteer_email: string
  total_hours: number
  verified_hours: number
  last_logged_date: string | null
  export_status_counts: Record<string, number>
}

interface CorpProgram {
  id: string
  program_name: string
  matching_rate_per_hour: number
  annual_hour_cap_per_employee: number | null
  tier: string
}

interface CorpProgramData {
  program: CorpProgram | null
  summaries: VolunteerSummary[]
  totals: { totalHours: number; totalMatchedValue: number; volunteerCount: number }
}

interface Account {
  company_name: string
  contact_name: string
  contact_email: string
  plan_tier: string
  status: string
  billing_start_date: string | null
}

interface Props {
  account: Account
  employees: Employee[]
  invitations: Invitation[]
  stats: Stats
  adminName: string
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7268' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function EmployerDashboardClient({ account, employees, invitations: initialInvitations, stats, adminName }: Props) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [corpProgram, setCorpProgram] = useState<CorpProgramData | null>(null)
  const [corpLoading, setCorpLoading] = useState(true)
  const [exportingBenevity, setExportingBenevity] = useState(false)
  const [exportingYourCause, setExportingYourCause] = useState(false)

  useEffect(() => {
    fetch('/api/employer-admin/volunteer-program')
      .then(r => r.ok ? r.json() : null)
      .then((d: CorpProgramData | null) => { if (d) setCorpProgram(d) })
      .catch(() => {})
      .finally(() => setCorpLoading(false))
  }, [])

  async function handleExport(format: 'benevity' | 'yourcause') {
    const setter = format === 'benevity' ? setExportingBenevity : setExportingYourCause
    setter(true)
    try {
      const res = await fetch(`/api/employer-admin/volunteer-program?export=${format}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `volunteer-hours-${format}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
    finally { setter(false) }
  }

  const monthlyBill = Math.round((stats.pepm_price_cents / 100) * stats.seats_purchased)
  const tierLabel = account.plan_tier === 'professional' ? 'Professional' : account.plan_tier === 'enterprise' ? 'Enterprise' : 'Essentials'
  const utilizationPct = stats.seats_purchased > 0
    ? Math.round((stats.seats_used / stats.seats_purchased) * 100)
    : 0

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      const res = await fetch('/api/employer-admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error ?? 'Failed to send invitation')
        return
      }
      setInviteSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      // Optimistically add pending invitation
      setInvitations((prev) => [
        {
          id: data.invitation_id,
          email: inviteEmail,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        ...prev,
      ])
    } catch {
      setInviteError('Network error — please try again')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>
          ThriveAtHome
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.7)' }}>
            {account.company_name}
          </span>
          <a href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.7)', textDecoration: 'none' }}>
            Sign out
          </a>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Employer Admin Portal
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#7A7268', margin: 0 }}>
            Welcome, {adminName} — {account.company_name} · {tierLabel} Plan
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <StatCard
            label="Seats"
            value={`${stats.seats_used} / ${stats.seats_purchased}`}
            sub={`${utilizationPct}% utilisation`}
          />
          <StatCard
            label="Check-ins (30 days)"
            value={stats.check_in_count_30d}
            sub="Completed calls to enrolled seniors"
          />
          <StatCard
            label="Open alerts"
            value={stats.open_alerts}
            sub={stats.open_alerts === 0 ? 'All clear' : 'Unacknowledged alerts'}
          />
          <StatCard
            label="Monthly cost"
            value={`$${monthlyBill}`}
            sub={`$${(stats.pepm_price_cents / 100).toFixed(2)} PEPM · ${stats.billing_cycle}`}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Invite employee */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px' }}>
              Invite an employee
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: '0 0 20px', lineHeight: 1.6 }}>
              They'll receive a personalised link to create their account and enrol their loved one.
            </p>
            <form onSubmit={handleInvite}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com"
                  style={{ flex: 1, padding: '11px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={inviting}
                  style={{ padding: '11px 18px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'white', backgroundColor: inviting ? '#8A9BB5' : 'var(--color-navy)', border: 'none', borderRadius: '8px', cursor: inviting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                >
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
            {inviteSuccess && (
              <p style={{ marginTop: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#166534', backgroundColor: '#DCFCE7', padding: '10px 14px', borderRadius: '6px' }}>
                {inviteSuccess}
              </p>
            )}
            {inviteError && (
              <p style={{ marginTop: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#78350F', backgroundColor: '#FEF3C7', padding: '10px 14px', borderRadius: '6px' }}>
                {inviteError}
              </p>
            )}

            {/* Recent invitations */}
            {invitations.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7268', margin: '0 0 12px' }}>
                  Recent invitations
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {invitations.slice(0, 8).map((inv) => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F9F8F5', borderRadius: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>{inv.email}</span>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                        backgroundColor: inv.status === 'accepted' ? '#DCFCE7' : inv.status === 'expired' ? '#F1F5F9' : '#FEF9C3',
                        color: inv.status === 'accepted' ? '#166534' : inv.status === 'expired' ? '#64748B' : '#713F12',
                      }}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enrolled employees */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px' }}>
              Enrolled employees
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: '0 0 20px', lineHeight: 1.6 }}>
              Employees who have created accounts and enrolled their loved one.
            </p>
            {employees.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#7A7268', fontStyle: 'italic' }}>
                No employees enrolled yet. Send invitations to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {employees.map((emp) => (
                  <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F9F8F5', borderRadius: '8px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                        {emp.full_name}
                      </p>
                      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '13px', color: '#7A7268' }}>
                        {emp.email}
                      </p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: emp.member_id ? '#166534' : '#7A7268', backgroundColor: emp.member_id ? '#DCFCE7' : '#F1F5F9', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>
                      {emp.member_id ? 'enrolled' : 'account only'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Corporate Volunteer Program */}
        <div style={{ marginTop: '32px', backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>
                Corporate Volunteer Program
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: 0 }}>
                Employees volunteer with seniors and your company matches their hours as a cash donation.
              </p>
            </div>
            {corpProgram?.program && (
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                  onClick={() => handleExport('benevity')}
                  disabled={exportingBenevity}
                  style={{ padding: '9px 16px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', backgroundColor: '#E8EFF8', border: 'none', borderRadius: '8px', cursor: exportingBenevity ? 'not-allowed' : 'pointer' }}
                >
                  {exportingBenevity ? 'Exporting…' : '↓ Export for Benevity'}
                </button>
                <button
                  onClick={() => handleExport('yourcause')}
                  disabled={exportingYourCause}
                  style={{ padding: '9px 16px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', backgroundColor: '#E8EFF8', border: 'none', borderRadius: '8px', cursor: exportingYourCause ? 'not-allowed' : 'pointer' }}
                >
                  {exportingYourCause ? 'Exporting…' : '↓ Export for YourCause'}
                </button>
              </div>
            )}
          </div>

          {corpLoading ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#7A7268', fontStyle: 'italic' }}>Loading programme data…</p>
          ) : !corpProgram?.program ? (
            <div style={{ backgroundColor: '#F9F8F5', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#7A7268', marginBottom: '12px' }}>
                No Corporate Volunteer Program configured yet.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: 0 }}>
                Contact your ThriveAtHome account manager to add a volunteer matching program — available as a standalone benefit or bundled with your employee subscription.
              </p>
            </div>
          ) : (
            <>
              {/* Programme summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Active volunteers', value: corpProgram.totals.volunteerCount },
                  { label: 'Total hours logged', value: `${corpProgram.totals.totalHours.toFixed(1)} hrs` },
                  { label: 'Estimated match value', value: `$${corpProgram.totals.totalMatchedValue.toFixed(0)}` },
                  { label: 'Match rate', value: `$${corpProgram.program.matching_rate_per_hour}/hr` },
                  { label: 'Annual cap / employee', value: corpProgram.program.annual_hour_cap_per_employee ? `${corpProgram.program.annual_hour_cap_per_employee} hrs` : 'None' },
                  { label: 'Programme tier', value: corpProgram.program.tier.replace(/_/g, ' ') },
                ].map(({ label, value }) => (
                  <div key={label} style={{ backgroundColor: '#F9F8F5', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7268' }}>{label}</p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Volunteer roster */}
              {corpProgram.summaries.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#7A7268', fontStyle: 'italic' }}>
                  No volunteer hours logged yet. Employees can sign up to volunteer at <a href="/volunteer/apply" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-navy)' }}>/volunteer/apply</a>.
                </p>
              ) : (
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7268', margin: '0 0 12px' }}>
                    Employee volunteers
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-warm-grey)' }}>
                          {['Name', 'Email', 'Hours logged', 'Hours remaining', 'Last activity', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#7A7268', fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {corpProgram.summaries.map((s) => {
                          const cap = corpProgram.program!.annual_hour_cap_per_employee
                          const remaining = cap ? Math.max(0, cap - s.total_hours) : null
                          const pctUsed = cap ? Math.min(100, Math.round((s.total_hours / cap) * 100)) : null
                          return (
                            <tr key={s.volunteer_id} style={{ borderBottom: '1px solid #F1EDE8' }}>
                              <td style={{ padding: '12px 12px', color: 'var(--color-navy)', fontWeight: 500 }}>{s.volunteer_name}</td>
                              <td style={{ padding: '12px 12px', color: '#7A7268' }}>{s.volunteer_email}</td>
                              <td style={{ padding: '12px 12px', color: 'var(--color-navy)' }}>
                                {s.total_hours.toFixed(1)} hrs
                                {cap && (
                                  <div style={{ marginTop: '4px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', width: '80px' }}>
                                    <div style={{ height: '100%', borderRadius: '2px', backgroundColor: pctUsed! >= 90 ? '#DC2626' : 'var(--color-teal)', width: `${pctUsed}%` }} />
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px 12px', color: remaining === 0 ? '#DC2626' : 'var(--color-navy)' }}>
                                {remaining !== null ? `${remaining} hrs` : '—'}
                              </td>
                              <td style={{ padding: '12px 12px', color: '#7A7268' }}>{s.last_logged_date ?? '—'}</td>
                              <td style={{ padding: '12px 12px' }}>
                                <span style={{
                                  padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                  backgroundColor: s.verified_hours > 0 ? '#DCFCE7' : '#FEF9C3',
                                  color: s.verified_hours > 0 ? '#166534' : '#713F12',
                                }}>
                                  {s.verified_hours > 0 ? `${s.verified_hours.toFixed(1)} verified` : 'pending'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Plan details */}
        <div style={{ marginTop: '32px', backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 20px' }}>
            Plan details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Plan tier', value: tierLabel },
              { label: 'Billing', value: `${stats.billing_cycle}` },
              { label: 'Price per employee/mo', value: `$${(stats.pepm_price_cents / 100).toFixed(2)}` },
              { label: 'Seats purchased', value: `${stats.seats_purchased}` },
              { label: 'Contact', value: account.contact_name },
              { label: 'Status', value: account.status },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7268' }}>
                  {label}
                </p>
                <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)', fontWeight: 500 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268' }}>
            To update your plan or seats, contact your ThriveAtHome account manager.
          </p>
        </div>
      </main>
    </div>
  )
}
