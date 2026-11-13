'use client'

/**
 * app/org-admin/page.tsx — 16.2 B2B Org-Admin Dashboard
 *
 * Full dashboard for organization admins (villages, employers, health systems).
 * Shows: member stats, recent activity, quick actions, billing summary.
 * Tabs: Overview | Members | Admins | Import | Email Templates | Billing
 */

import { useState, useEffect } from 'react'

type OrgStats = {
  total_members: number
  active_members: number
  pending_invitations: number
  calls_this_month: number
  avg_wellbeing_score?: number
  plan_name: string
  seats_used: number
  seats_total: number
  billing_cycle_end?: string
}

type OrgMember = {
  id: string
  first_name: string
  last_name: string
  email?: string
  status: string
  joined_at: string
  last_active?: string
  wellbeing_score?: number
}

type OrgAdmin = {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'viewer'
  added_at: string
}

type Org = {
  id: string
  name: string
  logo_url?: string
  plan_name: string
  white_label_name?: string
}

const TABS = [
  { id: 'overview',   label: '📊 Overview' },
  { id: 'members',    label: '👥 Members' },
  { id: 'admins',     label: '🔑 Admins' },
  { id: 'import',     label: '📥 Import' },
  { id: 'email',      label: '✉️ Email Templates' },
  { id: 'billing',    label: '💳 Billing' },
]

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px', background: '#fff', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: color ?? '#1f2937' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function OrgAdminPage() {
  const [tab, setTab] = useState('overview')
  const [org, setOrg] = useState<Org | null>(null)
  const [stats, setStats] = useState<OrgStats | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [admins, setAdmins] = useState<OrgAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  // Admin invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('admin')
  const [inviting, setInviting] = useState(false)

  // Bulk action
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [orgRes, statsRes, membersRes, adminsRes] = await Promise.all([
        fetch('/api/org-admin/org'),
        fetch('/api/org-admin/stats'),
        fetch('/api/org-admin/members'),
        fetch('/api/org-admin/admins'),
      ])
      if (orgRes.ok) setOrg((await orgRes.json()).org)
      if (statsRes.ok) setStats((await statsRes.json()).stats)
      if (membersRes.ok) setMembers((await membersRes.json()).members ?? [])
      if (adminsRes.ok) setAdmins((await adminsRes.json()).admins ?? [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function inviteAdmin() {
    if (!inviteEmail) return
    setInviting(true)
    try {
      const res = await fetch('/api/org-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Could not invite admin'); return }
      showToast(`✅ Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      loadAll()
    } finally {
      setInviting(false)
    }
  }

  async function bulkAction(action: string) {
    if (selectedMembers.size === 0) return
    const res = await fetch('/api/org-admin/members/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_ids: [...selectedMembers], action }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error ?? 'Bulk action failed'); return }
    showToast(`✅ ${action} applied to ${selectedMembers.size} members`)
    setSelectedMembers(new Set())
    loadAll()
  }

  async function removeAdmin(adminId: string) {
    const res = await fetch(`/api/org-admin/admins/${adminId}`, { method: 'DELETE' })
    if (res.ok) { showToast('Admin removed'); loadAll() }
  }

  const filteredMembers = members.filter(m =>
    !memberSearch || `${m.first_name} ${m.last_name} ${m.email ?? ''}`.toLowerCase().includes(memberSearch.toLowerCase())
  )

  if (loading && !org) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#9ca3af' }}>Loading organization dashboard…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        {org?.logo_url && <img src={org.logo_url} alt="" style={{ height: 40, borderRadius: 8, objectFit: 'contain' }} />}
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#1f2937' }}>
            {org?.white_label_name ?? org?.name ?? 'Organization Admin'}
          </h1>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{stats?.plan_name ?? 'ThriveAtHome'} · Admin Portal</div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            fontWeight: tab === t.id ? 700 : 400, fontSize: '0.875rem',
            color: tab === t.id ? '#6366f1' : '#6b7280',
            borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard label="Total Members" value={stats.total_members} color="#6366f1" />
            <StatCard label="Active Members" value={stats.active_members} sub={`${Math.round((stats.active_members / Math.max(stats.total_members, 1)) * 100)}% active`} color="#10b981" />
            <StatCard label="Pending Invites" value={stats.pending_invitations} color="#f59e0b" />
            <StatCard label="Calls This Month" value={stats.calls_this_month} color="#3b82f6" />
            {stats.avg_wellbeing_score !== undefined && (
              <StatCard label="Avg Wellbeing" value={`${stats.avg_wellbeing_score.toFixed(1)}/10`} color="#8b5cf6" />
            )}
          </div>

          {/* Seat usage */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', background: '#fafafa', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#1f2937' }}>Seat Usage</span>
              <span style={{ color: '#6b7280' }}>{stats.seats_used} / {stats.seats_total} seats</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${Math.min((stats.seats_used / stats.seats_total) * 100, 100)}%`,
                background: stats.seats_used / stats.seats_total > 0.9 ? '#ef4444' : '#6366f1',
              }} />
            </div>
            {stats.seats_used >= stats.seats_total && (
              <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 8 }}>
                ⚠️ Seat limit reached — upgrade your plan to add more members.
              </p>
            )}
            {stats.billing_cycle_end && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                Billing cycle ends {new Date(stats.billing_cycle_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: '📥 Import Members', action: () => setTab('import') },
              { label: '✉️ Invite Admin', action: () => setTab('admins') },
              { label: '🎨 Email Templates', action: () => setTab('email') },
              { label: '📊 Download Report', action: async () => {
                const res = await fetch('/api/org-admin/report?format=csv')
                if (res.ok) showToast('Report downloaded to your browser')
              }},
            ].map(a => (
              <button key={a.label} onClick={a.action}
                style={{ padding: '10px 18px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="search" placeholder="Search members…" value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem' }}
            />
            {selectedMembers.size > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => bulkAction('deactivate')}
                  style={{ padding: '9px 16px', border: '1px solid #fca5a5', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Deactivate ({selectedMembers.size})
                </button>
                <button onClick={() => bulkAction('resend_invite')}
                  style={{ padding: '9px 16px', border: '1px solid #93c5fd', borderRadius: 8, background: '#dbeafe', color: '#1e40af', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Resend Invite ({selectedMembers.size})
                </button>
              </div>
            )}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <input type="checkbox"
                      checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                      onChange={e => setSelectedMembers(e.target.checked ? new Set(filteredMembers.map(m => m.id)) : new Set())}
                    />
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Active</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Wellbeing</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No members found</td></tr>
                ) : filteredMembers.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <input type="checkbox" checked={selectedMembers.has(m.id)}
                        onChange={e => {
                          const s = new Set(selectedMembers)
                          e.target.checked ? s.add(m.id) : s.delete(m.id)
                          setSelectedMembers(s)
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{m.first_name} {m.last_name}</div>
                      {m.email && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.email}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                        background: m.status === 'active' ? '#d1fae5' : m.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                        color: m.status === 'active' ? '#065f46' : m.status === 'pending' ? '#92400e' : '#6b7280',
                      }}>{m.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.8rem' }}>
                      {m.last_active ? new Date(m.last_active).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.8rem' }}>
                      {m.wellbeing_score !== undefined ? `${m.wellbeing_score}/10` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Admins ── */}
      {tab === 'admins' && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: '#374151' }}>Organization Admins</h2>

          {/* Invite form */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', marginBottom: 24, background: '#fafafa' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14, color: '#1f2937' }}>Invite a New Admin</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={{ flex: 2, minWidth: 200, padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem' }}
              />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}
                style={{ flex: 1, minWidth: 120, padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem' }}>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
              <button onClick={inviteAdmin} disabled={inviting || !inviteEmail}
                style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: inviting || !inviteEmail ? '#e5e7eb' : '#6366f1', color: inviting || !inviteEmail ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: inviting || !inviteEmail ? 'default' : 'pointer' }}>
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 10 }}>
              <strong>Admin</strong>: can manage members, import, and settings. <strong>Viewer</strong>: read-only access to reports.
            </p>
          </div>

          {/* Admin list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {admins.map(a => (
              <div key={a.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{a.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{a.email} · Added {new Date(a.added_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                    background: a.role === 'owner' ? '#fef3c7' : a.role === 'admin' ? '#ede9fe' : '#f3f4f6',
                    color: a.role === 'owner' ? '#92400e' : a.role === 'admin' ? '#5b21b6' : '#6b7280',
                  }}>{a.role}</span>
                  {a.role !== 'owner' && (
                    <button onClick={() => removeAdmin(a.id)}
                      style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Import ── */}
      {tab === 'import' && (
        <div style={{ maxWidth: 580 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: '#374151' }}>Import Members</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 20 }}>
            Upload a CSV file to bulk-add members. Each row becomes one member account.
          </p>

          <div style={{ border: '2px dashed #d1d5db', borderRadius: 14, padding: '32px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>Drop a CSV file here, or click to upload</div>
            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 16 }}>
              Required columns: <code>first_name, last_name, email, phone</code> (optional: <code>date_of_birth, address, city, state, zip</code>)
            </div>
            <input type="file" accept=".csv"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                const form = new FormData()
                form.append('file', file)
                const res = await fetch('/api/org-imports', { method: 'POST', body: form })
                const data = await res.json()
                if (res.ok) showToast(`✅ Import started — ${data.import?.row_count ?? '?'} rows queued`)
                else showToast(data.error ?? 'Import failed')
              }}
              style={{ display: 'none' }} id="csv-upload"
            />
            <label htmlFor="csv-upload"
              style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-block' }}>
              Choose CSV File
            </label>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', fontSize: '0.82rem', color: '#065f46' }}>
            <strong>CSV template:</strong>
            <pre style={{ marginTop: 6, fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto' }}>
{`first_name,last_name,email,phone,date_of_birth
Margaret,Johnson,mjohnson@email.com,555-867-5309,1945-03-15
Robert,Williams,rwilliams@email.com,555-234-5678,1938-11-02`}
            </pre>
            <button onClick={() => {
              const csv = 'first_name,last_name,email,phone,date_of_birth\n'
              const blob = new Blob([csv], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'member-import-template.csv'
              a.click()
            }} style={{ marginTop: 10, background: 'none', border: 'none', color: '#065f46', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
              ⬇ Download template
            </button>
          </div>
        </div>
      )}

      {/* ── Email Templates ── */}
      {tab === 'email' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#374151' }}>White-Label Email Templates</h2>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
                Customize welcome and notification emails with your organization's branding.
              </p>
            </div>
          </div>

          <OrgEmailTemplatesPanel org={org} onSave={msg => showToast(msg)} />
        </div>
      )}

      {/* ── Billing ── */}
      {tab === 'billing' && (
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: '#374151' }}>Billing & Plan</h2>
          {stats && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px', background: '#fff', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1', marginTop: 4 }}>{stats.plan_name}</div>
                </div>
                <button onClick={() => window.open('/api/org-admin/billing/portal', '_blank')}
                  style={{ padding: '8px 16px', border: '1px solid #6366f1', borderRadius: 8, color: '#6366f1', background: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Manage Billing
                </button>
              </div>
              <div style={{ marginTop: 16, fontSize: '0.875rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>Seats: <strong style={{ color: '#1f2937' }}>{stats.seats_used} / {stats.seats_total}</strong></div>
                {stats.billing_cycle_end && (
                  <div>Next renewal: <strong style={{ color: '#1f2937' }}>{new Date(stats.billing_cycle_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div>
                )}
              </div>
            </div>
          )}
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '0.82rem', color: '#6b7280' }}>
            Need more seats or a different plan? Contact <a href="mailto:partnerships@thrivathome.com" style={{ color: '#6366f1', fontWeight: 700 }}>partnerships@thrivathome.com</a> and your account manager will help within one business day.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: Email Templates Panel ──────────────────────────────────────

type EmailTemplate = {
  id: string
  type: string
  subject: string
  body_html: string
  from_name?: string
  reply_to?: string
  updated_at?: string
}

const TEMPLATE_TYPES: Record<string, string> = {
  welcome:         '👋 Welcome Email',
  invitation:      '📩 Member Invitation',
  weekly_check_in: '📅 Weekly Check-In',
  care_alert:      '🚨 Care Alert',
  gift_received:   '🎁 Gift Received',
  celebration:     '🎉 Celebration Reminder',
}

function OrgEmailTemplatesPanel({ org, onSave }: { org: Org | null; onSave: (msg: string) => void }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/org-admin/email-templates')
      .then(r => r.ok ? r.json() : { templates: [] })
      .then(d => setTemplates(d.templates ?? []))
  }, [])

  async function saveTemplate() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/org-admin/email-templates/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editing.subject, body_html: editing.body_html, from_name: editing.from_name, reply_to: editing.reply_to }),
      })
      const data = await res.json()
      if (!res.ok) { onSave(data.error ?? 'Save failed'); return }
      onSave('✅ Template saved!')
      setTemplates(prev => prev.map(t => t.id === editing.id ? data.template : t))
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: 0, marginBottom: 20 }}>
          ← Back to templates
        </button>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937', marginBottom: 18 }}>
          Editing: {TEMPLATE_TYPES[editing.type] ?? editing.type}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>From Name</label>
            <input value={editing.from_name ?? ''} onChange={e => setEditing({ ...editing, from_name: e.target.value })}
              placeholder={org?.white_label_name ?? org?.name ?? 'ThriveAtHome'}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Reply-To Email</label>
            <input type="email" value={editing.reply_to ?? ''} onChange={e => setEditing({ ...editing, reply_to: e.target.value })}
              placeholder="support@yourorganization.org"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Subject Line</label>
            <input value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Email Body (HTML)
              <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>Use {'{{first_name}}'}, {'{{org_name}}'}, {'{{platform_name}}'} as variables</span>
            </label>
            <textarea value={editing.body_html} onChange={e => setEditing({ ...editing, body_html: e.target.value })}
              rows={12}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.82rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button onClick={saveTemplate} disabled={saving}
            style={{ padding: '11px 0', border: 'none', borderRadius: 8, background: saving ? '#e5e7eb' : '#6366f1', color: saving ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.entries(TEMPLATE_TYPES).map(([type, label]) => {
        const tpl = templates.find(t => t.type === type)
        return (
          <div key={type} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{label}</div>
              {tpl ? (
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                  Subject: {tpl.subject}
                  {tpl.updated_at ? ` · Last edited ${new Date(tpl.updated_at).toLocaleDateString()}` : ''}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Using default ThriveAtHome template</div>
              )}
            </div>
            <button onClick={() => setEditing(tpl ?? { id: type, type, subject: `Default ${label} subject`, body_html: `<p>Hi {{first_name}},</p>\n<p></p>\n<p>— {{org_name}} Team</p>` })}
              style={{ padding: '7px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
              {tpl ? 'Edit' : 'Customize'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
