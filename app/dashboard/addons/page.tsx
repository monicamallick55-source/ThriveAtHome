import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ADDONS = [
  {
    id: 'extra-navigator-hours',
    name: 'Extra Navigator Hours',
    desc: 'Add 2 more monthly navigator hours to your plan. Perfect if you need extra support during a life transition.',
    price: '$29/mo',
    badge: 'Most popular',
    keywords: 'extra navigator hours block',
  },
  {
    id: 'premium-content',
    name: 'Premium Content Access',
    desc: 'Unlock exclusive masterclasses, expert webinars, and in-depth guides on health, finance, and independence.',
    price: '$9/mo',
    badge: null,
    keywords: 'premium content access',
  },
  {
    id: 'enhanced-fraud-monitoring',
    name: 'Enhanced Fraud Monitoring',
    desc: 'Real-time alerts for suspicious calls, texts, and financial activity — with a dedicated fraud navigator on-call.',
    price: '$19/mo',
    badge: 'Recommended',
    keywords: 'enhanced fraud monitoring',
  },
  {
    id: 'family-care-coordination',
    name: 'Family Care Coordination',
    desc: 'Add up to 3 family members with full access to wellness updates, shared calendar, and care planning tools.',
    price: '$14/mo',
    badge: null,
    keywords: 'family care coordination',
  },
]

export default async function AddonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Add-ons</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Customize your ThriveAtHome plan with optional add-ons.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {ADDONS.map(a => (
          <div key={a.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', lineHeight: 1.3 }}>{a.name}</div>
              {a.badge && <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>{a.badge}</span>}
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0, lineHeight: 1.6, flexGrow: 1 }}>{a.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#1f2937', fontSize: '1rem' }}>{a.price}</span>
              <button style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                Add to plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
