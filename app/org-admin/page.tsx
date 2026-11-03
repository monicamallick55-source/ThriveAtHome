'use client'
// app/org-admin/page.tsx — B2B Org Admin Dashboard
// Accessed directly at /org-admin or via subdomain [org].thriveathome.app (middleware rewrites)

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Users, TrendingUp, AlertCircle, Download, Upload,
  CheckCircle, Clock, XCircle, BarChart2, Package,
  UserPlus, Settings, ChevronDown, ChevronUp, Loader2
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrgMember {
  id: string
  full_name: string
  email: string
  plan_tier: string
  status: 'active' | 'paused' | 'cancelled'
  joined_at: string
  last_check_in: string | null
  mood_avg: number | null
}

interface OrgStats {
  total_members: number
  active_members: number
  paused_members: number
  avg_mood: number | null
  avg_call_completion: number | null
  alerts_this_week: number
  billing_tier: 'in_development' | 'established' | 'scale'
  monthly_cost: number
}

interface AddOn {
  id: string
  name: string
  status: 'active' | 'inactive'
  description: string
  usage?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function billingLabel(tier: string, memberCount: number): string {
  if (tier === 'in_development') return `$50/mo flat (≤60 members)`
  if (tier === 'established') {
    const cost = 75 + Math.max(0, memberCount - 60) * 1.25
    return `$${cost.toFixed(0)}/mo ($75 + $1.25×${memberCount} members)`
  }
  const cost = 250 + memberCount * 1.0
  return `$${cost.toFixed(0)}/mo ($250 + $1.00×${memberCount} members)`
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: '#e8f5e9', color: '#2d6a4f', label: 'Active' },
    paused:    { bg: '#fff8e1', color: '#b45309', label: 'Paused' },
    cancelled: { bg: '#fce4ec', color: '#c62828', label: 'Cancelled' },
  }
  const s = map[status] || map.active
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value, sub, icon: Icon, accent }:
  { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px',
      padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
      <div style={{ background: accent || '#e8f5e9', borderRadius: '10px', padding: '10px', flexShrink: 0 }}>
        <Icon size={20} color={accent ? '#fff' : '#2d6a4f'} />
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

function CsvImportPanel({ orgId }: { orgId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  async function handleImport() {
    if (!file) return
    setStatus('loading')
    const text = await file.text()
    const rows = text.split('\n').slice(1).filter(Boolean).map(r => {
      const [name, email] = r.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      return { name, email }
    }).filter(r => r.name && r.email)

    try {
      const res = await fetch('/api/b2b-signup/import-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, members: rows }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ background: '#f9fbf9', border: '1px dashed #b7d9c3', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Upload size={16} color="#2d6a4f" />
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>Import Members via CSV</span>
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        CSV format: <code style={{ background: '#e8f5e9', padding: '1px 6px', borderRadius: '4px' }}>Name, Email</code> — one member per row, header row ignored.
        Each member receives a SendGrid invite email.
      </p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ cursor: 'pointer', background: '#fff', border: '1px solid #c8e6c9',
          borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: '#2d6a4f', fontWeight: 600 }}>
          {file ? file.name : 'Choose CSV file'}
          <input type="file" accept=".csv" hidden onChange={e => { setFile(e.target.files?.[0] || null); setStatus('idle') }} />
        </label>
        <button
          onClick={handleImport}
          disabled={!file || status === 'loading'}
          style={{ background: file && status !== 'loading' ? '#2d6a4f' : '#b7d9c3',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: file ? 'pointer' : 'default' }}>
          {status === 'loading' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Import'}
        </button>
      </div>
      {status === 'done' && result && (
        <p style={{ marginTop: '10px', fontSize: '13px', color: '#2d6a4f', fontWeight: 600 }}>
          ✅ {result.imported} members imported, {result.skipped} skipped (already exist)
        </p>
      )}
      {status === 'error' && (
        <p style={{ marginTop: '10px', fontSize: '13px', color: '#c62828' }}>
          ❌ Import failed — check CSV format and try again
        </p>
      )}
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function OrgAdminContent() {
  const searchParams = useSearchParams()
  const orgIdParam = searchParams.get('org_id') || ''

  const [orgId, setOrgId] = useState(orgIdParam)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [orgName, setOrgName] = useState('')
  const [tab, setTab] = useState<'members' | 'analytics' | 'addons' | 'settings'>('members')

  const [members, setMembers] = useState<OrgMember[]>([])
  const [stats, setStats] = useState<OrgStats | null>(null)
  const [addons, setAddons] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'joined' | 'mood'>('joined')
  const [sortAsc, setSortAsc] = useState(false)

  // Auto-load if org_id in query (e.g. from subdomain middleware)
  useEffect(() => {
    if (orgIdParam) loadOrg(orgIdParam)
  }, [orgIdParam])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch(`/api/b2b-signup/org-login?email=${encodeURIComponent(loginEmail)}`)
      if (!res.ok) throw new Error('not found')
      const data = await res.json()
      setOrgId(data.org_id)
      setOrgName(data.org_name)
      await loadOrg(data.org_id)
    } catch {
      setLoginError('Organisation not found. Check your email address.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function loadOrg(id: string) {
    setLoading(true)
    try {
      const [mRes, sRes, aRes] = await Promise.all([
        fetch(`/api/org-admin/members?org_id=${id}`),
        fetch(`/api/org-admin/stats?org_id=${id}`),
        fetch(`/api/org-admin/addons?org_id=${id}`),
      ])
      if (mRes.ok) setMembers(await mRes.json())
      if (sRes.ok) {
        const s = await sRes.json()
        setStats(s)
        setOrgName(s.org_name || orgName)
      }
      if (aRes.ok) setAddons(await aRes.json())
    } finally {
      setLoading(false)
    }
  }

  async function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Plan', 'Status', 'Joined', 'Last Check-in', 'Avg Mood'],
      ...members.map(m => [
        m.full_name, m.email, m.plan_tier, m.status,
        new Date(m.joined_at).toLocaleDateString(),
        m.last_check_in ? new Date(m.last_check_in).toLocaleDateString() : '—',
        m.mood_avg != null ? m.mood_avg.toFixed(1) : '—',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${orgName || 'org'}-members-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!orgId) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏢</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
              Organisation Portal
            </h1>
            <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
              Enter your contact email to access your portal
            </p>
          </div>
          <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: '14px',
            padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>
              Contact Email
            </label>
            <input
              type="email" required value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              placeholder="admin@yourorg.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '15px',
                border: '1.5px solid #c8e6c9', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            {loginError && (
              <p style={{ color: '#c62828', fontSize: '13px', marginBottom: '12px' }}>{loginError}</p>
            )}
            <button type="submit" disabled={loginLoading}
              style={{ width: '100%', background: '#2d6a4f', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 700,
                cursor: loginLoading ? 'default' : 'pointer' }}>
              {loginLoading ? 'Looking up…' : 'Access my portal →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#888' }}>
            New organisation?{' '}
            <a href="/for-organizations/signup" style={{ color: '#2d6a4f', fontWeight: 600 }}>Enroll here</a>
          </p>
        </div>
      </div>
    )
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  const filtered = members
    .filter(m => !search || m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va: string | number, vb: string | number
      if (sortKey === 'name') { va = a.full_name; vb = b.full_name }
      else if (sortKey === 'mood') { va = a.mood_avg ?? -1; vb = b.mood_avg ?? -1 }
      else { va = a.joined_at; vb = b.joined_at }
      return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1)
    })

  const SortIcon = ({ k }: { k: string }) => sortKey === k
    ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#f7faf7' }}>
      {/* Header */}
      <div style={{ background: '#2d6a4f', padding: '16px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#a7d7b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ThriveAtHome — Organisation Portal
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
            {orgName || 'Your Organisation'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportCsv}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ padding: '20px 24px 0', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <StatTile label="Total Members" value={stats.total_members} icon={Users} />
          <StatTile label="Active Members" value={stats.active_members}
            sub={`${stats.total_members ? Math.round(stats.active_members / stats.total_members * 100) : 0}% of total`} icon={CheckCircle} />
          <StatTile label="Avg Mood Score" value={stats.avg_mood != null ? `${stats.avg_mood.toFixed(1)}/5` : '—'}
            sub="last 30 days" icon={TrendingUp} />
          <StatTile label="Alerts This Week" value={stats.alerts_this_week}
            accent={stats.alerts_this_week > 0 ? '#c62828' : undefined} icon={AlertCircle} />
          <StatTile label="Monthly Cost"
            value={`$${stats.monthly_cost}`}
            sub={billingLabel(stats.billing_tier, stats.active_members)}
            icon={BarChart2} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ padding: '20px 24px 0', display: 'flex', gap: '0', borderBottom: '2px solid #e8f0e9', marginTop: '20px' }}>
        {(['members', 'analytics', 'addons', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #2d6a4f' : '2px solid transparent',
              marginBottom: '-2px', padding: '10px 20px', fontSize: '14px', fontWeight: tab === t ? 700 : 400,
              color: tab === t ? '#2d6a4f' : '#888', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'addons' ? 'Add-Ons' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px' }}>

        {/* ── Members Tab ── */}
        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '8px',
                  border: '1.5px solid #c8e6c9', fontSize: '14px', outline: 'none' }} />
              <a href="/for-organizations/signup"
                style={{ background: '#2d6a4f', color: '#fff', borderRadius: '8px', padding: '9px 16px',
                  fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={14} /> Invite Member
              </a>
            </div>

            <CsvImportPanel orgId={orgId} />

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f0f7f1', borderBottom: '1px solid #e0ede2' }}>
                      {[
                        { label: 'Name', k: 'name' },
                        { label: 'Email', k: null },
                        { label: 'Plan', k: null },
                        { label: 'Status', k: null },
                        { label: 'Joined', k: 'joined' },
                        { label: 'Last Check-in', k: null },
                        { label: 'Avg Mood', k: 'mood' },
                      ].map(({ label, k }) => (
                        <th key={label}
                          onClick={() => { if (k) { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k as 'name'|'joined'|'mood'); setSortAsc(false) } } }}
                          style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#444',
                            cursor: k ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                          {label} {k && <SortIcon k={k} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                        {members.length === 0 ? 'No members yet — import a CSV or invite members above.' : 'No members match your search.'}
                      </td></tr>
                    ) : filtered.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f0f4f1' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafcfa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a1a1a' }}>{m.full_name}</td>
                        <td style={{ padding: '10px 12px', color: '#555' }}>{m.email}</td>
                        <td style={{ padding: '10px 12px', color: '#555', textTransform: 'capitalize' }}>{m.plan_tier}</td>
                        <td style={{ padding: '10px 12px' }}>{statusBadge(m.status)}</td>
                        <td style={{ padding: '10px 12px', color: '#666' }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                        <td style={{ padding: '10px 12px', color: '#666' }}>
                          {m.last_check_in ? new Date(m.last_check_in).toLocaleDateString() : <span style={{ color: '#ccc' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {m.mood_avg != null ? (
                            <span style={{ fontWeight: 700, color: m.mood_avg >= 3.5 ? '#2d6a4f' : m.mood_avg >= 2.5 ? '#b45309' : '#c62828' }}>
                              {m.mood_avg.toFixed(1)}/5
                            </span>
                          ) : <span style={{ color: '#ccc' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {tab === 'analytics' && (
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: '20px' }}>
              Engagement Analytics
            </h2>
            {stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Call Completion Rate
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#2d6a4f', margin: '8px 0 4px' }}>
                    {stats.avg_call_completion != null ? `${stats.avg_call_completion.toFixed(0)}%` : '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>Aria check-in calls answered · last 30 days</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Average Mood Score
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#2d6a4f', margin: '8px 0 4px' }}>
                    {stats.avg_mood != null ? `${stats.avg_mood.toFixed(1)}/5` : '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>Across all active members · last 30 days</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Members Paused
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800,
                    color: stats.paused_members > 0 ? '#b45309' : '#2d6a4f', margin: '8px 0 4px' }}>
                    {stats.paused_members}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>Subscriptions on hold</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Crisis Alerts This Week
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800,
                    color: stats.alerts_this_week > 0 ? '#c62828' : '#2d6a4f', margin: '8px 0 4px' }}>
                    {stats.alerts_this_week}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>Navigators notified immediately</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>Loading analytics…</div>
            )}

            <div style={{ marginTop: '24px', background: '#fff8e1', border: '1px solid #f9e4a0',
              borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>
                📊 ROI Report
              </div>
              <p style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>
                Full ROI dashboard (hospitalisation reduction, caregiver burden, absenteeism) available in your monthly invoice email.
                Contact <strong>support@thriveathome.app</strong> for a custom report.
              </p>
            </div>
          </div>
        )}

        {/* ── Add-Ons Tab ── */}
        {tab === 'addons' && (
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
              Platform Add-Ons
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Extend your organisation's platform. Contact <strong>sales@thriveathome.app</strong> to activate.
            </p>
            {[
              { id: 'community_module', name: 'Community Module', description: 'Member-run campaigns, community events, circle posts, and social fundraising. Includes member_campaigns_live feature.', price: 'Included with Complete tier members' },
              { id: 'service_marketplace', name: 'Service Marketplace', description: 'Connect members to vetted paid service providers. Platform earns 20% transaction fee.', price: '$0 platform fee — 20% per transaction' },
              { id: 'ai_bundle', name: 'AI Metered Bundle', description: 'Aria daily calls ($0.08), Twilio SMS ($0.02), transcription ($0.03), Quinn inbound ($0.05). Metered and billed monthly.', price: 'Metered — pay per use' },
              { id: 'white_label', name: 'White-Label Branding', description: 'Custom logo, colors, and subdomain ([org].thriveathome.app). Member-facing UI uses your branding.', price: 'Included with enrollment' },
            ].map(addon => {
              const active = addons.find(a => a.id === addon.id)
              return (
                <div key={addon.id} style={{ background: '#fff', border: `1.5px solid ${active?.status === 'active' ? '#52b788' : '#e8f0e9'}`,
                  borderRadius: '12px', padding: '18px 20px', marginBottom: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a' }}>{addon.name}</span>
                      {active?.status === 'active' ? (
                        <span style={{ background: '#e8f5e9', color: '#2d6a4f', fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '99px' }}>Active</span>
                      ) : (
                        <span style={{ background: '#f5f5f5', color: '#888', fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '99px' }}>Not active</span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>{addon.description}</p>
                    <span style={{ fontSize: '12px', color: '#2d6a4f', fontWeight: 600 }}>{addon.price}</span>
                  </div>
                  {active?.status !== 'active' && (
                    <a href="mailto:sales@thriveathome.app?subject=Add-on inquiry"
                      style={{ background: '#2d6a4f', color: '#fff', borderRadius: '8px',
                        padding: '8px 14px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Contact sales
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: '20px' }}>
              Organisation Settings
            </h2>
            <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '12px' }}>Billing</div>
              {stats && (
                <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.8 }}>
                  <div><strong>Tier:</strong> {stats.billing_tier.replace('_', ' ')}</div>
                  <div><strong>Active members:</strong> {stats.active_members}</div>
                  <div><strong>Monthly SaaS cost:</strong> ${stats.monthly_cost}</div>
                  <div><strong>Enrollment fee:</strong> $3,300 (paid at signup)</div>
                </div>
              )}
              <div style={{ marginTop: '16px', padding: '12px', background: '#f7faf7', borderRadius: '8px',
                fontSize: '12px', color: '#666' }}>
                To update billing details or request a tier review, email{' '}
                <strong>billing@thriveathome.app</strong>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '12px' }}>Support</div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: 2 }}>
                <div>📧 <a href="mailto:support@thriveathome.app" style={{ color: '#2d6a4f' }}>support@thriveathome.app</a></div>
                <div>📞 1-800-THRIVE1</div>
                <div>🕐 Mon–Fri 9am–5pm PT</div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Default Export with Suspense ─────────────────────────────────────────────

export default function OrgAdminPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#2d6a4f" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <OrgAdminContent />
    </Suspense>
  )
}
