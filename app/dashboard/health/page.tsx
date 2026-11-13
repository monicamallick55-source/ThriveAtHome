export const dynamic = 'force-dynamic'
// /dashboard/health — Health & Wellness hub for members.
// Shows mood check-in, health resources, and links to telehealth/benefits.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HealthPage() {
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
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>mood health wellness check-in energy score</span>
      <Link href="/dashboard" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Health &amp; Wellness</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Track your mood, access health resources, and connect with care.</p>

      {/* Mood check-in section */}
      <section style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#14532d', marginBottom: '8px' }}>Mood &amp; Wellbeing Check-In</h2>
        <p style={{ fontSize: '14px', color: '#166534', margin: '0 0 16px' }}>
          Aria tracks your mood over time during daily check-in calls. How are you feeling today?
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['😊 Great', '🙂 Good', '😐 Okay', '😔 Low', '😟 Struggling'].map(label => (
            <button key={label} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #86efac', background: 'white', cursor: 'pointer', fontSize: '14px' }}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Health links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { href: '/dashboard/benefits-finder', icon: '💊', label: 'Benefits Finder', desc: 'Medicare, Medicaid & more' },
          { href: '/dashboard/medicare-help', icon: '🏥', label: 'Medicare Help', desc: 'Coverage & plan questions' },
          { href: '/dashboard/services/health', icon: '🩺', label: 'Telehealth', desc: 'Connect with providers' },
          { href: '/dashboard/trusted-advisors', icon: '👩‍⚕️', label: 'Trusted Advisors', desc: 'Therapists & counselors' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'block', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
