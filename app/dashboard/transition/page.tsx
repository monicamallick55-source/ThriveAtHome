'use client'

/**
 * app/dashboard/transition/page.tsx — G7.15 Facility-Move Planning
 *
 * Member (and optionally family) sees their transition plan checklist.
 * Navigator creates the plan; member sees and marks steps complete.
 */

import { useState, useEffect } from 'react'

type TransitionStep = {
  id: string
  title: string
  description?: string
  sort_order: number
  due_date?: string
  completed: boolean
  completed_at?: string
  family_can_see: boolean
}

type TransitionPlan = {
  id: string
  created_at: string
  title: string
  facility_name?: string
  move_date?: string
  status: string
  family_can_see: boolean
  steps: TransitionStep[]
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: 'Active',     bg: '#dbeafe', color: '#1e40af' },
    completed: { label: 'Completed ✓', bg: '#d1fae5', color: '#065f46' },
    cancelled: { label: 'Cancelled',  bg: '#fee2e2', color: '#991b1b' },
    on_hold:   { label: 'On Hold',    bg: '#fef3c7', color: '#92400e' },
  }
  const s = map[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' }
  return <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: s.bg, color: s.color }}>{s.label}</span>
}

export default function TransitionPage() {
  const [plans, setPlans] = useState<TransitionPlan[]>([])
  const [selected, setSelected] = useState<TransitionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { loadPlans() }, [])

  async function loadPlans() {
    setLoading(true)
    try {
      const res = await fetch('/api/transition-plans')
      const data = await res.json()
      const p = data.plans ?? []
      setPlans(p)
      if (p.length === 1) setSelected(p[0])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function completeStep(planId: string, stepId: string) {
    setCompleting(stepId)
    try {
      const res = await fetch(`/api/transition-plans/${planId}/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      if (!res.ok) { showToast('Could not update step'); return }
      // Optimistic update
      setSelected(prev => {
        if (!prev) return prev
        const steps = prev.steps.map(s =>
          s.id === stepId ? { ...s, completed: true, completed_at: new Date().toISOString() } : s
        )
        const allDone = steps.every(s => s.completed)
        return { ...prev, steps, status: allDone ? 'completed' : prev.status }
      })
      setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p
        const steps = p.steps.map(s =>
          s.id === stepId ? { ...s, completed: true, completed_at: new Date().toISOString() } : s
        )
        return { ...p, steps }
      }))
      showToast('✅ Step marked complete!')
    } finally {
      setCompleting(null)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', textAlign: 'center', paddingTop: 60 }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Life transitions: transition, life change, major life event, retirement, new chapter</span>
        <p style={{ color: '#9ca3af' }}>Loading your transition plan…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>My Transition Plan</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>
        Your navigator has created a step-by-step checklist to help your move go smoothly.
      </p>

      {plans.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 48, color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p>No transition plan yet. Your navigator will create one when it's time.</p>
          <p style={{ fontSize: '0.82rem', marginTop: 8 }}>Questions? Call us — Grace is always here.</p>
        </div>
      ) : (
        <div>
          {/* Plan selector if multiple */}
          {plans.length > 1 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {plans.map(p => (
                <button key={p.id} onClick={() => setSelected(p)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selected?.id === p.id ? '#6366f1' : '#e5e7eb'}`, background: selected?.id === p.id ? '#f5f3ff' : '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: '#374151' }}>
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div>
              {/* Plan header */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', background: '#fafafa', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>{selected.title}</div>
                    {selected.facility_name && (
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>📍 {selected.facility_name}</div>
                    )}
                    {selected.move_date && (
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>
                        📅 Move date: {new Date(selected.move_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  {statusBadge(selected.status)}
                </div>

                {/* Progress bar */}
                {selected.steps.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                      <span>{selected.steps.filter(s => s.completed).length} of {selected.steps.length} steps complete</span>
                      <span>{Math.round((selected.steps.filter(s => s.completed).length / selected.steps.length) * 100)}%</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${(selected.steps.filter(s => s.completed).length / selected.steps.length) * 100}%`,
                        background: selected.status === 'completed' ? '#10b981' : '#6366f1',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.steps.sort((a, b) => a.sort_order - b.sort_order).map((step, i) => (
                  <div key={step.id} style={{
                    border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px',
                    background: step.completed ? '#f0fdf4' : '#fff',
                    borderLeft: `4px solid ${step.completed ? '#10b981' : '#6366f1'}`,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                      {step.completed ? '✅' : `${i + 1}.`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem', color: step.completed ? '#065f46' : '#1f2937' }}>
                        {step.title}
                      </div>
                      {step.description && (
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3, lineHeight: 1.4 }}>{step.description}</div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                        {step.due_date && `Due: ${new Date(step.due_date).toLocaleDateString()}`}
                        {step.completed && step.completed_at && ` · Done ${new Date(step.completed_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    {!step.completed && (
                      <button
                        onClick={() => completeStep(selected.id, step.id)}
                        disabled={completing === step.id}
                        style={{ padding: '6px 14px', border: '1px solid #6366f1', color: '#6366f1', background: '#fff', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                        {completing === step.id ? '…' : 'Done'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {selected.status === 'completed' && (
                <div style={{ marginTop: 24, textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: 14 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                  <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1rem' }}>All steps complete!</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>Your navigator will follow up at week 1, month 1, and month 3.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
