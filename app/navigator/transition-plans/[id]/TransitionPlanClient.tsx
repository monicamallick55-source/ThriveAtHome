'use client'
// G7.15 — Transition plan detail with step-by-step checklist
import { useState, useCallback } from 'react'

interface Step {
  id: string
  step_number: number
  week_number: number
  title: string
  description: string
  due_date: string | null
  completed_at: string | null
  requires_transport: boolean
  notes: string | null
}

interface Plan {
  id: string
  title: string
  plan_type: string
  status: string
  started_at: string
  target_date: string | null
  family_can_see: boolean
  notes: string | null
  steps: Step[]
  member: { id: string; preferred_name: string | null; full_name: string; phone: string | null }
}

interface Props {
  plan: Plan
  navigatorId: string
}

const WEEK_LABELS: Record<number, string> = {
  1: 'Week 1 — Assessment & Planning',
  2: 'Week 2 — Decision & Paperwork',
  3: 'Week 3 — Medical & Financial Prep',
  4: 'Week 4 — Logistics',
  5: 'Week 5 — Move Day Prep',
  6: 'Week 6 — Adjustment & Follow-up',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#166534',
  on_hold: '#92400e',
  completed: '#1e3a5f',
  cancelled: '#991b1b',
}

const STATUS_BG: Record<string, string> = {
  active: '#dcfce7',
  on_hold: '#fef3c7',
  completed: '#dbeafe',
  cancelled: '#fee2e2',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TransitionPlanClient({ plan: initialPlan, navigatorId }: Props) {
  const [plan, setPlan] = useState(initialPlan)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [familyToggling, setFamilyToggling] = useState(false)

  const completedCount = plan.steps.filter(s => s.completed_at).length
  const pct = Math.round((completedCount / plan.steps.length) * 100)

  const toggleStep = useCallback(async (step: Step) => {
    const action = step.completed_at ? 'uncomplete_step' : 'complete_step'
    setLoading(step.id)
    setError(null)
    try {
      const res = await fetch('/api/transition-plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id, action, notes: action === 'complete_step' ? noteText : undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setPlan(prev => ({
        ...prev,
        steps: prev.steps.map(s =>
          s.id === step.id
            ? { ...s, completed_at: action === 'complete_step' ? new Date().toISOString() : null }
            : s
        ),
      }))
      if (action === 'complete_step') setNoteText('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(null)
    }
  }, [noteText])

  const toggleFamily = useCallback(async () => {
    setFamilyToggling(true)
    setError(null)
    try {
      const res = await fetch('/api/transition-plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, action: 'update_plan', familyCanSee: !plan.family_can_see }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setPlan(prev => ({ ...prev, family_can_see: !prev.family_can_see }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setFamilyToggling(false)
    }
  }, [plan.id, plan.family_can_see])

  // Group steps by week
  const stepsByWeek: Record<number, Step[]> = {}
  for (const step of plan.steps) {
    if (!stepsByWeek[step.week_number]) stepsByWeek[step.week_number] = []
    stepsByWeek[step.week_number].push(step)
  }

  const memberName = plan.member.preferred_name ?? plan.member.full_name.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f7f4', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Header */}
      <nav style={{ backgroundColor: '#1e3a5f', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#f8f7f4' }}>ThriveAtHome Navigator</span>
        <a href="/navigator" style={{ color: '#a5b4c8', fontSize: '14px', textDecoration: 'none' }}>← Back to Navigator</a>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Plan header */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transition Plan</div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>{plan.title}</h1>
              <div style={{ fontSize: '15px', color: '#4b5563', marginTop: '6px' }}>
                Member: <strong>{memberName}</strong>
                {plan.member.phone && <span style={{ marginLeft: '16px', color: '#9ca3af' }}>{plan.member.phone}</span>}
              </div>
            </div>
            <span style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              color: STATUS_COLORS[plan.status] ?? '#1f2937',
              background: STATUS_BG[plan.status] ?? '#f3f4f6',
            }}>{plan.status.replace('_', ' ').toUpperCase()}</span>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: '12px', color: '#9ca3af' }}>STARTED</span><div style={{ fontSize: '14px', color: '#374151' }}>{formatDate(plan.started_at)}</div></div>
            <div><span style={{ fontSize: '12px', color: '#9ca3af' }}>TARGET DATE</span><div style={{ fontSize: '14px', color: '#374151' }}>{formatDate(plan.target_date)}</div></div>
            <div>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>FAMILY VISIBILITY</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <button
                  onClick={toggleFamily}
                  disabled={familyToggling}
                  style={{
                    padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: plan.family_can_see ? '#dcfce7' : '#fee2e2',
                    color: plan.family_can_see ? '#166534' : '#991b1b',
                  }}
                >
                  {plan.family_can_see ? '👁 Visible to family' : '🔒 Hidden from family'}
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
              <span>{completedCount} of {plan.steps.length} steps complete</span>
              <span>{pct}%</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
              <div style={{ background: '#166534', height: '100%', width: `${pct}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Steps by week */}
        {Object.keys(stepsByWeek).map(weekStr => {
          const week = Number(weekStr)
          const weekSteps = stepsByWeek[week]
          const weekDone = weekSteps.every(s => s.completed_at)

          return (
            <div key={week} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, background: weekDone ? '#dcfce7' : '#e5e7eb', color: weekDone ? '#166534' : '#6b7280' }}>
                  {weekDone ? '✓' : week}
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e3a5f' }}>{WEEK_LABELS[week] ?? `Week ${week}`}</span>
              </div>

              <div style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {weekSteps.map((step, idx) => {
                  const done = !!step.completed_at
                  const isExpanded = expandedStep === step.id
                  const isLast = idx === weekSteps.length - 1

                  return (
                    <div key={step.id} style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px', cursor: 'pointer' }}
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={e => { e.stopPropagation(); toggleStep(step) }}
                          disabled={loading === step.id}
                          style={{
                            width: '22px', height: '22px', borderRadius: '50%', border: '2px solid', flexShrink: 0, cursor: 'pointer',
                            borderColor: done ? '#166534' : '#d1d5db',
                            background: done ? '#166534' : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {done && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: done ? 400 : 600, color: done ? '#9ca3af' : '#1f2937', textDecoration: done ? 'line-through' : 'none' }}>
                              {step.step_number}. {step.title}
                            </span>
                            {step.requires_transport && (
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>🚗 Transport</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>Due: {formatDate(step.due_date)}{done && ` · Completed ${formatDate(step.completed_at)}`}</div>
                        </div>

                        <span style={{ fontSize: '18px', color: '#9ca3af', userSelect: 'none' }}>{isExpanded ? '▴' : '▾'}</span>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '0 20px 16px 56px', background: '#fafafa' }}>
                          <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>{step.description}</p>

                          {!done && (
                            <div>
                              <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Optional notes for this step…"
                                rows={2}
                                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                              />
                              <button
                                onClick={() => toggleStep(step)}
                                disabled={loading === step.id}
                                style={{ marginTop: '8px', padding: '7px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                              >
                                {loading === step.id ? 'Saving…' : 'Mark complete'}
                              </button>
                            </div>
                          )}

                          {done && step.notes && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#166534' }}>
                              📝 {step.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
