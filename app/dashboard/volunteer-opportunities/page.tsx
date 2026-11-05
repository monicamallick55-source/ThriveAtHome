'use client'

/**
 * app/dashboard/volunteer-opportunities/page.tsx — G7.10/G7.12
 *
 * Volunteer browses open opportunities and applies.
 * Neighbor volunteers (same zip) and retired professionals see relevant postings.
 */

import { useState, useEffect } from 'react'

type Opportunity = {
  id: string
  created_at: string
  title: string
  description?: string
  category: string
  required_specialty?: string
  zip_code?: string
  schedule_text?: string
  commitment_hours_per_week?: number
  status: string
  filled_at?: string
}

type Application = {
  id: string
  opportunity_id: string
  status: string
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  companion_call:        '📞 Companion Calls',
  in_person_visit:       '🏠 In-Person Visit',
  transportation:        '🚗 Transportation',
  grocery_errand:        '🛒 Grocery & Errands',
  tech_help:             '💻 Tech Help',
  health_literacy:       '🩺 Health Literacy',
  legal_clinic:          '⚖️ Legal Clinic',
  tax_help:              '📊 Tax Help (VITA)',
  tutoring:              '📚 Tutoring',
  grief_support:         '💛 Grief Support',
  pen_pal:               '✉️ Pen Pal',
  other:                 '🤝 Other',
}

export default function VolunteerOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [volunteerId, setVolunteerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    // Get volunteer id
    fetch('/api/volunteers/me')
      .then(r => r.ok ? r.json() : {})
      .then(d => { if (d.volunteer?.id) setVolunteerId(d.volunteer.id) })
      .catch(() => {})

    loadOpportunities()
  }, [])

  async function loadOpportunities() {
    setLoading(true)
    try {
      const [oppRes, appRes] = await Promise.all([
        fetch('/api/volunteers/opportunities?status=open'),
        fetch('/api/volunteers/opportunities?my_applications=true'),
      ])
      const oppData = oppRes.ok ? await oppRes.json() : {}
      const appData = appRes.ok ? await appRes.json() : {}
      setOpportunities(oppData.opportunities ?? [])
      setMyApplications(appData.applications ?? [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function apply(oppId: string) {
    if (!volunteerId) { showToast('Could not find your volunteer profile.'); return }
    setApplying(oppId)
    try {
      const res = await fetch(`/api/volunteers/opportunities/${oppId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteer_id: volunteerId }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Could not apply'); return }
      showToast('✅ Application submitted! A navigator will be in touch.')
      setMyApplications(prev => [...prev, data.application])
    } finally {
      setApplying(null)
    }
  }

  const appliedIds = new Set(myApplications.map(a => a.opportunity_id))
  const categories = [...new Set(opportunities.map(o => o.category))]
  const filtered = filterCat ? opportunities.filter(o => o.category === filterCat) : opportunities

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Volunteer Opportunities</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>
        Find ways to give back — from companion calls to in-person visits and beyond.
      </p>

      {/* My applications */}
      {myApplications.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#065f46', marginBottom: 8 }}>
            ✅ Your Applications ({myApplications.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {myApplications.map(a => {
              const opp = opportunities.find(o => o.id === a.opportunity_id)
              return (
                <div key={a.id} style={{ fontSize: '0.82rem', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{opp?.title ?? a.opportunity_id}</span>
                  <span style={{ color: a.status === 'approved' ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                    {a.status === 'pending' ? 'Pending review' : a.status === 'approved' ? 'Approved!' : a.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={() => setFilterCat('')}
            style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${!filterCat ? '#6366f1' : '#e5e7eb'}`, background: !filterCat ? '#6366f1' : '#fff', color: !filterCat ? '#fff' : '#374151', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
              style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${filterCat === cat ? '#6366f1' : '#e5e7eb'}`, background: filterCat === cat ? '#6366f1' : '#fff', color: filterCat === cat ? '#fff' : '#374151', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Opportunities list */}
      {loading ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Loading opportunities…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 48, color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤝</div>
          <p>{filterCat ? 'No opportunities in this category right now.' : 'No open opportunities right now — check back soon!'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(opp => {
            const applied = appliedIds.has(opp.id)
            return (
              <div key={opp.id} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>{opp.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>
                      {CATEGORY_LABELS[opp.category] ?? opp.category}
                      {opp.schedule_text ? ` · ${opp.schedule_text}` : ''}
                      {opp.commitment_hours_per_week ? ` · ~${opp.commitment_hours_per_week}h/week` : ''}
                      {opp.zip_code ? ` · ZIP ${opp.zip_code}` : ''}
                    </div>
                    {opp.description && (
                      <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: 8, lineHeight: 1.5 }}>{opp.description}</div>
                    )}
                    {opp.required_specialty && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#5b21b6', padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>
                          {opp.required_specialty} background preferred
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => !applied && apply(opp.id)}
                    disabled={applied || applying === opp.id || !volunteerId}
                    style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none', flexShrink: 0,
                      background: applied ? '#d1fae5' : applying === opp.id ? '#e5e7eb' : '#6366f1',
                      color: applied ? '#065f46' : applying === opp.id ? '#9ca3af' : '#fff',
                      fontWeight: 700, fontSize: '0.85rem',
                      cursor: applied || applying === opp.id ? 'default' : 'pointer',
                    }}>
                    {applied ? '✓ Applied' : applying === opp.id ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
