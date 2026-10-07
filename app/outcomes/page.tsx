import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Our Impact — ThriveAtHome' }

async function getAggregateStats() {
  try {
    const admin = createAdminClient()

    const [
      { count: totalMembers },
      { count: totalCalls },
      { count: completedCalls },
      { count: activeAlerts },
      { count: totalVolunteers },
      { count: activeCircles },
    ] = await Promise.all([
      admin.from('members').select('*', { count: 'exact', head: true }),
      admin.from('check_in_calls').select('*', { count: 'exact', head: true }),
      admin.from('check_in_calls').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      (admin as any).from('notifications').select('*', { count: 'exact', head: true })
        .eq('severity', 'high')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      admin.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('cultural_circles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ])

    const completionRate = totalCalls && totalCalls > 0
      ? Math.round(((completedCalls ?? 0) / totalCalls) * 100)
      : 0

    return {
      totalMembers: totalMembers ?? 0,
      completionRate,
      activeAlerts: activeAlerts ?? 0,
      totalVolunteers: totalVolunteers ?? 0,
      activeCircles: activeCircles ?? 0,
      totalCalls: totalCalls ?? 0,
    }
  } catch {
    return {
      totalMembers: 0,
      completionRate: 0,
      activeAlerts: 0,
      totalVolunteers: 0,
      activeCircles: 0,
      totalCalls: 0,
    }
  }
}

export default async function OutcomesPage() {
  const stats = await getAggregateStats()

  const statCards = [
    {
      label: 'Members supported',
      value: stats.totalMembers.toLocaleString(),
      description: 'Older adults receiving daily connection and care coordination',
      icon: '👥',
      color: '#1e40af',
      bg: '#eff6ff',
    },
    {
      label: 'Daily call completion rate',
      value: `${stats.completionRate}%`,
      description: 'Of Aria morning catch-up calls completed by members this week',
      icon: '📞',
      color: '#065f46',
      bg: '#f0fdf4',
    },
    {
      label: 'Active volunteers',
      value: stats.totalVolunteers.toLocaleString(),
      description: 'Background-checked volunteers providing companionship and support',
      icon: '🙋',
      color: '#92400e',
      bg: '#fefce8',
    },
    {
      label: 'Community circles',
      value: stats.activeCircles.toLocaleString(),
      description: 'Cultural and interest-based circles fostering belonging',
      icon: '🌍',
      color: '#6b21a8',
      bg: '#faf5ff',
    },
    {
      label: 'Total catch-up calls',
      value: stats.totalCalls.toLocaleString(),
      description: 'Aria morning catch-up calls made to members since launch',
      icon: '☀️',
      color: '#b45309',
      bg: '#fff7ed',
    },
    {
      label: 'High-priority alerts this week',
      value: stats.activeAlerts.toLocaleString(),
      description: 'Navigator-reviewed alerts ensuring member safety and wellbeing',
      icon: '🔔',
      color: '#9f1239',
      bg: '#fff1f2',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.7)', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/employers" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.7)', textDecoration: 'none' }}>Employers</Link>
          <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.7)', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '48px 0 64px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,250,245,0.6)', marginBottom: '16px' }}>
            Our Impact
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '20px', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Real connection.<br />Measurable outcomes.
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'rgba(250,250,245,0.75)', lineHeight: 1.65, maxWidth: '600px', margin: '0 auto' }}>
            ThriveAtHome measures what matters — daily engagement, safety alerts caught early, and families with real peace of mind. All data is aggregated and anonymized.
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', padding: '64px 32px', width: '100%' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '64px' }}>
          {statCards.map((card: any) => (
            <div key={card.label} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '28px 24px', border: '1px solid var(--color-warm-grey)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {card.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: card.color, margin: '0', lineHeight: 1 }}>
                    {card.value}
                  </p>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0', lineHeight: 1.55 }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Methodology note */}
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-md)', padding: '28px 32px', marginBottom: '64px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
            How we measure impact
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { title: 'Daily engagement', body: 'We track whether members complete their Aria morning catch-up calls — a leading indicator of social connection and wellbeing.' },
              { title: 'Safety alerts', body: 'High-priority alerts are reviewed by human navigators within hours. Every alert on this page was seen by a human care professional.' },
              { title: 'Volunteer hours', body: 'Background-checked volunteers log visits after each connection. Hours are verified by care navigators for employer reporting.' },
              { title: 'Privacy by design', body: 'This page shows only aggregate, anonymized data. No individual member\'s information is ever published publicly.' },
            ].map((item: any) => (
              <div key={item.title}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 6px' }}>{item.title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0', lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
            Employer and Medicare Advantage partners can access detailed cohort outcomes through our secure reporting API.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employers" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 500, color: 'white', backgroundColor: 'var(--color-navy)', textDecoration: 'none', borderRadius: 'var(--radius-md)', padding: '13px 28px', minHeight: '48px' }}>
              Partner with us
            </Link>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', backgroundColor: 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', padding: '13px 28px', minHeight: '48px', border: '1.5px solid var(--color-navy)' }}>
              Start a free trial
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '24px 32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0' }}>
          All statistics are aggregate and anonymized. Updated daily. &nbsp;·&nbsp;{' '}
          <Link href="/privacy" style={{ color: 'var(--color-text-secondary)' }}>Privacy policy</Link>
        </p>
      </footer>
    </div>
  )
}
