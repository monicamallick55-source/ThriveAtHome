'use client'
// components/navigator/NavigatorPlanManager.tsx
// G5.7 — Navigator assigns plans + add-ons to members

import { useState, useEffect, useCallback } from 'react'

interface Member { id: string; full_name: string; preferred_name: string | null }
interface Plan { id: string; name: string; slug: string; price_cents: number; billing_interval: string; description: string }
interface Addon { id: string; name: string; slug: string; price_cents: number; billing_interval: string; description: string; category: string }
interface MemberPlan {
  id: string; plan_id: string; status: string; started_at: string
  plans: { name: string; slug: string }
}
interface MemberAddon {
  id: string; addon_id: string; status: string
  addon_skus: { name: string; slug: string }
}

function fmt(cents: number, interval: string) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(0)}/${interval === 'one_time' ? 'one time' : interval}`
}

export default function NavigatorPlanManager({ members }: { members: Member[] }) {
  const [selectedMember, setSelectedMember] = useState(members[0]?.id ?? '')
  const [plans, setPlans] = useState<Plan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [memberPlan, setMemberPlan] = useState<MemberPlan | null>(null)
  const [memberAddons, setMemberAddons] = useState<MemberAddon[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [msg, setMsg] = useState('')
  const [trialDays, setTrialDays] = useState(0)

  // Load plans catalog once
  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => {
        setPlans(data.plans ?? [])
        setAddons(data.addons ?? [])
      })
  }, [])

  const loadMemberPlans = useCallback(async () => {
    if (!selectedMember) return
    setLoading(true)
    try {
      // Re-use the plans endpoint but we need member-specific data
      // Hit the assign endpoint to get member's current assignments via plans GET
      const res = await fetch(`/api/plans`)
      if (res.ok) {
        const data = await res.json()
        setMemberPlan(data.member_plan ?? null)
        setMemberAddons(data.member_addons ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMember])

  useEffect(() => { loadMemberPlans() }, [loadMemberPlans])

  async function assignPlan(planId: string) {
    setAssigning(true)
    try {
      const res = await fetch('/api/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember,
          plan_id: planId,
          trial_days: trialDays > 0 ? trialDays : undefined,
        }),
      })
      if (res.ok) {
        setMsg('Plan assigned!')
        setTimeout(() => setMsg(''), 3000)
        loadMemberPlans()
      }
    } finally {
      setAssigning(false)
    }
  }

  async function assignAddon(addonId: string) {
    setAssigning(true)
    try {
      const res = await fetch('/api/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: selectedMember, addon_id: addonId }),
      })
      if (res.ok) {
        setMsg('Add-on activated!')
        setTimeout(() => setMsg(''), 3000)
        loadMemberPlans()
      }
    } finally {
      setAssigning(false)
    }
  }

  async function cancelAddon(memberAddonId: string) {
    await fetch('/api/plans/assign', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_addon_id: memberAddonId }),
    })
    setMsg('Add-on cancelled')
    setTimeout(() => setMsg(''), 3000)
    loadMemberPlans()
  }

  const memberName = (id: string) => {
    const m = members.find(m => m.id === id)
    return m ? (m.preferred_name ?? m.full_name) : id
  }

  const activeAddonIds = new Set(memberAddons.map(a => a.addon_id))

  return (
    <div className="space-y-6">
      {/* Member picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
        <select
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.preferred_name ?? m.full_name}</option>
          ))}
        </select>
      </div>

      {msg && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">{msg}</div>
      )}

      {/* Current plan */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current plan</p>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : memberPlan ? (
          <div className="flex items-center gap-3">
            <p className="font-semibold text-gray-900">{memberPlan.plans.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              memberPlan.status === 'active' ? 'bg-green-100 text-green-800' :
              memberPlan.status === 'trial' ? 'bg-amber-100 text-amber-800' :
              'bg-gray-100 text-gray-600'
            }`}>{memberPlan.status}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No plan assigned</p>
        )}

        {/* Active add-ons */}
        {memberAddons.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-gray-500">Active add-ons:</p>
            {memberAddons.map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <span className="text-sm text-green-800">✓ {a.addon_skus.name}</span>
                <button
                  onClick={() => cancelAddon(a.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trial option */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-700 flex-shrink-0">Trial days (0 = no trial):</label>
        <input
          type="number"
          min={0}
          max={90}
          value={trialDays}
          onChange={e => setTrialDays(parseInt(e.target.value) || 0)}
          className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Plan grid */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Assign plan</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map(plan => {
            const isCurrent = memberPlan?.plan_id === plan.id
            return (
              <div key={plan.id} className={`rounded-xl border-2 p-4 ${isCurrent ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-indigo-700 font-medium text-sm mt-0.5">{fmt(plan.price_cents, plan.billing_interval)}</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{plan.description}</p>
                {!isCurrent && (
                  <button
                    onClick={() => assignPlan(plan.id)}
                    disabled={assigning}
                    className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning…' : `Assign ${plan.name}`}
                  </button>
                )}
                {isCurrent && (
                  <p className="mt-3 text-center text-xs font-medium text-indigo-600">✓ Current plan</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Add-ons</p>
        <div className="space-y-2">
          {addons.map(addon => {
            const isActive = activeAddonIds.has(addon.id)
            return (
              <div key={addon.id} className={`rounded-xl border p-3 flex items-center gap-3 ${isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                  <p className="text-xs text-gray-500">{addon.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-semibold text-indigo-700">{fmt(addon.price_cents, addon.billing_interval)}</p>
                  {isActive ? (
                    <span className="text-xs text-green-700 font-medium">Active</span>
                  ) : (
                    <button
                      onClick={() => assignAddon(addon.id)}
                      disabled={assigning}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                    >
                      Add →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
