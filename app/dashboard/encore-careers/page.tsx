'use client'

/**
 * app/dashboard/encore-careers/page.tsx — G6.3 Encore Careers Hub
 */

import { useState, useEffect } from 'react'

type Opportunity = {
  id: string
  title: string
  employer: string | null
  type: string
  description: string | null
  skills_needed: string | null
  location: string | null
  remote_ok: boolean
  hours_per_week: number | null
  salary_range: string | null
  application_deadline: string | null
  status: string
  created_at: string
}

type Application = {
  id: string
  status: string
  applied_at: string
  opportunity: {
    id: string
    title: string
    employer: string | null
    type: string
    location: string | null
    remote_ok: boolean
  }
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  part_time:    { label: 'Part-Time', color: '#1d4ed8', bg: '#dbeafe' },
  consulting:   { label: 'Consulting', color: '#7c3aed', bg: '#ede9fe' },
  board:        { label: 'Board Role', color: '#065f46', bg: '#d1fae5' },
  volunteer_pro:{ label: 'Pro Bono', color: '#92400e', bg: '#fef3c7' },
  flex:         { label: 'Flexible', color: '#1e40af', bg: '#e0e7ff' },
  full_time:    { label: 'Full-Time', color: '#be185d', bg: '#fce7f3' },
}

const APP_STATUS: Record<string, { label: string; color: string }> = {
  submitted:  { label: 'Submitted', color: '#6b7280' },
  reviewed:   { label: 'Under Review', color: '#d97706' },
  interview:  { label: 'Interview', color: '#7c3aed' },
  offered:    { label: 'Offered', color: '#059669' },
  declined:   { label: 'Not Selected', color: '#dc2626' },
  withdrawn:  { label: 'Withdrawn', color: '#9ca3af' },
}

export default function EncoreCareersPage() {
  const [tab, setTab] = useState<'browse' | 'my-applications'>('browse')
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterRemote, setFilterRemote] = useState(false)
  const [applyingTo, setApplyingTo] = useState<Opportunity | null>(null)
  const [coverNote, setCoverNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  useEffect(() => { loadOpportunities() }, [filterType, filterRemote])
  useEffect(() => { if (tab === 'my-applications') loadApplications() }, [tab])

  async function loadOpportunities() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      if (filterRemote) params.set('remote', 'true')
      const res = await fetch(`/api/encore-careers?${params}`)
      const data = await res.json()
      setOpportunities(data.opportunities ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function loadApplications() {
    const res = await fetch('/api/encore-careers?my=true')
    const data = await res.json()
    const apps = data.applications ?? []
    setApplications(apps)
    setAppliedIds(new Set(apps.map((a: Application) => a.opportunity?.id)))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function submitApplication() {
    if (!applyingTo) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/encore-careers/${applyingTo.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_note: coverNote || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(`Error: ${err.error}`)
        return
      }
      showToast('✅ Application submitted!')
      setApplyingTo(null)
      setCoverNote('')
      setAppliedIds(prev => new Set([...prev, applyingTo.id]))
    } finally {
      setSubmitting(false)
    }
  }

  const types = ['all', ...Object.keys(TYPE_LABELS)]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Encore careers: career opportunities, encore employment, job search, work</span>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Apply modal */}
      {applyingTo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4, color: '#1f2937' }}>Apply: {applyingTo.title}</h3>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 20 }}>{applyingTo.employer ?? 'Organization not listed'}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Cover note <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional — a few sentences about your interest)</span>
              </label>
              <textarea
                value={coverNote}
                onChange={e => setCoverNote(e.target.value)}
                rows={4}
                placeholder="Share why this opportunity interests you and what you'd bring…"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={submitApplication} disabled={submitting}
                style={{ flex: 1, padding: '11px 0', background: submitting ? '#e5e7eb' : '#6366f1', color: submitting ? '#9ca3af' : '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
              <button onClick={() => { setApplyingTo(null); setCoverNote('') }}
                style={{ padding: '11px 18px', background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 9, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Encore Careers</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 24 }}>
        Flexible roles, consulting, board positions, and professional volunteer work — designed for experienced seniors.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 0 }}>
        {(['browse', 'my-applications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent', marginBottom: -2, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#6366f1' : '#6b7280', fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t === 'browse' ? '🔍 Browse Opportunities' : `📋 My Applications${applications.length > 0 ? ` (${applications.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>Type:</span>
            {types.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${filterType === t ? '#6366f1' : '#e5e7eb'}`, background: filterType === t ? '#6366f1' : '#fff', color: filterType === t ? '#fff' : '#374151', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                {t === 'all' ? 'All Types' : TYPE_LABELS[t]?.label ?? t}
              </button>
            ))}
            <button onClick={() => setFilterRemote(r => !r)}
              style={{ padding: '4px 14px', borderRadius: 99, border: `1px solid ${filterRemote ? '#059669' : '#e5e7eb'}`, background: filterRemote ? '#d1fae5' : '#fff', color: filterRemote ? '#065f46' : '#6b7280', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              🌐 Remote Only
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading opportunities…</div>
          ) : opportunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, color: '#6b7280' }}>No opportunities found</div>
              <div style={{ fontSize: '0.82rem', marginTop: 6 }}>Try adjusting your filters</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {opportunities.map(opp => {
                const typeMeta = TYPE_LABELS[opp.type]
                const applied = appliedIds.has(opp.id)
                const isExpired = opp.application_deadline && new Date(opp.application_deadline) < new Date()
                return (
                  <div key={opp.id} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937', marginBottom: 2 }}>{opp.title}</div>
                        {opp.employer && <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>{opp.employer}</div>}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                          {typeMeta && (
                            <span style={{ fontSize: '0.72rem', background: typeMeta.bg, color: typeMeta.color, padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>{typeMeta.label}</span>
                          )}
                          {opp.remote_ok && (
                            <span style={{ fontSize: '0.72rem', background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>🌐 Remote OK</span>
                          )}
                          {opp.location && !opp.remote_ok && (
                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>📍 {opp.location}</span>
                          )}
                          {opp.hours_per_week && (
                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>⏰ {opp.hours_per_week}h/wk</span>
                          )}
                          {opp.salary_range && (
                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>💰 {opp.salary_range}</span>
                          )}
                        </div>
                        {opp.description && (
                          <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0, marginBottom: 8, lineHeight: 1.5 }}>{opp.description}</p>
                        )}
                        {opp.skills_needed && (
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                            <strong style={{ color: '#374151' }}>Skills: </strong>{opp.skills_needed}
                          </div>
                        )}
                        {opp.application_deadline && (
                          <div style={{ fontSize: '0.75rem', color: isExpired ? '#dc2626' : '#d97706', marginTop: 6, fontWeight: 600 }}>
                            {isExpired ? '⚠️ Deadline passed' : `📅 Apply by ${new Date(opp.application_deadline).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {applied ? (
                          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, background: '#d1fae5', padding: '6px 14px', borderRadius: 8, display: 'block' }}>✓ Applied</span>
                        ) : !isExpired ? (
                          <button onClick={() => setApplyingTo(opp)}
                            style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Apply Now
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'my-applications' && (
        <div>
          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>No applications yet</div>
              <button onClick={() => setTab('browse')} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                Browse Opportunities
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {applications.map(app => {
                const statusMeta = APP_STATUS[app.status] ?? { label: app.status, color: '#6b7280' }
                const typeMeta = app.opportunity?.type ? TYPE_LABELS[app.opportunity.type] : null
                return (
                  <div key={app.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{app.opportunity?.title ?? 'Opportunity'}</div>
                      {app.opportunity?.employer && <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>{app.opportunity.employer}</div>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {typeMeta && (
                          <span style={{ fontSize: '0.7rem', background: typeMeta.bg, color: typeMeta.color, padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>{typeMeta.label}</span>
                        )}
                        {app.opportunity?.remote_ok && (
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>🌐 Remote</span>
                        )}
                        {app.opportunity?.location && !app.opportunity.remote_ok && (
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>📍 {app.opportunity.location}</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: statusMeta.color, background: '#f9fafb', border: `1px solid #e5e7eb`, padding: '4px 12px', borderRadius: 8, display: 'block', textAlign: 'center' }}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 28, padding: '14px 18px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#6b7280' }}>
        💡 <strong style={{ color: '#374151' }}>Your experience matters.</strong> These roles are curated for professionals 55+ who want to continue contributing on their own terms. Your navigator can help you prepare your profile.
      </div>
    </div>
  )
}
