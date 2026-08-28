'use client'
// Compact, always-available 988 / crisis line. Embedded in the dashboard footer,
// grief support, and the member portal. Phase 100 (M24).
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { PRIMARY_CRISIS_RESOURCE, type CrisisSurface, type CrisisAction } from '@/lib/crisis/resources'

function logResource(surface: CrisisSurface, action: CrisisAction, resourceKey: string) {
  try {
    const payload = JSON.stringify({ resource_key: resourceKey, surface, action })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/crisis-resources/log', new Blob([payload], { type: 'application/json' }))
    } else {
      void fetch('/api/crisis-resources/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* analytics only — never block reaching help */
  }
}

interface Props {
  surface: CrisisSurface
}

export default function CrisisResourceBar({ surface }: Props) {
  const logged = useRef(false)
  const r = PRIMARY_CRISIS_RESOURCE

  useEffect(() => {
    if (logged.current) return
    logged.current = true
    logResource(surface, 'view', r.key)
  }, [surface, r.key])

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px 14px',
        padding: '12px 16px',
        backgroundColor: 'var(--color-teal-muted)',
        borderTop: '1px solid var(--color-teal)',
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--color-navy)',
      }}
      role="complementary"
      aria-label="Crisis support"
    >
      <span style={{ fontWeight: 600 }}>
        Need to talk to someone now?
      </span>
      <a
        href={`tel:${r.callNumber}`}
        onClick={() => logResource(surface, 'call_clicked', r.key)}
        style={{ fontWeight: 700, color: 'var(--color-navy)', textDecoration: 'underline' }}
      >
        Call {r.callDisplay}
      </a>
      {r.textNumber && (
        <a
          href={`sms:${r.textNumber}`}
          onClick={() => logResource(surface, 'text_clicked', r.key)}
          style={{ fontWeight: 700, color: 'var(--color-navy)', textDecoration: 'underline' }}
        >
          Text {r.textDisplay}
        </a>
      )}
      <span aria-hidden="true" style={{ color: 'var(--color-teal)' }}>·</span>
      <Link
        href="/crisis"
        onClick={() => logResource(surface, 'chat_clicked', r.key)}
        style={{ color: 'var(--color-navy)', textDecoration: 'underline' }}
      >
        More support options
      </Link>
      <span style={{ width: '100%', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {r.name} — free, confidential, 24/7. If someone is in immediate danger, call 911.
      </span>
    </div>
  )
}
