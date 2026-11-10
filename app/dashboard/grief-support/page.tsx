import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const PATHWAYS = [
  { slug: 'loss',       icon: '🕊️', title: 'Loss of a Loved One',         desc: 'Support after losing a spouse, partner, family member or close friend.' },
  { slug: 'widow',      icon: '💙', title: 'Widowhood',                    desc: 'Practical and emotional support for navigating life after losing a spouse.' },
  { slug: 'diagnosis',  icon: '🏥', title: 'New Diagnosis',                desc: 'Help understanding a new health diagnosis and planning next steps.' },
  { slug: 'caregiving', icon: '🤝', title: 'Caregiver Support',            desc: 'Resources for family members who have taken on a caregiving role.' },
  { slug: 'moving',     icon: '🏡', title: 'Moving or Downsizing',         desc: 'Support planning a move, downsizing, or transitioning to a new community.' },
  { slug: 'divorce',    icon: '⚖️', title: 'Late-Life Divorce',            desc: 'Legal, financial, and emotional support for major relationship changes.' },
  { slug: 'financial',  icon: '💰', title: 'Financial Change',             desc: 'Managing income changes, debt, or unexpected financial stress.' },
  { slug: 'retirement', icon: '🌅', title: 'Retirement Transition',        desc: 'Navigating purpose, identity, and daily life after leaving work.' },
  { slug: 'independence', icon: '🏠', title: 'Maintaining Independence',   desc: 'Resources and planning to stay safely and confidently at home.' },
]

export default async function GriefSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Grief &amp; Life Transitions</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>
        Your navigator is here to support you through every major life change. Choose a pathway to get started.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {PATHWAYS.map(p => (
          <div key={p.slug} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '1.8rem' }}>{p.icon}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', marginBottom: 4 }}>{p.title}</div>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
            </div>
            <Link href={`/dashboard/life-transitions?pathway=${p.slug}`}
              style={{ marginTop: 'auto', display: 'inline-block', padding: '7px 14px', background: '#eff6ff', color: '#3b82f6', borderRadius: 8, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #bfdbfe' }}>
              Get support →
            </Link>
          </div>
        ))}
      </div>

      <div style={{ background: '#fdf2f8', border: '1px solid #f0abfc', borderRadius: 12, padding: '20px 24px' }}>
        <p style={{ fontWeight: 700, color: '#86198f', margin: '0 0 6px', fontSize: '0.9rem' }}>💜 Talk to your Navigator</p>
        <p style={{ color: '#a21caf', fontSize: '0.82rem', margin: '0 0 14px', lineHeight: 1.6 }}>
          Not sure where to start? Your personal navigator can listen, help you identify what you need, and connect you with the right resources.
        </p>
        <Link href="/dashboard/navigator"
          style={{ display: 'inline-block', padding: '9px 20px', background: '#a855f7', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
          Contact my Navigator
        </Link>
      </div>
    </div>
  )
}
