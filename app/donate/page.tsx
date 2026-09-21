import type { Metadata } from 'next'
import DonationModule from '@/components/shared/DonationModule'

export const metadata: Metadata = {
  title: 'Support ThriveAtHome — Make a Difference',
  description: 'Your contribution helps us provide free and subsidized senior care coordination to families who need it most.',
}

export default function DonatePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500, textDecoration: 'none' }}>ThriveAtHome</a>
        <a href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>Sign in</a>
      </nav>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px' }}>
        <a href="/dashboard" style={{ display: 'inline-block', marginBottom: '24px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← Back to Dashboard
        </a>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', lineHeight: 1.2 }}>
            Help a Senior Thrive at Home
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto' }}>
            Your gift helps us provide free and subsidized care coordination to seniors who can&apos;t afford it on their own.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {[
            { amount: '$25', impact: 'Covers one month of daily Aria check-in calls for a senior who lives alone' },
            { amount: '$75', impact: 'Funds a volunteer matching and three visits for a senior who needs companionship' },
            { amount: '$150', impact: 'Supports one month of full navigator care coordination for a senior in need' },
          ].map(card => (
            <div key={card.amount} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E8E4DC', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-teal)', fontWeight: 500, marginBottom: '10px' }}>{card.amount}</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{card.impact}</p>
            </div>
          ))}
        </div>

        <DonationModule backHref="/dashboard" backLabel="← Back to Dashboard" />

        <div style={{ marginTop: '48px', padding: '32px 40px', backgroundColor: 'var(--color-navy)', borderRadius: '20px', textAlign: 'center' }}>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontStyle: 'italic', color: 'var(--color-cream)', lineHeight: 1.6, margin: '0 0 16px' }}>
            &ldquo;Before ThriveAtHome, I didn&apos;t know if Mom was okay every day. Now I get a gentle update and I sleep better.&rdquo;
          </blockquote>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.6)', margin: 0 }}>
            — Family member, Bay Area
          </p>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '32px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', borderTop: '1px solid #E8E4DC' }}>
        ThriveAtHome · <a href="/privacy" style={{ color: 'var(--color-text-secondary)' }}>Privacy Policy</a> · <a href="/" style={{ color: 'var(--color-text-secondary)' }}>Back to home</a>
      </footer>
    </div>
  )
}
