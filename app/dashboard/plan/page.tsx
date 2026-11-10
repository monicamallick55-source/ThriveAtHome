import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$0',
    period: '/mo',
    color: '#6b7280',
    features: ['Daily check-in calls', 'Community circles', 'Volunteer matching', 'Basic safety alerts'],
  },
  {
    id: 'complete',
    name: 'Complete',
    price: '$29',
    period: '/mo',
    color: '#6366f1',
    badge: 'Most Popular',
    features: ['Everything in Basic', 'Dedicated navigator', 'Life transition support', 'Family portal access', 'Trusted advisor network', 'Priority support'],
  },
  {
    id: 'premier',
    name: 'Premier',
    price: '$79',
    period: '/mo',
    color: '#f59e0b',
    features: ['Everything in Complete', 'Unlimited navigator hours', 'Concierge care coordination', 'Home safety assessment', 'Medicare guidance', 'White-glove onboarding'],
  },
]

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', textAlign: 'center', marginBottom: 8 }}>Choose Your Plan</h1>
      <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>Upgrade anytime. Cancel anytime.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {PLANS.map(plan => (
          <div key={plan.id} data-plan={plan.id} style={{ border: `2px solid ${plan.color}`, borderRadius: 16, padding: '28px 24px', background: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {plan.badge && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {plan.badge}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1f2937' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: plan.color }}>{plan.price}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{plan.period}</span>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: '0.85rem', color: '#374151', display: 'flex', gap: 8 }}>
                  <span style={{ color: plan.color }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button style={{ marginTop: 'auto', padding: '10px 20px', background: plan.color, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              {plan.id === 'basic' ? 'Current plan' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.875rem' }}>← Back to dashboard</Link>
      </p>
    </div>
  )
}
