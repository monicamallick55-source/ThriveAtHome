export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const FEATURES = [
  { label: 'Daily check-in calls',        basics: true,  complete: true,  premier: true  },
  { label: 'Community circles',           basics: true,  complete: true,  premier: true  },
  { label: 'Volunteer matching',          basics: true,  complete: true,  premier: true  },
  { label: 'Basic safety alerts',         basics: true,  complete: true,  premier: true  },
  { label: 'Dedicated navigator',         basics: false, complete: true,  premier: true  },
  { label: 'Life transition support',     basics: false, complete: true,  premier: true  },
  { label: 'Family portal access',        basics: false, complete: true,  premier: true  },
  { label: 'Trusted advisor network',     basics: false, complete: true,  premier: true  },
  { label: 'Unlimited navigator hours',   basics: false, complete: false, premier: true  },
  { label: 'Concierge care coordination', basics: false, complete: false, premier: true  },
  { label: 'Home safety assessment',      basics: false, complete: false, premier: true  },
  { label: 'Medicare guidance',           basics: false, complete: false, premier: true  },
]

const TIERS = [
  { id: 'basics',   name: 'Basics',   price: '$0',  color: '#6b7280' },
  { id: 'complete', name: 'Complete', price: '$29', color: '#6366f1' },
  { id: 'premier',  name: 'Premier',  price: '$79', color: '#f59e0b' },
]

export default async function PlanComparisonPage() {
  let user = null
  try {
    const supabase = await Promise.race([
      createClient(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)) as any
    ])
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}
  if (!user) redirect('/login')

  return (
    <div style={{ maxWidth: 860, margin: '48px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', textAlign: 'center', marginBottom: 8 }}>Compare Plans</h1>
      <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>Find the right level of support for your needs.</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>Feature</th>
              {TIERS.map(t => (
                <th key={t.id} style={{ textAlign: 'center', padding: '12px 16px', color: t.color, fontWeight: 800 }}>
                  {t.name}<br />
                  <span style={{ fontSize: '1.1rem' }}>{t.price}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/mo</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f, i) => (
              <tr key={f.label} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                <td style={{ padding: '10px 16px', color: '#374151' }}>{f.label}</td>
                {TIERS.map(t => (
                  <td key={t.id} style={{ textAlign: 'center', padding: '10px 16px' }}>
                    {(f as any)[t.id] ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', marginTop: 28 }}>
        <Link href="/dashboard/plan" style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
          Upgrade now →
        </Link>
      </p>
    </div>
  )
}
