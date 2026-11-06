// /dashboard/navigator — Member's care navigator hub.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NavigatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, plan_tier, plan')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const isComplete = member?.plan_tier === 'complete' || member?.plan === 'complete'
  const navigatorHours = isComplete ? 4 : 1

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Your Care Navigator</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Your personal navigator is here to guide you through any challenge.</p>

      {/* Navigator hours card */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#14532d', marginBottom: '4px' }}>Navigator Hours</h2>
        <p style={{ fontSize: '14px', color: '#166534', margin: '0 0 12px' }}>
          Your {isComplete ? 'Thrive Complete' : 'Thrive Basics'} plan includes{' '}
          <strong>{navigatorHours} navigator hour{navigatorHours !== 1 ? 's' : ''} per month</strong>.
        </p>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>
          {navigatorHours}h remaining this month
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: '📅', label: 'Schedule a call', desc: 'Book time with your navigator' },
          { icon: '💬', label: 'Send a message', desc: 'Get a response within 24 hours' },
          { icon: '📋', label: 'View care tasks', desc: 'See your open action items' },
        ].map(item => (
          <div key={item.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {!isComplete && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px' }}>
          <strong>Upgrade to Complete</strong> for 4 navigator hours/month plus unlimited messaging.
          <Link href="/dashboard/plan" style={{ display: 'inline-block', marginLeft: '12px', color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>
            See plans →
          </Link>
        </div>
      )}
    </div>
  )
}
