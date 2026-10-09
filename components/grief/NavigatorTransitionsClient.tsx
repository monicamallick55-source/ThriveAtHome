'use client'
// components/grief/NavigatorTransitionsClient.tsx
// Navigator console: manage facility move plans and advisor connection requests

import { useState } from 'react'

interface Step {
  id: string
  week_number: number
  title: string
  completed_at: string | null
  category: string
  sort_order: number
}

interface Plan {
  id: string
  created_at: string
  title: string
  status: string
  family_can_view: boolean
  target_move_date?: string
  facility_name?: string
  notes?: string
  member: { id: string; full_name: string; preferred_name: string | null }
  steps: Step[]
}

interface Connection {
  id: string
  created_at: string
  status: string
  member_note?: string
  navigator_notes?: string
  introduced_at?: string
  member: { id: string; full_name: string; preferred_name: string | null }
  advisor: { id: string; full_name: string; advisor_type: string; specialty?: string }
}

interface Member {
  id: string
  full_name: string
  preferred_name: string | null
}

interface Props {
  plans: Plan[]
  connections: Connection[]
  members: Member[]
}

function displayName(m: { full_name: string; preferred_name: string | null }) {
  return m.preferred_name ?? m.full_name
}

const WEEK_LABELS = ['Week 1 — Research', 'Week 2 — Visits', 'Week 3 — Paperwork', 'Week 4 — Family', 'Week 5 — Moving Day', 'Week 6 — Post-Move']

export default function NavigatorTransitionsClient({ plans: initialPlans, connections: initialConnections, members }: Props) {
  const [plans, setPlans] = useState(initialPlans)
  const [connections, setConnections] = useState(initialConnections)
  const [activeTab, setActiveTab] = useState<'plans' | 'intros'>('plans')
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [togglingStep, setTogglingStep] = useState<string | null>(null)

  // Create plan form state
  const [newPlan, setNewPlan] = useState({
    member_id: '',
    title: 'Facility Move Plan',
    facility_name: '',
    target_move_date: '',
    family_can_view: false,
  })

  async function handleCreatePlan() {
    if (!newPlan.member_id) return
    setCreating(true)
    try {
      const res = await fetch('/api/transition-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      })
      const j = await res.json() as { plan: Plan & { steps?: Step[] } }
      // Reload to get steps
      const refreshRes = await fetch(`/api/transition-plans?member_id=${newPlan.member_id}`)
      const refreshJ = await refreshRes.json() as { plans: Plan[] }
      setPlans(refreshJ.plans ?? [])
      setShowCreateForm(false)
      setNewPlan({ member_id: '', title: 'Facility Move Plan', facility_name: '', target_move_date: '', family_can_view: false })
      setExpandedPlan(j.plan?.id ?? null)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleStep(planId: string, stepId: string, currentlyComplete: boolean) {
    setTogglingStep(stepId)
    try {
      await fetch(`/api/transition-plans/${planId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId, completed: !currentlyComplete }),
      })
      setPlans(prev => prev.map(p =>
        p.id !== planId ? p : {
          ...p,
          steps: p.steps.map(s =>
            s.id !== stepId ? s : { ...s, completed_at: currentlyComplete ? null : new Date().toISOString() }
          ),
        }
      ))
    } finally {
      setTogglingStep(null)
    }
  }

  async function handleToggleFamilyAccess(plan: Plan) {
    await fetch(`/api/transition-plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_can_view: !plan.family_can_view }),
    })
    setPlans(prev => prev.map(p => p.id !== plan.id ? p : { ...p, family_can_view: !p.family_can_view }))
  }

  async function handleUpdateConnectionStatus(connectionId: string, status: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await fetch('/api/advisor-connections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId, status }),
    })
    setConnections(prev => prev.map(c => c.id !== connectionId ? c : { ...c, status }))
  }

  const CATEGORY_LABELS: Record<string, string> = {
    therapist: 'Therapist',
    grief_counselor: 'Grief Counselor',
    chaplain: 'Chaplain',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Life Transitions</h1>
          <p className="text-gray-500 mt-1">Manage facility move plans and professional introduction requests.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          + New Move Plan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['plans', 'intros'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'plans' ? `Move Plans (${plans.length})` : `Intro Requests (${connections.length})`}
          </button>
        ))}
      </div>

      {/* Create plan form */}
      {showCreateForm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Facility Move Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={newPlan.member_id}
                onChange={e => setNewPlan(p => ({ ...p, member_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select member…</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{displayName(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan title</label>
              <input
                value={newPlan.title}
                onChange={e => setNewPlan(p => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Facility name</label>
              <input
                value={newPlan.facility_name}
                onChange={e => setNewPlan(p => ({ ...p, facility_name: e.target.value }))}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target move date</label>
              <input
                type="date"
                value={newPlan.target_move_date}
                onChange={e => setNewPlan(p => ({ ...p, target_move_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="family_can_view"
                checked={newPlan.family_can_view}
                onChange={e => setNewPlan(p => ({ ...p, family_can_view: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label htmlFor="family_can_view" className="text-sm text-gray-700">Family can see this plan</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreatePlan}
              disabled={creating || !newPlan.member_id}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : 'Create 6-week plan'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans tab */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {plans.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No active move plans. Create one above.
            </div>
          )}
          {plans.map(plan => {
            const isExpanded = expandedPlan === plan.id
            const totalSteps = plan.steps.length
            const doneSteps = plan.steps.filter(s => s.completed_at).length
            return (
              <div key={plan.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="w-full text-left p-5 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{plan.title}</p>
                      {plan.family_can_view && (
                        <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">Family visible</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{displayName(plan.member)}</p>
                    {plan.facility_name && <p className="text-xs text-gray-400">{plan.facility_name}</p>}
                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: totalSteps ? `${Math.round((doneSteps / totalSteps) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{doneSteps}/{totalSteps}</span>
                    </div>
                  </div>
                  <svg
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFamilyAccess(plan)}
                        className="text-xs rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {plan.family_can_view ? 'Hide from family' : 'Share with family'}
                      </button>
                    </div>

                    {WEEK_LABELS.map((weekLabel, wi) => {
                      const weekNum = wi + 1
                      const weekSteps = plan.steps
                        .filter(s => s.week_number === weekNum)
                        .sort((a, b) => a.sort_order - b.sort_order)
                      if (weekSteps.length === 0) return null
                      return (
                        <div key={weekNum}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{weekLabel}</p>
                          <div className="space-y-2">
                            {weekSteps.map(step => (
                              <div key={step.id} className="flex items-start gap-3">
                                <button
                                  onClick={() => handleToggleStep(plan.id, step.id, !!step.completed_at)}
                                  disabled={togglingStep === step.id}
                                  className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${step.completed_at ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-400'}`}
                                >
                                  {step.completed_at && (
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <p className={`text-sm ${step.completed_at ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {step.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Intro requests tab */}
      {activeTab === 'intros' && (
        <div className="space-y-3">
          {connections.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No pending introduction requests.
            </div>
          )}
          {connections.map(conn => (
            <div key={conn.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{displayName(conn.member)}</p>
                  <p className="text-sm text-gray-500">
                    Requested intro to <span className="font-medium">{conn.advisor.full_name}</span>
                    {" "}({CATEGORY_LABELS[conn.advisor.advisor_type] ?? conn.advisor.advisor_type})
                  </p>
                  {conn.member_note && (
                    <p className="text-sm text-gray-600 mt-1 italic">{conn.member_note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleUpdateConnectionStatus(conn.id, 'intro_sent')}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Mark intro sent
                  </button>
                  <button
                    onClick={() => handleUpdateConnectionStatus(conn.id, 'declined')}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
