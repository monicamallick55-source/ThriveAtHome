'use client'
// app/signup/success/page.tsx — post-Stripe-checkout landing page
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'

function SignupSuccessContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'basics'
  const billing = searchParams.get('billing') || 'monthly'
  const [greeting, setGreeting] = useState('Welcome to ThriveAtHome!')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning! Welcome to ThriveAtHome!')
    else if (hour < 17) setGreeting('Good afternoon! Welcome to ThriveAtHome!')
    else setGreeting('Good evening! Welcome to ThriveAtHome!')
  }, [])

  const planName = plan === 'complete' ? 'Thrive Complete' : 'Thrive Basics'

  return (
    <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <CheckCircle size={64} color="#52b788" style={{ marginBottom: '24px' }} />

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>
          {greeting}
        </h1>
        <p style={{ fontSize: '17px', color: '#555', marginBottom: '8px' }}>
          You're now a <strong style={{ color: '#2d6a4f' }}>{planName}</strong> member.
        </p>
        <p style={{ fontSize: '14px', color: '#888', marginBottom: '32px' }}>
          Billed {billing === 'annual' ? 'annually' : 'monthly'} · Cancel anytime
        </p>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '24px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px' }}>
            What happens next
          </h2>
          {[
            { emoji: '📧', text: 'Check your email — a welcome message is on its way with your login details.' },
            { emoji: '📞', text: 'Quinn, your AI concierge, will call to introduce herself within 24 hours.' },
            { emoji: '👨‍👩‍👧', text: 'Invite up to ' + (plan === 'complete' ? '8' : '3') + ' family members to your Family Portal.' },
            { emoji: '🎯', text: 'Explore your dashboard — services, community events, and more await.' },
          ].map(({ emoji, text }) => (
            <div key={text} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{emoji}</span>
              <span style={{ fontSize: '14px', color: '#555', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <Link href="/dashboard" style={{
          display: 'block', padding: '14px', borderRadius: '10px',
          background: '#2d6a4f', color: '#fff', textDecoration: 'none',
          fontWeight: 700, fontSize: '16px', textAlign: 'center',
        }}>
          Go to my dashboard →
        </Link>

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#aaa' }}>
          Questions? Call us at{' '}
          <span style={{ color: '#2d6a4f', fontWeight: 600 }}>1-800-THRIVE1</span>
        </p>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2d6a4f', fontSize: '16px' }}>Loading…</div>
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  )
}
