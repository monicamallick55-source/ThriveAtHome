export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function VolunteerOpportunitiesPage() {
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
      <Link href="/dashboard" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Volunteer Opportunities</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Give back to your community and stay connected through volunteering.</p>
      <div style={{ display: 'grid', gap: '16px' }}>
        {[
          { icon: '📞', label: 'Phone Buddy Program', desc: 'Call and connect with isolated seniors weekly', time: '1–2 hrs/week' },
          { icon: '🚗', label: 'Transportation Help', desc: 'Drive neighbors to appointments', time: '2–4 hrs/week' },
          { icon: '🛒', label: 'Errand Assistance', desc: 'Help with grocery runs and errands', time: '1–3 hrs/week' },
          { icon: '💻', label: 'Tech Tutoring', desc: 'Help seniors navigate smartphones and computers', time: '1–2 hrs/week' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', gap: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '32px' }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{item.desc}</div>
              <div style={{ fontSize: '12px', color: '#2d6a4f', fontWeight: 500 }}>⏱ {item.time}</div>
            </div>
            <button style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Sign up
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
