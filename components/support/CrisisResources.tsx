'use client'
// G7.21 — 988/SAMHSA crisis line + VITA tax link
// Embeddable in grief pages, transition/move pages, benefits finder, etc.

interface Props {
  context?: 'grief' | 'transition' | 'benefits' | 'general'
  compact?: boolean
}

const VITA_URL = 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers'
const SAMHSA_URL = 'https://www.samhsa.gov/find-help/national-helpline'
const LIFELINE_URL = 'https://988lifeline.org'

export default function CrisisResources({ context = 'general', compact = false }: Props) {
  if (compact) {
    return (
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#9a3412', lineHeight: 1.6 }}>
        <strong>Need support?</strong> Call/text <strong>988</strong> (crisis line, 24/7) · Substance use: <strong>1-800-662-4357</strong>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '12px', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* 988 Lifeline */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>🆘</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#9a3412', marginBottom: '6px' }}>988 Suicide & Crisis Lifeline</div>
            <div style={{ fontSize: '14px', color: '#7c2d12', lineHeight: 1.6, marginBottom: '10px' }}>
              Free, confidential crisis support — 24 hours a day, 7 days a week.
              {context === 'grief' && ' Grief and loss can be overwhelming. It\'s okay to ask for help.'}
              {context === 'transition' && ' Big life changes can bring up powerful emotions. Support is available.'}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, color: '#9a3412', fontSize: '18px', letterSpacing: '0.05em' }}>
                Call or text: 988
              </div>
              <a
                href={LIFELINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#9a3412', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
              >
                988lifeline.org ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* SAMHSA */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>💚</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>SAMHSA Helpline — Substance Use & Mental Health</div>
            <div style={{ fontSize: '14px', color: '#14532d', lineHeight: 1.6, marginBottom: '10px' }}>
              Free, confidential treatment referrals and information. Available in English and Spanish.
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, color: '#166534', fontSize: '16px', letterSpacing: '0.02em' }}>
                1-800-662-4357
              </div>
              <a
                href={SAMHSA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#166534', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
              >
                SAMHSA.gov ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* VITA — show in benefits context or general */}
      {(context === 'benefits' || context === 'general') && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '28px', lineHeight: 1 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>VITA — Free Tax Preparation</div>
              <div style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: 1.6, marginBottom: '10px' }}>
                Volunteer Income Tax Assistance (VITA) provides free tax help for people who generally earn $67,000 or less. IRS-certified volunteers help with basic tax returns.
              </div>
              <a
                href={VITA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#1e40af', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Find a VITA location ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
