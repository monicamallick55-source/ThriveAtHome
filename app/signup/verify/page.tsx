'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? 'your email'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>📬</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
          Check your email
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '8px' }}>
          We sent a verification link to
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '32px' }}>
          {email}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
          Click the link in the email to verify your account, then sign in to continue.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600,
            textDecoration: 'none', borderRadius: 'var(--radius-md)',
            padding: '14px 32px', backgroundColor: 'var(--color-teal)', color: 'white',
          }}
        >
          Go to sign in
        </Link>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '24px' }}>
          Didn&apos;t get the email? Check your spam folder.
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
