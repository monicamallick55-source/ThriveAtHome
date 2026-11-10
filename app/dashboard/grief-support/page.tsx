export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const PATHWAYS = [
  { slug: 'loss',         emoji: '🕊️', title: 'Loss of a Loved One',           desc: 'Grief support after losing a spouse, family member, or close friend.' },
  { slug: 'diagnosis',    emoji: '🏥', title: 'Major Health Diagnosis',         desc: 'Navigating a serious illness, chronic condition, or new disability.' },
  { slug: 'change',       emoji: '🌊', title: 'Major Life Change',              desc: 'Support through any significant transition that disrupts daily life.' },
  { slug: 'caregiving',   emoji: '🤝', title: 'Caregiver Support',              desc: 'Resources for family members taking on a caregiving role.' },
  { slug: 'driving',      emoji: '🚗', title: 'Loss of Driving',                desc: 'Adjusting to life and transportation after giving up driving.' },
  { slug: 'divorce',      emoji: '💔', title: 'Late-Life Divorce or Separation', desc: 'Emotional, legal, and financial support for relationship transitions.' },
  { slug: 'dementia',     emoji: '🧠', title: 'Dementia or MCI Diagnosis',      desc: 'Understanding memory loss and planning for future care needs.' },
  { slug: 'family',       emoji: '🏠', title: 'Adult Child Moving Away',        desc: 'Coping with an empty nest and rebuilding social connection.' },
  { slug: 'housing',      emoji: '🏘️', title: 'Housing Insecurity or Forced Move', desc: 'Support for unexpected housing changes or financial housing stress.' },
]

export default async function GriefSupportPage() {
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
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>Grief & Life Transition Support</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 32 }}>
        Your navigator is here to walk alongside you. Choose the pathway that fits your situation.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {PATHWAYS.map(p => (
          <Link key={p.slug} href={`/dashboard/life-transitions?pathway=${p.slug}`}
            data-testid={`pathway-${p.slug}`}
            className="pathway-card"
            style={{ display: 'block', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{p.emoji}</div>
            <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5 }}>{p.desc}</div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 40, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>Talk to Your Navigator</div>
        <p style={{ color: '#15803d', fontSize: '0.875rem', margin: '0 0 12px' }}>
          Your personal navigator can help you process this transition and connect you with the right resources.
        </p>
        <Link href="/dashboard/navigator" style={{ display: 'inline-block', padding: '8px 20px', background: '#16a34a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
          Contact my navigator
        </Link>
      </div>
    </div>
  )
}
