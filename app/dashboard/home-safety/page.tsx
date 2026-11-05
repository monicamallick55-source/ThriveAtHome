'use client'

/**
 * app/dashboard/home-safety/page.tsx — G6.1 Home Safety & Earthquake Preparedness
 */

import { useState, useEffect } from 'react'

type ChecklistItem = {
  id: string
  category: string
  title: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  completed_at?: string
}

type SafetyProfile = {
  id: string
  home_type: string
  floors: number
  earthquake_zone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  enrolled_at: string
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  fall_prevention: { label: 'Fall Prevention', icon: '🚶', color: '#3b82f6' },
  emergency_prep:  { label: 'Emergency Preparedness', icon: '🎒', color: '#f59e0b' },
  earthquake:      { label: 'Earthquake Safety', icon: '🌊', color: '#ef4444' },
  fire_safety:     { label: 'Fire Safety', icon: '🔥', color: '#f97316' },
  medical:         { label: 'Medical Readiness', icon: '💊', color: '#10b981' },
}

const PRIORITY_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  high:   { label: 'High', bg: '#fee2e2', color: '#991b1b' },
  medium: { label: 'Medium', bg: '#fef3c7', color: '#92400e' },
  low:    { label: 'Low', bg: '#f3f4f6', color: '#6b7280' },
}

export default function HomeSafetyPage() {
  const [profile, setProfile] = useState<SafetyProfile | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [completing, setCompleting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showEnrollForm, setShowEnrollForm] = useState(false)

  // Enroll form
  const [homeType, setHomeType] = useState('house')
  const [floors, setFloors] = useState('1')
  const [ecName, setEcName] = useState('')
  const [ecPhone, setEcPhone] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/home-safety')
      const data = await res.json()
      setProfile(data.profile)
      setChecklist(data.checklist ?? [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function enroll() {
    setEnrolling(true)
    try {
      const res = await fetch('/api/home-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_type: homeType, floors: parseInt(floors), emergency_contact_name: ecName || null, emergency_contact_phone: ecPhone || null }),
      })
      if (!res.ok) { showToast('Could not enroll'); return }
      showToast('✅ Enrolled! Your home safety checklist is ready.')
      setShowEnrollForm(false)
      load()
    } finally {
      setEnrolling(false)
    }
  }

  async function toggleItem(item: ChecklistItem) {
    setCompleting(item.id)
    try {
      const res = await fetch('/api/home-safety', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, completed: !item.completed }),
      })
      if (!res.ok) { showToast('Could not update'); return }
      setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed, completed_at: !i.completed ? new Date().toISOString() : undefined } : i))
      if (!item.completed) showToast('✅ Marked complete!')
    } finally {
      setCompleting(null)
    }
  }

  const categories = ['all', ...Object.keys(CATEGORY_META)]
  const filtered = activeCategory === 'all' ? checklist : checklist.filter(i => i.category === activeCategory)
  const total = checklist.length
  const done = checklist.filter(i => i.completed).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const highPending = checklist.filter(i => !i.completed && i.priority === 'high').length

  if (loading) return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 16px', textAlign: 'center' }}>
      <p style={{ color: '#9ca3af' }}>Loading your home safety profile…</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Home Safety Program</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 24 }}>
        Fall prevention, earthquake preparedness, fire safety, and emergency readiness — all in one place.
      </p>

      {!profile ? (
        <div>
          {!showEnrollForm ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed #e5e7eb', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏠</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: '#1f2937' }}>Start Your Home Safety Assessment</div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Get a personalized checklist covering fall prevention, earthquake preparedness, fire safety, and medical readiness.
              </p>
              <button onClick={() => setShowEnrollForm(true)}
                style={{ padding: '12px 32px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                Get Started →
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 480, border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: '#1f2937' }}>Tell us about your home</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>Home type</label>
                  <select value={homeType} onChange={e => setHomeType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="mobile_home">Mobile Home</option>
                    <option value="senior_community">Senior Community</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>Number of floors</label>
                  <select value={floors} onChange={e => setFloors(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}>
                    <option value="1">1 floor</option>
                    <option value="2">2 floors</option>
                    <option value="3">3+ floors</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>Emergency contact name <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="e.g. Jane Smith"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>Emergency contact phone <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input value={ecPhone} onChange={e => setEcPhone(e.target.value)} placeholder="e.g. (555) 123-4567" type="tel"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={enroll} disabled={enrolling}
                    style={{ flex: 1, padding: '11px 0', background: enrolling ? '#e5e7eb' : '#6366f1', color: enrolling ? '#9ca3af' : '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.95rem', cursor: enrolling ? 'default' : 'pointer' }}>
                    {enrolling ? 'Creating checklist…' : 'Create My Checklist →'}
                  </button>
                  <button onClick={() => setShowEnrollForm(false)}
                    style={{ padding: '11px 18px', background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 9, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Progress summary */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', background: '#fafafa', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>Your Safety Score</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', marginTop: 4 }}>{pct}%</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{done} of {total} items complete</div>
              </div>
              {highPending > 0 && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', fontSize: '0.82rem', color: '#991b1b', maxWidth: 220 }}>
                  ⚠️ <strong>{highPending} high-priority</strong> items still need attention
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat]
              const catItems = cat === 'all' ? checklist : checklist.filter(i => i.category === cat)
              const catDone = catItems.filter(i => i.completed).length
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${activeCategory === cat ? '#6366f1' : '#e5e7eb'}`, background: activeCategory === cat ? '#6366f1' : '#fff', color: activeCategory === cat ? '#fff' : '#374151', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  {cat === 'all' ? `All (${done}/${total})` : `${meta?.icon} ${meta?.label} (${catDone}/${catItems.length})`}
                </button>
              )
            })}
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(item => {
              const badge = PRIORITY_BADGE[item.priority]
              const catMeta = CATEGORY_META[item.category]
              return (
                <div key={item.id} style={{
                  border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px',
                  background: item.completed ? '#f0fdf4' : '#fff',
                  borderLeft: `4px solid ${item.completed ? '#10b981' : catMeta?.color ?? '#6366f1'}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <button
                    onClick={() => toggleItem(item)}
                    disabled={completing === item.id}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', border: `2px solid ${item.completed ? '#10b981' : '#d1d5db'}`,
                      background: item.completed ? '#10b981' : '#fff', color: '#fff', fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                    }}>
                    {item.completed ? '✓' : ''}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: item.completed ? '#065f46' : '#1f2937', textDecoration: item.completed ? 'line-through' : 'none' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', background: badge.bg, color: badge.color, padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>{badge.label} Priority</span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{catMeta?.icon} {catMeta?.label}</span>
                      {item.completed && item.completed_at && (
                        <span style={{ fontSize: '0.72rem', color: '#10b981' }}>✓ Done {new Date(item.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {pct === 100 && (
            <div style={{ marginTop: 24, textAlign: 'center', padding: '24px', background: '#f0fdf4', borderRadius: 16 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏆</div>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1.1rem' }}>100% Complete — Your home is safety-ready!</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 6 }}>Review your checklist every 6 months or after any major life change.</div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: '14px 18px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#6b7280' }}>
            💡 <strong style={{ color: '#374151' }}>Need help?</strong> Your navigator can connect you with a free home safety assessment from a local occupational therapist or volunteer handyperson service.
          </div>
        </div>
      )}
    </div>
  )
}
