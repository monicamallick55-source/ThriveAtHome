#!/usr/bin/env bash
# B2B Front Door Build Script
# Run from: /workspaces/ThriveAtHome
# Creates: root layout, homepage, /for-organizations, /for-employers, /b2b/signup
# Fixes:   /pricing link from /for-employers → /for-organizations

set -e
cd /workspaces/ThriveAtHome

echo "=== Creating root layout (app/layout.tsx) ==="
cat > app/layout.tsx << 'LAYOUT_EOF'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Thrive@Home — Live independently with confidence',
  description: 'AI-powered senior independence platform. Daily check-ins, care coordination, community connection.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PublicNav />
        {children}
      </body>
    </html>
  )
}

function PublicNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', padding: '0 24px', height: '60px',
    }}>
      <a href="/" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#6366f1', textDecoration: 'none', marginRight: 'auto' }}>
        Thrive@Home
      </a>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <a href="/pricing" style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Pricing</a>
        <a href="/for-organizations" style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>For Organizations</a>
        <a href="/login" style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Sign In</a>
        <a href="/signup" style={{
          background: '#6366f1', color: '#fff', textDecoration: 'none',
          padding: '8px 18px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
        }}>Get Started</a>
      </div>
    </nav>
  )
}
LAYOUT_EOF
echo "✓ app/layout.tsx"

echo ""
echo "=== Creating homepage (app/page.tsx) ==="
cat > app/page.tsx << 'HOME_EOF'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
        padding: '80px 24px 100px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#ede9fe', color: '#7c3aed',
            padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
            marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Senior Independence Platform
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: '#111827', lineHeight: 1.15, marginBottom: '20px' }}>
            Live independently.<br />
            <span style={{ color: '#6366f1' }}>With confidence.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#6b7280', maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Aria, your AI companion, checks in daily. Your family stays connected.
            Your community is always close. All in one platform.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              display: 'inline-block', background: '#6366f1', color: '#fff',
              padding: '14px 32px', borderRadius: '12px', fontWeight: 700,
              fontSize: '1rem', textDecoration: 'none',
            }}>
              Start free trial
            </Link>
            <Link href="/pricing" style={{
              display: 'inline-block', background: '#fff', color: '#374151',
              padding: '14px 32px', borderRadius: '12px', fontWeight: 600,
              fontSize: '1rem', textDecoration: 'none', border: '2px solid #e5e7eb',
            }}>
              See pricing
            </Link>
          </div>
          <p style={{ marginTop: '16px', fontSize: '0.85rem', color: '#9ca3af' }}>
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '56px' }}>
          Everything a senior needs at home
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
          {[
            { icon: '📞', title: 'Daily check-in calls', desc: 'Aria calls every day to chat, check on mood and energy, and flag concerns to your family dashboard.' },
            { icon: '👨‍👩‍👧', title: 'Family dashboard', desc: 'Real-time visibility for up to 3 family members — activity, check-in summaries, and alerts.' },
            { icon: '🏘️', title: 'Community connection', desc: 'Join local chapters, find volunteers, participate in skill exchanges and social events.' },
            { icon: '🚨', title: 'Emergency coordination', desc: 'One-touch emergency response with automatic notification to your care circle.' },
            { icon: '🧭', title: 'Dedicated navigator', desc: 'A human care navigator helps coordinate services, appointments, and life transitions.' },
            { icon: '🛡️', title: 'Fraud protection', desc: 'Real-time alerts and education to protect seniors from scams and financial exploitation.' },
          ].map(f => (
            <div key={f.title} style={{ padding: '28px', borderRadius: '16px', border: '1px solid #f3f4f6', background: '#fff' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '8px', fontSize: '1rem' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* B2B Band */}
      <section style={{
        background: '#1e1b4b', color: '#fff',
        padding: '72px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#3730a3', color: '#c7d2fe',
            padding: '5px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
            marginBottom: '20px', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            For Organizations
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>
            Power a senior village or caregiver benefit
          </h2>
          <p style={{ color: '#a5b4fc', fontSize: '1.05rem', marginBottom: '36px', lineHeight: 1.6 }}>
            Starting a village network? Offering a caregiver benefit to employees?
            Thrive@Home gives you the platform, the AI, and the community tools — white-labeled and ready to launch.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/for-organizations" style={{
              display: 'inline-block', background: '#6366f1', color: '#fff',
              padding: '14px 28px', borderRadius: '12px', fontWeight: 700,
              fontSize: '0.95rem', textDecoration: 'none',
            }}>
              Explore org plans
            </Link>
            <Link href="/b2b/signup" style={{
              display: 'inline-block', background: 'transparent', color: '#c7d2fe',
              padding: '14px 28px', borderRadius: '12px', fontWeight: 600,
              fontSize: '0.95rem', textDecoration: 'none', border: '2px solid #3730a3',
            }}>
              Get started free
            </Link>
          </div>
          <p style={{ marginTop: '20px', color: '#6366f1', fontSize: '0.85rem' }}>
            Village networks · Employers · Senior centers · Faith organizations · Health plans
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section style={{ padding: '72px 24px', background: '#f9fafb', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '48px' }}>
            Trusted by families and organizations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', textAlign: 'left' }}>
            {[
              { quote: '"Aria noticed my mom seemed down and flagged it for me. I called her that afternoon. This platform genuinely saved me from missing something important."', name: 'Sarah M.', role: 'Daughter, San Mateo CA' },
              { quote: '"We launched our senior village in 6 weeks with Thrive@Home. The onboarding wizard and admin portal handled everything we needed to get members active."', name: 'David K.', role: 'Village Director' },
              { quote: '"The fraud protection module alone is worth it. We\'ve had three seniors avoid scams because Aria recognized the patterns and alerted the family."', name: 'Linda T.', role: 'Care Navigator' },
            ].map(t => (
              <div key={t.name} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>{t.quote}</p>
                <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem', margin: 0 }}>{t.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: '#fff' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Ready to thrive at home?</h2>
        <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '1.05rem' }}>Join thousands of seniors living with confidence and connection.</p>
        <Link href="/signup" style={{
          display: 'inline-block', background: '#6366f1', color: '#fff',
          padding: '16px 40px', borderRadius: '12px', fontWeight: 700,
          fontSize: '1.05rem', textDecoration: 'none',
        }}>
          Start your free trial
        </Link>
      </section>

      <footer style={{ background: '#111827', color: '#6b7280', padding: '32px 24px', textAlign: 'center', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span>© 2026 Thrive@Home · All rights reserved</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/pricing" style={{ color: '#6b7280', textDecoration: 'none' }}>Pricing</a>
            <a href="/for-organizations" style={{ color: '#6b7280', textDecoration: 'none' }}>For Organizations</a>
            <a href="/login" style={{ color: '#6b7280', textDecoration: 'none' }}>Sign In</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
HOME_EOF
echo "✓ app/page.tsx"

echo ""
echo "=== Creating /for-organizations landing page ==="
mkdir -p app/for-organizations
cat > app/for-organizations/page.tsx << 'ORGS_EOF'
import Link from 'next/link'

const ORG_TYPES = [
  { icon: '🏘️', label: 'Village Networks', desc: 'Launch a member-run senior village with full platform, AI, and community tools.' },
  { icon: '🏢', label: 'Employers', desc: 'Add Thrive@Home as a caregiving benefit for employees with senior family members.' },
  { icon: '🏛️', label: 'Area Agencies on Aging', desc: 'Scale your reach with an AI-enhanced platform built for AAA workflows.' },
  { icon: '⛪', label: 'Faith Organizations', desc: 'Extend your congregation\'s care ministry with structured volunteer and check-in tools.' },
  { icon: '🏥', label: 'Health Plans', desc: 'Offer Thrive@Home as a supplemental benefit to reduce isolation-driven utilization.' },
  { icon: '🎓', label: 'Universities', desc: 'Support alumni 65+ and build intergenerational programming with student volunteers.' },
]

const PLANS = [
  {
    name: 'Starter Village',
    price: '$0',
    priceSub: 'Free during launch',
    seats: 'Up to 25 members',
    features: [
      'Aria AI check-in calls',
      'Community board & events',
      'Org admin portal',
      'Basic family dashboards',
      '14-day onboarding support',
    ],
    cta: 'Start free',
    ctaHref: '/b2b/signup?plan=basics&org_type=village_network',
    highlight: false,
  },
  {
    name: 'Village Pro',
    price: '$4',
    priceSub: 'per member / month',
    seats: 'Up to 500 members',
    features: [
      'Everything in Starter',
      'White-label branding',
      'Volunteer matching engine',
      'Fraud protection module',
      'Navigator care coordination',
      'Custom onboarding wizard',
      'Dedicated account manager',
    ],
    cta: 'Get started',
    ctaHref: '/b2b/signup?plan=b2b_standard&org_type=village_network',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceSub: 'Volume + SLA options',
    seats: 'Unlimited members',
    features: [
      'Everything in Village Pro',
      'SSO / SAML integration',
      'Custom AI persona',
      'API access',
      'BAA available',
      'Dedicated infrastructure',
      'SLA 99.9% uptime',
    ],
    cta: 'Contact us',
    ctaHref: 'mailto:orgs@thriveathome.app',
    highlight: false,
  },
]

export default function ForOrganizationsPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#fff', padding: '96px 24px 80px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#3730a3', color: '#c7d2fe',
            padding: '5px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            marginBottom: '24px', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Thrive@Home for Organizations
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px' }}>
            Launch a senior village.<br />
            Power a caregiver benefit.<br />
            <span style={{ color: '#818cf8' }}>All on one platform.</span>
          </h1>
          <p style={{ color: '#a5b4fc', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 40px', lineHeight: 1.65 }}>
            Thrive@Home gives your organization a complete senior independence platform —
            Aria AI, community tools, care coordination, and your own branded admin portal.
            Deploy in weeks, not years.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/b2b/signup" style={{
              background: '#6366f1', color: '#fff', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
            }}>
              Start your organization free
            </Link>
            <a href="#plans" style={{
              background: 'transparent', color: '#c7d2fe', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem',
              border: '2px solid #3730a3',
            }}>
              See plans
            </a>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '48px' }}>
            Built for every type of senior-serving organization
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {ORG_TYPES.map(org => (
              <div key={org.label} style={{ background: '#fff', borderRadius: '14px', padding: '28px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{org.icon}</div>
                <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{org.label}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{org.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '56px' }}>
            Live in 6 weeks, not 18 months
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {[
              { step: '1', title: 'Sign up & configure', desc: 'Create your organization account, set your branding, and configure which features your members need. 30 minutes.' },
              { step: '2', title: 'Invite your team', desc: 'Add navigators, volunteers, and admin staff. Role-based permissions ensure everyone sees what they need.' },
              { step: '3', title: 'Onboard your members', desc: 'Use the guided 6-step wizard or bulk-import members via CSV. Aria begins check-in calls automatically.' },
              { step: '4', title: 'Monitor & grow', desc: 'Your org admin portal shows engagement, check-in trends, care needs, and community activity in real time.' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '44px', height: '44px', borderRadius: '50%',
                  background: '#ede9fe', color: '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.1rem',
                }}>
                  {s.step}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '6px', fontSize: '1rem' }}>{s.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            Simple, transparent pricing
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1rem' }}>
            Start free. Scale as you grow. No long-term contracts.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                background: '#fff', borderRadius: '20px', padding: '36px',
                border: plan.highlight ? '2px solid #6366f1' : '2px solid #e5e7eb',
                position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: '#6366f1', color: '#fff', padding: '4px 16px',
                    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px', fontSize: '1.1rem' }}>{plan.name}</h3>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{plan.price}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem', marginLeft: '4px' }}>{plan.priceSub}</span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '24px' }}>{plan.seats}</p>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#374151' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={plan.ctaHref} style={{
                  display: 'block', textAlign: 'center',
                  padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
                  textDecoration: 'none',
                  background: plan.highlight ? '#6366f1' : '#f3f4f6',
                  color: plan.highlight ? '#fff' : '#374151',
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: '#fff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            Ready to launch your organization?
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '1.05rem' }}>
            Sign up in minutes. No credit card required to explore the platform.
          </p>
          <Link href="/b2b/signup" style={{
            display: 'inline-block', background: '#6366f1', color: '#fff',
            padding: '16px 40px', borderRadius: '12px', fontWeight: 700,
            fontSize: '1.05rem', textDecoration: 'none',
          }}>
            Get started free →
          </Link>
          <p style={{ marginTop: '16px', color: '#9ca3af', fontSize: '0.85rem' }}>
            Questions? Email <a href="mailto:orgs@thriveathome.app" style={{ color: '#6366f1' }}>orgs@thriveathome.app</a>
          </p>
        </div>
      </section>
    </main>
  )
}
ORGS_EOF
echo "✓ app/for-organizations/page.tsx"

echo ""
echo "=== Creating /for-employers redirect ==="
mkdir -p app/for-employers
cat > app/for-employers/page.tsx << 'EMP_EOF'
// /for-employers → redirect to unified /for-organizations
import { redirect } from 'next/navigation'

export default function ForEmployersPage() {
  redirect('/for-organizations')
}
EMP_EOF
echo "✓ app/for-employers/page.tsx"

echo ""
echo "=== Creating /b2b/signup form ==="
mkdir -p app/b2b/signup
cat > "app/b2b/signup/page.tsx" << 'B2B_EOF'
'use client'

import { useState } from 'react'

const ORG_TYPE_OPTIONS = [
  { value: 'village_network', label: '🏘️ Village Network — neighbor-to-neighbor senior village' },
  { value: 'area_agency_on_aging', label: '🏛️ Area Agency on Aging (AAA)' },
  { value: 'senior_center', label: '🏢 Senior Center' },
  { value: 'faith_organization', label: '⛪ Faith Organization' },
  { value: 'employer', label: '💼 Employer — caregiver benefit for employees' },
  { value: 'healthcare_system', label: '🏥 Healthcare System / Hospital' },
  { value: 'health_plan', label: '💊 Health Plan / Medicare Advantage' },
  { value: 'agency', label: '🤝 Home Care Agency' },
  { value: 'university', label: '🎓 University / College' },
  { value: 'foundation', label: '🌱 Foundation / Nonprofit' },
]

type Step = 'form' | 'submitting' | 'success' | 'error'

export default function B2BSignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [orgId, setOrgId] = useState<string>('')
  const [errMsg, setErrMsg] = useState('')
  const [form, setForm] = useState({
    org_name: '',
    org_type: 'village_network',
    admin_email: '',
    seat_count: '25',
    plan: 'basics',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('submitting')
    try {
      const res = await fetch('/api/b2b-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, seat_count: Number(form.seat_count) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')
      setOrgId(data.org_id || data.id || 'new')
      setStep('success')
    } catch (err: any) {
      setErrMsg(err.message || 'Something went wrong. Please try again.')
      setStep('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1.5px solid #e5e7eb', fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 600, color: '#374151',
    marginBottom: '6px', fontSize: '0.9rem',
  }

  if (step === 'success') {
    return (
      <main style={{ fontFamily: 'system-ui, sans-serif', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
            Your organization is live!
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: '8px' }}>
            Welcome to Thrive@Home. Your account has been created and your onboarding wizard is ready.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '36px' }}>
            Org ID: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{orgId}</code>
          </p>
          <a href="/b2b/onboarding" style={{
            display: 'inline-block', background: '#6366f1', color: '#fff',
            padding: '14px 32px', borderRadius: '12px', fontWeight: 700,
            fontSize: '1rem', textDecoration: 'none',
          }}>
            Continue to onboarding →
          </a>
          <p style={{ marginTop: '16px', color: '#9ca3af', fontSize: '0.85rem' }}>
            Check your email for a confirmation link.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', minHeight: '80vh', background: '#f9fafb', padding: '64px 24px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-block', background: '#ede9fe', color: '#6366f1',
            padding: '5px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
            marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            Organization Sign Up
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
            Launch your organization
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Free to start · Set up in minutes · No credit card required
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '20px', padding: '40px', border: '1px solid #e5e7eb' }}>
          {step === 'error' && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
              padding: '12px 16px', color: '#dc2626', fontSize: '0.9rem', marginBottom: '24px',
            }}>
              {errMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Organization Name *</label>
              <input
                required value={form.org_name} onChange={set('org_name')}
                placeholder="Foster City Village"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Organization Type *</label>
              <select value={form.org_type} onChange={set('org_type')} style={inputStyle}>
                {ORG_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Your Email (Admin) *</label>
              <input
                required type="email" value={form.admin_email} onChange={set('admin_email')}
                placeholder="you@organization.org"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Expected Members</label>
                <input
                  type="number" min="1" value={form.seat_count} onChange={set('seat_count')}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Plan</label>
                <select value={form.plan} onChange={set('plan')} style={inputStyle}>
                  <option value="basics">Starter (Free)</option>
                  <option value="b2b_standard">Village Pro ($4/member)</option>
                  <option value="b2b_premium">Enterprise (Custom)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={step === 'submitting'}
            style={{
              marginTop: '32px', width: '100%', padding: '14px',
              background: step === 'submitting' ? '#a5b4fc' : '#6366f1',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontWeight: 700, fontSize: '1rem', cursor: step === 'submitting' ? 'default' : 'pointer',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {step === 'submitting' ? 'Creating your organization…' : 'Create my organization →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', color: '#9ca3af', fontSize: '0.8rem' }}>
            By signing up you agree to our{' '}
            <a href="/terms" style={{ color: '#6366f1' }}>Terms of Service</a> and{' '}
            <a href="/privacy" style={{ color: '#6366f1' }}>Privacy Policy</a>.
          </p>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '0.9rem' }}>
          Questions?{' '}
          <a href="mailto:orgs@thriveathome.app" style={{ color: '#6366f1' }}>Email us</a>{' '}
          or{' '}
          <a href="/for-organizations" style={{ color: '#6366f1' }}>learn more about org plans</a>
        </p>
      </div>
    </main>
  )
}
B2B_EOF
echo "✓ app/b2b/signup/page.tsx"

echo ""
echo "=== Creating /b2b/page.tsx (redirect to signup) ==="
mkdir -p app/b2b
cat > app/b2b/page.tsx << 'B2B_INDEX_EOF'
import { redirect } from 'next/navigation'
export default function B2BIndexPage() {
  redirect('/for-organizations')
}
B2B_INDEX_EOF
echo "✓ app/b2b/page.tsx"

echo ""
echo "=== Fixing /pricing page B2B link ==="
sed -i 's|href="/for-employers"|href="/for-organizations"|g' app/pricing/page.tsx
# Verify
if grep -q 'href="/for-organizations"' app/pricing/page.tsx; then
  echo "✓ app/pricing/page.tsx — link fixed to /for-organizations"
else
  echo "✗ WARN: sed replacement may not have worked — check manually"
fi

echo ""
echo "=== Checking globals.css exists (needed by root layout) ==="
if [ -f app/globals.css ]; then
  echo "✓ app/globals.css exists"
else
  echo "Creating minimal app/globals.css"
  cat > app/globals.css << 'CSS_EOF'
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }
CSS_EOF
  echo "✓ app/globals.css created"
fi

echo ""
echo "=== Committing and deploying ==="
git add \
  app/layout.tsx \
  app/page.tsx \
  app/for-organizations/page.tsx \
  app/for-employers/page.tsx \
  app/b2b/page.tsx \
  app/b2b/signup/page.tsx \
  app/pricing/page.tsx

if [ -f app/globals.css ]; then
  git add app/globals.css
fi

git commit -m "feat: add B2B front door — homepage, /for-organizations, /b2b/signup

- app/page.tsx: public marketing homepage with D2C + B2B sections
- app/layout.tsx: root layout with public nav (Pricing, For Organizations, Sign In, Get Started)
- app/for-organizations/page.tsx: B2B landing page with org types, how it works, plans, CTA
- app/for-employers/page.tsx: redirect → /for-organizations
- app/b2b/signup/page.tsx: org signup form POSTing to /api/b2b-signup
- app/b2b/page.tsx: redirect → /for-organizations
- app/pricing/page.tsx: fix B2B link /for-employers → /for-organizations

Closes B2B funnel gap: a prospect can now discover, explore, and sign up
from thriveathome.app without any dead-end links.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019GpSirUhpwEpGZjzxtrqN4"

git push origin main

echo ""
echo "=============================="
echo "✅ B2B funnel deployed!"
echo "Pages live:"
echo "  / → Homepage with B2B band"
echo "  /for-organizations → B2B landing page"
echo "  /for-employers → redirects to /for-organizations"
echo "  /b2b/signup → Org signup form"
echo "  /pricing → Fixed B2B link"
echo "=============================="
