// Crisis & emotional support resources — 988, SAMHSA, and senior-specific helplines.
// Public page, linked from the crisis bar embedded across the platform. Phase 100 (M24).
import type { Metadata } from 'next'
import Link from 'next/link'
import { CRISIS_RESOURCES } from '@/lib/crisis/resources'

export const metadata: Metadata = {
  title: 'Crisis & Emotional Support — ThriveAtHome',
  description: '988 Suicide & Crisis Lifeline, SAMHSA National Helpline, and 24/7 support lines for older adults.',
}

export default function CrisisPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '14px 24px' }}>
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}
        >
          ThriveAtHome
        </Link>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 16px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          You don&apos;t have to handle this alone
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
          These are national, free, and confidential services, available 24 hours a day. You do not need to be
          in a life-threatening emergency to call — loneliness, grief, anxiety, and feeling overwhelmed all count.
        </p>
        <div
          style={{
            backgroundColor: 'var(--color-concern)',
            color: 'var(--color-concern-text)',
            border: '1px solid var(--color-concern-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 600,
            margin: '0 0 24px',
          }}
        >
          If someone is in immediate physical danger, call 911.
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CRISIS_RESOURCES.map((r: any) => (
            <li
              key={r.key}
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-warm-grey)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 6px' }}>
                {r.name}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
                {r.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {r.callNumber && (
                  <a
                    href={`tel:${r.callNumber}`}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700,
                      backgroundColor: 'var(--color-navy)', color: 'white',
                      padding: '10px 18px', borderRadius: 'var(--radius-full)', textDecoration: 'none',
                    }}
                  >
                    Call {r.callDisplay}
                  </a>
                )}
                {r.textNumber && (
                  <a
                    href={`sms:${r.textNumber}`}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700,
                      backgroundColor: 'var(--color-teal-muted)', color: 'var(--color-navy)',
                      padding: '10px 18px', borderRadius: 'var(--radius-full)', textDecoration: 'none',
                      border: '1px solid var(--color-teal)',
                    }}
                  >
                    Text {r.textDisplay}
                  </a>
                )}
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
                      color: 'var(--color-teal)', padding: '10px 4px', textDecoration: 'underline',
                    }}
                  >
                    Visit website ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '24px 0 0', fontStyle: 'italic' }}>
          Your ThriveAtHome navigator can also help you connect with any of these services with a warm,
          personal introduction, and can arrange ongoing local support.
        </p>
      </main>
    </div>
  )
}
