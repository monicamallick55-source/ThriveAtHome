'use client'
// components/plans/MemberPlanCard.tsx
// G5.7 — Member-facing plan + add-on display

import { useState, useEffect } from 'react'

interface Plan {
  id: string; name: string; slug: string; description: string
  price_cents: number; billing_interval: string
  entitlements: Record<string, unknown>
}
interface Addon {
  id: string; name: string; slug: string; description: string
  price_cents: number; billing_interval: string; category: string
}
interface MemberPlan {
  id: string; plan_id: string; status: string; started_at: string; trial_ends_at: string | null
  plans: { name: string; slug: string; entitlements: Record<string, unknown> }
}
interface MemberAddon {
  id: string; addon_id: string; status: string
  addon_skus: { name: string; slug: string; entitlement_key: string | null }
}

const ENTITLEMENT_LABELS: Record<string, string> = {
  daily_checkins: 'Daily check-ins',
  safety_alerts: 'Safety alerts',
  family_summaries: 'Family daily summaries',
  ride_bookings: 'Ride bookings',
  life_transitions: 'Life transitions support',
  volunteer_hours: 'Volunteer hours',
  priority_navigator: 'Priority navigator access',
  concierge_support: 'Concierge support',
}

function formatPrice(cents: number, interval: string) {
  if (cents === 0) return 'Free'
  const dollars = (cents / 100).toFixed(0)
  return `$${dollars}/${interval === 'one_time' ? 'one time' : interval}`
}

export default function MemberPlanCard() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [memberPlan, setMemberPlan] = useState<MemberPlan | null>(null)
  const [memberAddons, setMemberAddons] = useState<MemberAddon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => {
        setPlans(data.plans ?? [])
        setAddons(data.addons ?? [])
        setMemberPlan(data.member_plan ?? null)
        setMemberAddons(data.member_addons ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="py-12 text-center">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  )

  const currentPlanSlug = memberPlan?.plans?.slug
  const activeAddonSlugs = new Set(memberAddons.map(a => a.addon_skus?.slug))
  const entitlements = memberPlan?.plans?.entitlements ?? {}

  return (
    <div className="space-y-8">
      {/* Current plan */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan</h2>
        {memberPlan ? (
          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-indigo-900">{memberPlan.plans.name}</p>
                {memberPlan.status === 'trial' && memberPlan.trial_ends_at && (
                  <p className="text-sm text-amber-700 mt-0.5">
                    Trial ends {new Date(memberPlan.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white capitalize">
                {memberPlan.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(entitlements).map(([key, val]) => {
                const label = ENTITLEMENT_LABELS[key]
                if (!label) return null
                const isOn = val === true || (typeof val === 'number' && val !== 0)
                return (
                  <div key={key} className={`flex items-center gap-2 text-sm ${isOn ? 'text-indigo-800' : 'text-gray-400 line-through'}`}>
                    <span>{isOn ? '✓' : '✗'}</span>
                    <span>{label}
                      {typeof val === 'number' && val > 0 && ` (${val}/mo)`}
                      {typeof val === 'number' && val === -1 && ' (unlimited)'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">No plan assigned yet. Contact your navigator to get started.</p>
          </div>
        )}
      </section>

      {/* Available plans */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map(plan => {
            const isCurrent = plan.slug === currentPlanSlug
            return (
              <div
                key={plan.id}
                className={`rounded-xl border-2 p-4 ${
                  isCurrent ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'
                }`}
              >
                {isCurrent && (
                  <p className="text-xs font-semibold text-indigo-600 mb-2">✓ Current plan</p>
                )}
                <p className="font-bold text-gray-900">{plan.name}</p>
                <p className="text-lg font-semibold text-indigo-700 mt-1">
                  {formatPrice(plan.price_cents, plan.billing_interval)}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{plan.description}</p>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">To change your plan, contact your Thrive@Home navigator.</p>
      </section>

      {/* Active add-ons */}
      {memberAddons.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Add-ons</h2>
          <div className="space-y-2">
            {memberAddons.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <span className="text-green-600">✓</span>
                <p className="text-sm font-medium text-green-900">{a.addon_skus.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add-on catalog */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Add-ons</h2>
        <div className="space-y-3">
          {addons.map(addon => {
            const isActive = activeAddonSlugs.has(addon.slug)
            return (
              <div
                key={addon.id}
                className={`rounded-xl border p-4 flex items-center gap-4 ${
                  isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{addon.name}</p>
                    {isActive && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                </div>
                <p className="text-sm font-semibold text-indigo-700 flex-shrink-0">
                  {formatPrice(addon.price_cents, addon.billing_interval)}
                </p>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">Ask your navigator to add any of these to your plan.</p>
      </section>
    </div>
  )
}
