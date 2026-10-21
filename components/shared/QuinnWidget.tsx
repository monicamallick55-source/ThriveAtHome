'use client'
// QuinnWidget — embeds a Retell Web Call button that connects to Quinn,
// ThriveAtHome's concierge/sales inbound voice agent.
// Place on any public marketing page where visitors might have questions.

import { useEffect, useRef, useState } from 'react'

interface QuinnWidgetProps {
  /** Override the button label. Defaults to "Talk to Quinn" */
  label?: string
  /** Tonal variant — controls button style */
  variant?: 'navy' | 'teal' | 'ghost'
  /** Compact mode for inline use */
  compact?: boolean
}

type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

export default function QuinnWidget({ label = 'Talk to Quinn', variant = 'teal', compact = false }: QuinnWidgetProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const retellRef = useRef<any>(null)

  // Dynamically load Retell Web SDK so it doesn't block page paint
  useEffect(() => {
    let mounted = true
    async function loadSdk() {
      try {
        if (typeof window === 'undefined') return
        if ((window as any).__retellWebSdkLoaded) return
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/index.umd.js'
        script.async = true
        script.onload = () => {
          if (mounted) (window as any).__retellWebSdkLoaded = true
        }
        document.head.appendChild(script)
      } catch {
        // SDK load failure is non-fatal — user can still call the phone number
      }
    }
    void loadSdk()
    return () => { mounted = false }
  }, [])

  async function startCall() {
    if (callState !== 'idle' && callState !== 'ended' && callState !== 'error') return
    setCallState('connecting')
    setErrorMsg(null)

    try {
      // 1. Fetch a Retell Web Call access token from our backend
      const res = await fetch('/api/retell/tools/web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'quinn' }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => 'Could not reach Quinn right now.')
        throw new Error(msg)
      }
      const { access_token } = await res.json() as { access_token: string }

      // 2. Start call via Retell Web SDK
      const RetellWebClient = (window as any).RetellWebClient
      if (!RetellWebClient) throw new Error('Voice SDK not ready — try refreshing the page.')
      const client = new RetellWebClient()
      retellRef.current = client

      client.on('call_started', () => setCallState('active'))
      client.on('call_ended',   () => setCallState('ended'))
      client.on('error',        (e: Error) => { setCallState('error'); setErrorMsg(e?.message ?? 'Call error') })

      await client.startCall({ accessToken: access_token })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not connect to Quinn. Please try again.'
      setCallState('error')
      setErrorMsg(msg)
    }
  }

  function endCall() {
    try { retellRef.current?.stopCall() } catch { /* noop */ }
    setCallState('ended')
  }

  function reset() {
    setCallState('idle')
    setErrorMsg(null)
  }

  const isActive = callState === 'active'
  const isBusy   = callState === 'connecting' || isActive

  // ── Styles ──────────────────────────────────────────────────────────────
  const baseBtn: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '8px',
    padding:        compact ? '10px 18px' : '14px 28px',
    borderRadius:   '999px',
    fontFamily:     'var(--font-body)',
    fontSize:       compact ? '14px' : '16px',
    fontWeight:     600,
    cursor:         isBusy ? 'default' : 'pointer',
    border:         'none',
    transition:     'opacity 0.15s, transform 0.1s',
    textDecoration: 'none',
    lineHeight:     1,
    whiteSpace:     'nowrap',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    teal:  { backgroundColor: 'var(--color-teal)',  color: 'white' },
    navy:  { backgroundColor: 'var(--color-navy)',  color: 'white' },
    ghost: { backgroundColor: 'transparent', color: 'var(--color-teal)', border: '1.5px solid var(--color-teal)' },
  }

  const buttonStyle: React.CSSProperties = { ...baseBtn, ...variantStyles[variant], opacity: isBusy ? 0.75 : 1 }

  // ── Render ───────────────────────────────────────────────────────────────
  if (callState === 'ended') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', margin: 0, fontWeight: 600 }}>
          ✓ Call ended — thanks for talking with Quinn!
        </p>
        <button onClick={reset} style={{ ...buttonStyle, ...variantStyles.ghost, fontSize: '14px', padding: '8px 16px' }}>
          Call again
        </button>
      </div>
    )
  }

  if (isActive) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} aria-hidden="true" />
          Talking with Quinn
        </span>
        <button onClick={endCall} style={{ ...baseBtn, ...variantStyles.ghost, fontSize: '14px', padding: '8px 16px', color: '#dc2626', borderColor: '#dc2626' }}>
          End call
        </button>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <button onClick={startCall} disabled={isBusy} style={buttonStyle} aria-label="Start a voice call with Quinn, ThriveAtHome's AI concierge">
        {callState === 'connecting' ? (
          <>
            <span aria-hidden="true" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Connecting…
          </>
        ) : (
          <>
            <span aria-hidden="true" style={{ fontSize: compact ? '16px' : '18px', lineHeight: 1 }}>📞</span>
            {label}
          </>
        )}
      </button>

      {callState === 'error' && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#dc2626', margin: 0, maxWidth: '280px' }}>
          {errorMsg ?? 'Could not connect. Please try again or call us directly.'}
          {' '}
          <button onClick={reset} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>
            Retry
          </button>
        </p>
      )}

      {!compact && callState === 'idle' && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Instant AI voice call · no hold music · no phone number needed
        </p>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
