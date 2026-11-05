'use client'

import { useEffect, useState } from 'react'

interface Entitlement {
  navigator_hours_per_month: number
  buddy_calls_per_month: number
  group_events_per_month: number
  volunteer_requests_per_month: number
  ai_calls_per_month: number
  family_members: number
  can_access_marketplace: boolean
  can_access_encore_careers: boolean
  can_access_home_safety: boolean
}

interface Usage {
  buddy_calls_this_month: number
  volunteer_requests_this_month: number
  navigator_tasks_this_month: number
}

interface EntitlementData {
  tier: string
  subscription_status: string
  entitlements: Entitlement
  usage: Usage
  limits_remaining: {
    buddy_calls: number
    volunteer_requests: number
  }
}

const TIER_LABELS: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

const TIER_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  standard: 'bg-teal-100 text-teal-800',
  premium: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit >= 999 ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isUnlimited = limit >= 999
  const isNearLimit = pct >= 80

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${isNearLimit && !isUnlimited ? 'text-red-600' : 'text-gray-700'}`}>
          {isUnlimited ? `${used} used (unlimited)` : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-teal-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function FeatureBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${enabled ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-400'}`}>
      <span>{enabled ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  )
}

export default function PlanEntitlementsPage() {
  const [data, setData] = useState<EntitlementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/entitlements')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
    </div>
  )

  if (!data) return null

  const { tier, subscription_status, entitlements: ent, usage } = data
  const tierLabel = TIER_LABELS[tier] ?? tier
  const tierColor = TIER_COLORS[tier] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Plan</h1>
        <p className="text-gray-500 mt-1">Track your monthly usage and feature access</p>
      </div>

      {/* Plan header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-1 ${tierColor}`}>
            {tierLabel} Plan
          </div>
          <div className={`text-sm ${subscription_status === 'active' ? 'text-teal-600' : 'text-red-500'}`}>
            {subscription_status === 'active' ? '● Active' : `● ${subscription_status}`}
          </div>
        </div>
        {tier !== 'premium' && tier !== 'enterprise' && (
          <a
            href="/pricing"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            Upgrade Plan
          </a>
        )}
      </div>

      {/* Monthly usage */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Monthly Usage</h2>
        <UsageBar
          used={usage.buddy_calls_this_month}
          limit={ent.buddy_calls_per_month}
          label="Buddy Calls"
        />
        <UsageBar
          used={usage.volunteer_requests_this_month}
          limit={ent.volunteer_requests_per_month}
          label="Volunteer Requests"
        />
        <UsageBar
          used={usage.navigator_tasks_this_month}
          limit={ent.navigator_hours_per_month}
          label="Navigator Sessions"
        />
        <UsageBar
          used={0}
          limit={ent.group_events_per_month}
          label="Group Events"
        />
        <UsageBar
          used={0}
          limit={ent.ai_calls_per_month}
          label="AI Assistant Uses"
        />

        <p className="text-xs text-gray-400 mt-2">Usage resets on the 1st of each month.</p>
      </div>

      {/* Plan limits summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Plan Limits</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Navigator Sessions/mo</div>
            <div className="font-semibold text-gray-800">
              {ent.navigator_hours_per_month >= 999 ? 'Unlimited' : ent.navigator_hours_per_month}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Buddy Calls/mo</div>
            <div className="font-semibold text-gray-800">
              {ent.buddy_calls_per_month >= 999 ? 'Unlimited' : ent.buddy_calls_per_month}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Group Events/mo</div>
            <div className="font-semibold text-gray-800">
              {ent.group_events_per_month >= 999 ? 'Unlimited' : ent.group_events_per_month}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Family Members</div>
            <div className="font-semibold text-gray-800">
              {ent.family_members >= 999 ? 'Unlimited' : ent.family_members}
            </div>
          </div>
        </div>
      </div>

      {/* Feature access */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Feature Access</h2>
        <div className="grid grid-cols-1 gap-2">
          <FeatureBadge enabled={ent.can_access_home_safety} label="Home Safety Assessment" />
          <FeatureBadge enabled={ent.can_access_marketplace} label="Services Marketplace" />
          <FeatureBadge enabled={ent.can_access_encore_careers} label="Encore Careers" />
        </div>

        {tier === 'basic' && (
          <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg p-3 text-sm text-teal-700">
            Upgrade to <strong>Standard</strong> to unlock the Services Marketplace and Encore Careers.
          </div>
        )}
      </div>
    </div>
  )
}
