import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Enrollment Confirmed — ThriveAtHome' }

export default function OrgEnrollSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: '560px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '24px' }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', lineHeight: 1.2 }}>
          Your organization is enrolled!
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
          Thank you for joining ThriveAtHome. Our partnerships team will contact you within one business day to complete setup and activate your admin portal.
        </p>
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '28px', marginBottom: '32px', textAlign: 'left' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '12px' }}>What happens next:</p>
          <ul style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
            <li>Confirmation email sent to your inbox</li>
            <li>Partnerships call scheduled within 1 business day</li>
            <li>Admin portal activated within 3 business days</li>
            <li>Onboarding session with your dedicated navigator</li>
          </ul>
        </div>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--color-teal)', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '16px', padding: '14px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          Return to ThriveAtHome
        </Link>
      </div>
    </main>
  )
}
