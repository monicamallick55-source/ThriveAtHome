'use client'
// G7.15 — Navigator panel: create & view transition plans for a member

import { useState, useEffect } from 'react'

interface PlanSummary {
  id: string
  title: string
  plan_type: string
  status: string
  target_date: string | null
  family_can_see: boolean
  steps: { id: string; title: string; completed_at: string | null; due_date: string | null }[]
}

interface Props {
  memberId: string
  memberName: string
}

const PLAN_TYPES = [
  { value: 'facility_move', label: '🏠 Facility Move' },
  { value: 'home_modification', label: '🔨 Home Modification' },
  { value: 'downsizing', label: '📦 Downsizing' },
  { value: 'temporary_care', label: '⏱ Temporary Care' },
  { value: 'other', label: '📋 Other' },
]

export default function TransitionPlanPanel({ memberId, memberName }: Props) {
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formTitle, setFormTitle] = useState('Facility Move Plan')
  const [formType, setFormType] = useState('facility_move')
  const [formTargetDate, setFormTargetDate] = useState('')
  const [formFamilyVisible, setFormFamilyVisible] = useState(true)

  useEffect(() => {
    fetch(`/api/transition-plans?memberId=${memberId}`)
      .then(r => r.json())
      .then(d => setPlans(d.plans ?? []))
      .catch(() => setError('Unable to load plans'))
      .finally(() => setLoading(false))
  }, [memberId])

  const createPlan = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/transition-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          planType: formType,
          title: formTitle,
          targetDate: formTargetDate || null,
          familyCanSee: formFamilyVisible,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create plan')
      // Refresh plans
      const updated = await fetch(`/api/transition-plans?memberId=${memberId}`).then(r => r.json())
      setPlans(updated.plans ?? [])
      setShowForm(false)
      setFormTitle('Facility Move Plan')
      setFormType('facility_move')
      setFormTargetDate('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setCreating(false)
    }
  }

  const getProgress = (plan: PlanSummary) => {
    if (!plan.steps?.length) return 0
    const done = plan.steps.filter(s => s.completed_at).length
    return Math.round((done / plan.steps.length) * 100)
  }

  const STATUS_COLOR: Record<string, string> = {
    active: '#166534',
    on_hold: '#92400e',
    completed: '#1e3a5f',
    cancelled: '#991b1b',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>🏠 Transition Plans</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '7px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          + New Plan
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8f7f4', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: '#1e3a5f' }}>New transition plan for {memberName}</h4>

          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Plan Type</label>
          <select value={formType} onChange={e => { setFormType(e.target.value); setFormTitle(PLAN_TYPES.find(t => t.value === e.target.value)?.label.replace(/^[^\s]+ /, '') ?? 'Transition Plan') }}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }}>
            {PLAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Plan Title</label>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Target Move Date (optional)</label>
          <input type="date" value={formTargetDate} onChange={e => setFormTargetDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer', marginBottom: '16px' }}>
            <input type="checkbox" checked={formFamilyVisible} onChange={e => setFormFamilyVisible(e.target.checked)} />
            Family can see this plan
          </label>

          {error && <div style={{ color: '#991b1b', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={createPlan} disabled={creating || !formTitle.trim()}
              style={{ flex: 1, padding: '9px', background: creating ? '#9ca3af' : '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: creating ? 'default' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
              {creating ? 'Creating…' : 'Create 6-week plan'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '9px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '14px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: '14px', padding: '16px 0' }}>Loading plans…</div>
      ) : plans.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '14px', padding: '16px 0', textAlign: 'center' }}>No transition plans yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {plans.map(plan => {
            const pct = getProgress(plan)
            const done = plan.steps?.filter(s => s.completed_at).length ?? 0
            const total = plan.steps?.length ?? 0

            return (
              <a key={plan.id} href={`/navigator/transition-plans/${plan.id}`}
                style={{ background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textDecoration: 'none', color: 'inherit', display: 'block', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f' }}>{plan.title}</div>
                    {plan.target_date && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>Target: {new Date(plan.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLOR[plan.status] ?? '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: '10px' }}>
                    {plan.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Progress */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                    <span>{done}/{total} steps</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '99px', height: '6px' }}>
                    <div style={{ background: '#166534', height: '100%', width: `${pct}%`, borderRadius: '99px' }} />
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  {plan.family_can_see ? '👁 Visible to family' : '🔒 Hidden from family'} · Open plan →
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
