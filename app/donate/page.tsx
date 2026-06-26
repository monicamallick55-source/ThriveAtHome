import type { Metadata } from 'next'

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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', lineHeight: 1.2 }}>
            Help a Senior Thrive at Home
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto' }}>
            Your gift helps us provide free and subsidized care coordination to seniors who can&apos;t afford it on their own.
          </p>
        </div>

        {/* Impact cards */}
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

        {/* Donation form */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', border: '1px solid #E8E4DC' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '32px' }}>Make a Donation</h2>

          <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #F59E0B40', borderRadius: '12px', padding: '16px 20px', marginBottom: '32px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#78350F', margin: 0, lineHeight: 1.6 }}>
              <strong>Online giving coming soon.</strong> We are setting up our online donation portal. In the meantime, please reach out to us directly — we accept checks, bank transfers, and can arrange other giving options.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email us to arrange your gift
              </label>
              <a href="mailto:giving@thriveathome.com" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 600 }}>
                giving@thriveathome.com
              </a>
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px solid #E8E4DC' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                ThriveAtHome is a mission-driven company. We are not yet a registered 501(c)(3) — tax deductibility varies by structure. Please contact us for details about your specific giving situation.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ marginTop: '48px', padding: '32px 40px', backgroundColor: 'var(--color-navy)', borderRadius: '20px', textAlign: 'center' }}>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontStyle: 'italic', color: 'var(--color-cream)', lineHeight: 1.6, marginBottom: '16px', margin: '0 0 16px' }}>
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
