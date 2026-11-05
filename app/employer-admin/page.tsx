'use client'

/**
 * app/employer-admin/page.tsx — Corporate Volunteer Progress Dashboard
 * Shows volunteer program metrics, active opportunities, and member engagement
 */

import { useState, useEffect } from 'react'

type Stats = {
  total_opportunities: number
  open_opportunities: number
  total_applications: number
  placed_volunteers: number
  total_hours_pledged: number
  avg_hours_per_volunteer: number
}

type Opportunity = {
  id: string
  title: string
  type: string
  status: string
  hours_per_week: number | null
  application_count: number
  created_at: string
  application_deadline: string | null
}

type RecentApplication = {
  id: string
  status: string
  applied_at: string
  cover_note: string | null
  opportunity_title: string
  member_name: string
}

const TYPE_LABELS: Record<string, string> = {
  part_time: 'Part-Time', consulting: 'Consulting', board: 'Board Role',
  volunteer_pro: 'Pro Bono', flex: 'Flexible', full_time: 'Full-Time',
}

export default function EmployerAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'applications'>('overview')
  const [showNewForm, setShowNewForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // New opportunity form state
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('volunteer_pro')
  const [newDesc, setNewDesc] = useState('')
  const [newSkills, setNewSkills] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newRemote, setNewRemote] = useState(false)
  const [newHours, setNewHours] = useState('')
  const [newSalary, setNewSalary] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newEmployer, setNewEmployer] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      // Load opportunities with application counts
      const res = await fetch('/api/encore-careers')
      const data = await res.json()
      const opps: Opportunity[] = (data.opportunities ?? []).map((o: any) => ({
        ...o,
        application_count: 0, // would come from a richer API endpoint in production
      }))
      setOpportunities(opps)

      // Compute stats from loaded data
      const open = opps.filter((o: Opportunity) => o.status === 'open').length
      setStats({
        total_opportunities: opps.length,
        open_opportunities: open,
        total_applications: 0,
        placed_volunteers: 0,
        total_hours_pledged: opps.reduce((sum: number, o: Opportunity) => sum + (o.hours_per_week ?? 0), 0),
        avg_hours_per_volunteer: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function postOpportunity() {
    if (!newTitle || !newType) { showToast('Title and type are required'); return }
    setPosting(true)
    try {
      const res = await fetch('/api/encore-careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle, employer: newEmployer || null, type: newType,
          description: newDesc || null, skills_needed: newSkills || null,
          location: newLocation || null, remote_ok: newRemote,
          hours_per_week: newHours ? parseInt(newHours) : null,
          salary_range: newSalary || null,
          application_deadline: newDeadline || null,
        }),
      })
      if (!res.ok) { const e = await res.json(); showToast(`Error: ${e.error}`); return }
      showToast('✅ Opportunity posted!')
      setShowNewForm(false)
      setNewTitle(''); setNewType('volunteer_pro'); setNewDesc(''); setNewSkills('')
      setNewLocation(''); setNewRemote(false); setNewHours(''); setNewSalary(''); setNewDeadline(''); setNewEmployer('')
      load()
    } finally {
      setPosting(false)
    }
  }

  const statCards = stats ? [
    { label: 'Total Listings', value: stats.total_opportunities, icon: '📋', color: '#6366f1' },
    { label: 'Open Now', value: stats.open_opportunities, icon: '✅', color: '#10b981' },
    { label: 'Applications', value: stats.total_applications, icon: '📨', color: '#f59e0b' },
    { label: 'Volunteers Placed', value: stats.placed_volunteers, icon: '🤝', color: '#3b82f6' },
  ] : []

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 16px', textAlign: 'center' }}>
      <p style={{ color: '#9ca3af' }}>Loading employer dashboard…</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Corporate Volunteer Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage your senior talent program and track engagement</p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', flexShrink: 0 }}>
          + Post New Opportunity
        </button>
      </div>

      {/* New Opportunity Form */}
      {showNewForm && (
        <div style={{ border: '2px solid #6366f1', borderRadius: 16, padding: '24px', marginBottom: 24, background: '#fafaf9' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: '#1f2937' }}>New Opportunity</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Interim CFO Advisor" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Employer / Organization</label>
              <input value={newEmployer} onChange={e => setNewEmployer(e.target.value)} placeholder="Your company name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} style={inputStyle}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="City, State" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hours/week</label>
              <input value={newHours} onChange={e => setNewHours(e.target.value)} placeholder="e.g. 10" type="number" min="1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Compensation / Range</label>
              <input value={newSalary} onChange={e => setNewSalary(e.target.value)} placeholder="e.g. $80–100/hr or Volunteer" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Application Deadline</label>
              <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} type="date" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Describe the role, impact, and what you're looking for…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Skills Needed</label>
              <input value={newSkills} onChange={e => setNewSkills(e.target.value)} placeholder="e.g. Financial analysis, nonprofit board governance, HR strategy" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={newRemote} onChange={e => setNewRemote(e.target.checked)} id="remote-check" />
              <label htmlFor="remote-check" style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Remote work accepted</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={postOpportunity} disabled={posting}
              style={{ padding: '10px 24px', background: posting ? '#e5e7eb' : '#6366f1', color: posting ? '#9ca3af' : '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.9rem', cursor: posting ? 'default' : 'pointer' }}>
              {posting ? 'Posting…' : 'Post Opportunity'}
            </button>
            <button onClick={() => setShowNewForm(false)}
              style={{ padding: '10px 20px', background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 9, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', background: '#fff' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{card.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 20, gap: 0 }}>
        {(['overview', 'opportunities', 'applications'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: activeTab === t ? '2px solid #6366f1' : '2px solid transparent', marginBottom: -2, fontWeight: activeTab === t ? 700 : 500, color: activeTab === t ? '#6366f1' : '#6b7280', fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'overview' ? '📊 Overview' : t === 'opportunities' ? '📋 Opportunities' : '📨 Applications'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', background: '#fff' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937', marginBottom: 12 }}>📋 Active Listings</h3>
              {opportunities.filter(o => o.status === 'open').slice(0, 5).map(opp => (
                <div key={opp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #f3f4f6', fontSize: '0.82rem' }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{opp.title}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{TYPE_LABELS[opp.type] ?? opp.type}</span>
                </div>
              ))}
              {opportunities.filter(o => o.status === 'open').length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No active opportunities. Post one above!</p>
              )}
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', background: '#fff' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937', marginBottom: 12 }}>💡 Program Tips</h3>
              {[
                'Add detailed descriptions to attract better-matched candidates',
                'Consider offering remote options to reach more experienced professionals',
                'Pro bono and board roles attract highly motivated senior talent',
                'Respond to applications within 5 business days for best results',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: '0.82rem', color: '#374151' }}>
                  <span style={{ color: '#6366f1', flexShrink: 0 }}>→</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opportunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>No opportunities yet</div>
              <button onClick={() => setShowNewForm(true)} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                Post Your First Opportunity
              </button>
            </div>
          ) : opportunities.map(opp => (
            <div key={opp.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{opp.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>{TYPE_LABELS[opp.type] ?? opp.type}</span>
                  <span style={{ fontSize: '0.75rem', color: opp.status === 'open' ? '#059669' : '#9ca3af', fontWeight: 600 }}>● {opp.status === 'open' ? 'Open' : 'Closed'}</span>
                  {opp.hours_per_week && <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{opp.hours_per_week}h/wk</span>}
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Posted {new Date(opp.created_at).toLocaleDateString()}</span>
                  {opp.application_deadline && (
                    <span style={{ fontSize: '0.72rem', color: new Date(opp.application_deadline) < new Date() ? '#dc2626' : '#d97706' }}>
                      Deadline: {new Date(opp.application_deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1' }}>{opp.application_count}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>applications</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'applications' && (
        <div>
          {recentApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📨</div>
              <div style={{ fontWeight: 600, color: '#6b7280' }}>No applications yet</div>
              <div style={{ fontSize: '0.82rem', marginTop: 6 }}>Applications will appear here once candidates apply</div>
            </div>
          ) : recentApps.map(app => (
            <div key={app.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', background: '#fff', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{app.member_name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>Applied for: {app.opportunity_title}</div>
                  {app.cover_note && <p style={{ fontSize: '0.82rem', color: '#374151', marginTop: 8, fontStyle: 'italic' }}>"{app.cover_note}"</p>}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 8 }}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: 5, color: '#374151',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 7,
  fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
}
