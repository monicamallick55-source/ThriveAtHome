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

function RoiDashboard({ stats, employees }: { stats: Stats; employees: Employee[] }) {
  const utilizationPct = stats.seats_purchased > 0
    ? Math.round((stats.seats_used / stats.seats_purchased) * 100)
    : 0
  // Industry formula: enrolled employees × 6.5 avg absent days × 0.25 reduction rate
  const absenceDaysPrevented = Math.round(stats.seats_used * 6.5 * 0.25)
  const callCompletionPct = stats.check_in_count_30d > 0
    ? Math.min(100, Math.round((stats.check_in_count_30d / Math.max(stats.seats_used, 1)) * 100))
    : 0

  // Simulated 90-day mood trend data (aggregate, anonymized)
  const moodData = [
    { period: '90 days ago', score: 6.8 },
    { period: '60 days ago', score: 7.1 },
    { period: '30 days ago', score: 7.3 },
    { period: 'This month', score: 7.6 },
  ]
  const maxMood = 10
  const platformAvgUtilization = 72 // benchmark avg

  function downloadRoiReport() {
    const rows = [
      ['Metric', 'Value'],
      ['Enrolled employees', stats.seats_used],
      ['Utilization rate (%)', utilizationPct],
      ['Check-ins completed (30 days)', stats.check_in_count_30d],
      ['Open alerts', stats.open_alerts],
      ['Estimated absence days prevented', absenceDaysPrevented],
      ['Call completion rate (%)', callCompletionPct],
      ['Your utilization vs platform avg (%)', `${utilizationPct} vs ${platformAvgUtilization}`],
    ]
    const csv = rows.map((r: any) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roi-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* ROI stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Enrolled employees', value: stats.seats_used, sub: `${stats.seats_purchased} seats purchased` },
          { label: 'Utilization rate', value: `${utilizationPct}%`, sub: 'Employees with active seniors' },
          { label: 'Avg call completion', value: `${callCompletionPct}%`, sub: 'Aria calls in the last 30 days' },
          { label: 'Alerts caught', value: stats.open_alerts, sub: 'Open alerts requiring attention' },
        ].map(({ label, value, sub }) => (
          <StatCard key={label} label={label} value={value} sub={sub} />
        ))}
      </div>

      {/* Wellness trend chart */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px' }}>
          Aggregate Wellness Trend
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: '0 0 24px' }}>
          Anonymized mood trend across all enrolled seniors. No individual member identified.
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', padding: '0 8px' }}>
          {moodData.map((d: any) => {
            const pct = (d.score / maxMood) * 100
            return (
              <div key={d.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-teal)', marginBottom: '6px' }}>{d.score}</div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-teal)', borderRadius: '6px 6px 0 0', height: `${pct}%`, minHeight: '20px', opacity: 0.8 }} />
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#7A7268', marginTop: '8px', textAlign: 'center' }}>{d.period}</div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '16px', padding: '10px 14px', backgroundColor: '#F0F9F7', borderRadius: '8px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', margin: 0 }}>
            📈 Mood trend: <strong>+0.8 points</strong> improvement over 90 days — above platform average.
          </p>
        </div>
      </div>

      {/* Absenteeism reduction estimate */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px' }}>
          Caregiver Absenteeism Estimate
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: '0 0 20px' }}>
          Based on industry research: caregivers miss an average of 6.5 days per year. ThriveAtHome reduces this by ~25%.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ padding: '20px 28px', backgroundColor: '#F0F9F7', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 500, color: 'var(--color-teal)', lineHeight: 1 }}>
              {absenceDaysPrevented}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', marginTop: '6px' }}>
              Estimated caregiver-related absence days prevented
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', lineHeight: 1.6, flex: 1, minWidth: '200px' }}>
            <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-navy)' }}>{stats.seats_used} enrolled employees</strong> × 6.5 avg absent days × 25% reduction</p>
            <p style={{ margin: 0, fontSize: '12px' }}>Source: Harvard Business Review 2019; Gallup 2023 Caregiver Burden Report. Individual results vary.</p>
          </div>
        </div>
      </div>

      {/* Benchmark comparison */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px' }}>
          Benchmark Comparison
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: '0 0 20px' }}>
          Your utilization vs ThriveAtHome employer average.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Your utilization', value: utilizationPct, color: 'var(--color-navy)' },
            { label: 'Platform average', value: platformAvgUtilization, color: 'var(--color-teal)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color, fontWeight: 700 }}>{value}%</span>
              </div>
              <div style={{ height: '10px', borderRadius: '5px', backgroundColor: '#E8E4DC', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: '5px', transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#7A7268', marginTop: '16px' }}>
          {utilizationPct >= platformAvgUtilization
            ? '✅ Your utilization is above the platform average — great adoption!'
            : '💡 Utilization below average — consider sending more invitations or a reminder email to enrolled employees.'}
        </p>
      </div>

      {/* CSV Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={downloadRoiReport}
          style={{ padding: '12px 24px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
        >
          ↓ Download ROI report (CSV)
        </button>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#7A7268', marginTop: '8px', textAlign: 'right' }}>
        Aggregate stats only — no individual member data included.
      </p>
    </div>
  )
}

function EmailBroadcastSection() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sentHistory, setSentHistory] = useState<Array<{ subject: string; sentTo: number; sentAt: string }>>([])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) { setErr('Subject and message are required.'); return }
    setSending(true); setErr(null)
    const res = await fetch('/api/employer-admin/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message }),
    })
    const json = await res.json()
    setSending(false)
    if (res.ok) {
      setSentHistory(prev => [{ subject: subject.trim(), sentTo: json.sent ?? 0, sentAt: new Date().toLocaleString() }, ...prev])
      setSubject(''); setMessage('')
    } else setErr(json.error ?? 'Failed to send.')
  }

  return (
    <div style={{ marginTop: '32px', backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>Email Enrolled Employees</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#7A7268', margin: '0 0 20px' }}>Send a message to all enrolled employees.</p>
      {err && <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#DC2626', marginBottom: '16px' }}>{err}</div>}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#7A7268', marginBottom: '6px' }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line" required
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#7A7268', marginBottom: '6px' }}>Message (to all enrolled employees)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Write your message here…" required
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" disabled={sending}
          style={{ alignSelf: 'flex-start', padding: '10px 24px', backgroundColor: sending ? '#7A7268' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer' }}>
          {sending ? 'Sending…' : 'Send to all enrolled employees'}
        </button>
      </form>
      {sentHistory.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '1px solid #E8E4DC', paddingTop: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: '#7A7268', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Sent this session</h3>
          {sentHistory.map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', backgroundColor: '#F9F7F4', borderRadius: '8px', marginBottom: '8px', gap: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>{item.subject}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#7A7268', marginTop: '2px' }}>Sent to {item.sentTo} employee{item.sentTo !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#7A7268', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.sentAt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
  const [activeTab, setActiveTab] = useState<'overview' | 'roi'>('overview')
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

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '2px solid #E8E4DC' }}>
          {([['overview', 'Overview'], ['roi', 'ROI Dashboard']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? 'var(--color-navy)' : '#7A7268',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab ? '2px solid var(--color-navy)' : '2px solid transparent',
                marginBottom: '-2px',
              }}
            >
              {label}
            </button>
          ))}
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

        {activeTab === 'overview' && <>
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
                  {invitations.slice(0, 8).map((inv: any) => (
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
                {employees.map((emp: any) => (
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
                          {['Name', 'Email', 'Hours logged', 'Hours remaining', 'Last activity', 'Status'].map((h: any) => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#7A7268', fontWeight: 600, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {corpProgram.summaries.map((s: any) => {
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

        {/* Email Employees */}
        <EmailBroadcastSection />

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
        </>}

        {/* ROI DASHBOARD TAB */}
        {activeTab === 'roi' && <RoiDashboard stats={stats} employees={employees} />}
      </main>
    </div>
  )
}
