import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getMemberSubscription } from '@/lib/data/billing'
import { BillingClient } from '@/components/billing/BillingClient'
import type { PlanTier } from '@/lib/interfaces/BillingProvider'

export const metadata: Metadata = { title: 'Billing — ThriveAtHome' }

export default async function BillingPage() {
  const user = await requireAuth()

  const { data: member } = await getMemberForAuthUser(user.id)
  const subscription = member
    ? (await getMemberSubscription(member.id)).data
    : null

  const currentTier = (member?.plan_tier ?? 'basics') as PlanTier
  const memberName = member?.preferred_name ?? member?.full_name?.split(' ')[0] ?? 'your loved one'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>

      <div style={{ backgroundColor: 'var(--color-navy)', padding: '40px 24px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 500, color: 'white', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            Billing &amp; Subscription
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(255,255,255,0.75)' }}>
            Manage your ThriveAtHome plan
          </p>
        </div>
      </div>

      <main style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {!member ? (
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', padding: '32px', maxWidth: '480px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Complete your loved one's profile before managing billing.
              </p>
              <Link href="/onboarding" style={{ fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, color: 'white', backgroundColor: 'var(--color-navy)', textDecoration: 'none', padding: '12px 24px', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', minHeight: '48px' }}>
                Start onboarding
              </Link>
            </div>
          ) : (
            <BillingClient
              currentTier={currentTier}
              subscription={subscription}
              memberName={memberName}
            />
          )}
        </div>
      </main>
    </div>
  )
}
