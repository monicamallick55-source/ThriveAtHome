'use client'

/**
 * app/dashboard/plan/page.tsx — Plan & Billing
 * TC-B007 (/dashboard/plan no 500), TC-M014 (plan + billing keywords), TC-PU001/PU002
 */

import { useState, useEffect } from 'react'

type PlanData = {
  plan_tier?: string
  billing_period?: string
  next_billing_date?: string
  amount?: number
}

export default function PlanPage() {
  const [planData, setPlanData] = useState<PlanData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/entitlements')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setPlanData({ plan_tier: data.plan_tier, billing_period: data.billing_period })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const tier = planData.plan_tier ?? 'basic'
  const isComplete = tier === 'complete'

  const PLANS = [
    {
      name: 'Basic',
      tier: 'basic',
      price: '$39/mo',
      annual: '$390/yr',
      features: [
        'Daily Aria check-in calls',
        '2 Navigator hours/month',
        '3 family member seats',
        'Community circles access',
        'Buddy matching',
        'Basic fraud protection',
      ],
    },
    {
      name: 'Complete',
      tier: 'complete',
      price: '$79/mo',
      annual: '$790/yr',
      features: [
        'Everything in Basic',
        '5 Navigator hours/month',
        'Unlimited family seats',
        'Life transitions support',
        'Encore career guidance',
        'Marketplace access (coming soon)',
        'Priority support',
      ],
    },
  ]

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', color: '#9ca3af' }}>
        Loading your plan…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Plan &amp; Billing</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Manage your subscription and billing information
      </p>

      {/* Current Plan */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Current Plan</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            padding: '6px 16px',
            background: isComplete ? '#dbeafe' : '#f3f4f6',
            color: isComplete ? '#1e40af' : '#4b5563',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'capitalize',
          }}>
            {tier} Plan
          </span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            {isComplete ? '$79/mo' : '$39/mo'}
          </span>
        </div>
        {planData.next_billing_date && (
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 10, marginBottom: 0 }}>
            Next billing date: {new Date(planData.next_billing_date).toLocaleDateString()}
          </p>
        )}
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <a
            href="/api/stripe/portal"
            style={{
              padding: '8px 18px',
              background: '#f3f4f6',
              color: '#374151',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Manage Billing
          </a>
          {!isComplete && (
            <a
              href="/dashboard/plan-comparison"
              style={{
                padding: '8px 18px',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Upgrade to Complete →
            </a>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Compare Plans</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {PLANS.map(plan => {
          const isCurrent = plan.tier === tier
          return (
            <div
              key={plan.tier}
              style={{
                background: '#fff',
                border: isCurrent ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 20,
                position: 'relative',
              }}
            >
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: -1,
                  right: 16,
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '0 0 6px 6px',
                }}>
                  Current
                </div>
              )}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>or {plan.annual} billed annually</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && plan.tier === 'complete' && (
                <a
                  href="/api/create-checkout-session"
                  style={{
                    display: 'block',
                    marginTop: 16,
                    padding: '9px 0',
                    background: '#2563eb',
                    color: '#fff',
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Upgrade Now
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
