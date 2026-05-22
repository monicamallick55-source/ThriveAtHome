'use client'

import { useState } from 'react'
import { STRIPE_PLANS } from '@/lib/stripe/config'
import type { PlanTier } from '@/lib/interfaces/BillingProvider'
import type { Subscription } from '@/lib/data/billing'

const TIER_LABELS: Record<PlanTier, string> = {
  basics: 'Thrive Basics',
  connect: 'Thrive Connect',
  complete: 'Thrive Complete',
  premier: 'Thrive Premier',
}

type Props = {
  currentTier: PlanTier
  subscription: Subscription | null
  memberName: string
}

export function BillingClient({ currentTier, subscription, memberName }: Props) {
  const [manageLoading, setManageLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState<PlanTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  const TIER_ORDER: PlanTier[] = ['basics', 'connect', 'complete', 'premier']
  const currentIndex = TIER_ORDER.indexOf(currentTier)

  async function handleManage() {
    setManageLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Portal unavailable')
      window.location.href = data.portalUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setManageLoading(false)
    }
  }

  async function handleUpgrade(tier: PlanTier) {
    setUpgradeLoading(tier)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout')
      window.location.href = data.checkoutUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setUpgradeLoading(null)
    }
  }

  const currentPlan = STRIPE_PLANS[currentTier]

  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Current plan card */}
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', padding: '32px', marginBottom: '32px', boxShadow: 'var(--shadow-card)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Current plan
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>
          {currentPlan.name}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          ${currentPlan.price}/month for {memberName}
        </p>

        {subscription?.current_period_end && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Next billing date: {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
          </p>
        )}

        {subscription?.stripe_customer_id ? (
          <button
            onClick={handleManage}
            disabled={manageLoading}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--color-navy)',
              backgroundColor: 'transparent',
              border: '2px solid var(--color-navy)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 24px',
              minHeight: '48px',
              cursor: manageLoading ? 'not-allowed' : 'pointer',
              opacity: manageLoading ? 0.6 : 1,
            }}
          >
            {manageLoading ? 'Opening portal…' : 'Manage subscription'}
          </button>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            No active subscription on file — choose a plan below to get started.
          </p>
        )}
      </div>

      {/* Upgrade options */}
      {currentIndex < TIER_ORDER.length - 1 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>
            Upgrade your plan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {TIER_ORDER.slice(currentIndex + 1).map((tier) => {
              const plan = STRIPE_PLANS[tier]
              return (
                <div key={tier} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>{plan.name}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)' }}>${plan.price}/month</p>
                  </div>
                  <button
                    onClick={() => handleUpgrade(tier)}
                    disabled={upgradeLoading !== null}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: 'white',
                      backgroundColor: 'var(--color-teal)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 24px',
                      minHeight: '48px',
                      cursor: upgradeLoading !== null ? 'not-allowed' : 'pointer',
                      opacity: upgradeLoading !== null ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {upgradeLoading === tier ? 'Starting checkout…' : `Upgrade to ${TIER_LABELS[tier]}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" style={{ marginTop: '20px', backgroundColor: 'var(--color-urgent-bg)', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
