'use client'

import { useEffect, useRef, useState } from 'react'

type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

interface QuinnOnboardingProps {
  onComplete: (preferredName: string) => void
  onBack: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RetellWebClient = any

export default function QuinnOnboarding({ onComplete, onBack }: QuinnOnboardingProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const clientRef = useRef<RetellWebClient>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void startCall()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCall() {
    setCallState('connecting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/retell/tools/web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'quinn' }),
      })
      if (!res.ok) throw new Error('Could not reach Quinn right now')
      const { access_token } = (await res.json()) as { access_token: string }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import('retell-client-js-sdk')
      const RWC = mod.RetellWebClient ?? mod.default ?? mod
      const client = new RWC()
      clientRef.current = client
      client.on('call_started', () => setCallState('active'))
      client.on('call_ended', () => setCallState('ended'))
      client.on('error', (err: unknown) => {
        console.error('[QuinnOnboarding]', err)
        setCallState('error')
        setErrorMsg('Something went wrong. Please try again or fill the form manually.')
      })
      await client.startCall({ accessToken: access_token, sampleRate: 16000 })
    } catch (err) {
      console.error('[QuinnOnboarding] startCall', err)
      setCallState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start the call.')
    }
  }

  useEffect(() => {
    function onMessage(evt: MessageEvent) {
      if (evt.data?.type === 'quinn_onboarding_complete' && evt.data.preferred_name) {
        onComplete(evt.data.preferred_name as string)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onComplete])

  const card: React.CSSProperties = { backgroundColor: 'var(--color-warm-white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '48px 40px', textAlign: 'center' }
  const btn = (color: string, bg: string): React.CSSProperties => ({ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color, background: bg, border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 28px', cursor: 'pointer' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          <button onClick={onBack} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, margin: 0 }}>Thrive@Home</p>
        </div>
        <div style={card}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-navy) 0%, #1a4d6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '36px' }}>🎙️</div>
          {callState === 'connecting' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', margin: '0 0 12px' }}>Connecting to Quinn…</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 32px' }}>Please make sure your microphone is enabled.</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
              <style>{`@keyframes pulse{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
            </>
          )}
          {callState === 'active' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', margin: '0 0 12px' }}>You&apos;re talking with Quinn</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>She&apos;ll ask you a few questions, then read back what she captured before submitting.</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 36px' }}>💡 Speak naturally — Quinn will handle the rest.</p>
              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center', height: '40px', marginBottom: '36px' }}>
                {[1,2,3,4,5,6,7].map(i => <div key={i} style={{ width: '5px', borderRadius: '3px', backgroundColor: 'var(--color-teal)', animation: `wave 1.0s ease-in-out ${(i*0.11).toFixed(2)}s infinite` }} />)}
              </div>
              <style>{`@keyframes wave{0%,100%{height:8px}50%{height:36px}}`}</style>
              <button onClick={() => { clientRef.current?.stopCall(); setCallState('ended') }} style={{ ...btn('#c0392b','rgba(192,57,43,0.08)'), border: '1.5px solid rgba(192,57,43,0.25)' }}>End call</button>
            </>
          )}
          {callState === 'ended' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', margin: '0 0 12px' }}>Call ended</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 32px' }}>Quinn is submitting your profile — you&apos;ll be redirected in a moment.</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-warm-grey)', borderTopColor: 'var(--color-teal)', animation: 'spin 0.8s linear infinite' }} />
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <button onClick={onBack} style={{ marginTop: '24px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Fill in form manually instead</button>
            </>
          )}
          {callState === 'error' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', margin: '0 0 12px' }}>Couldn&apos;t connect</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 28px' }}>{errorMsg ?? 'Something went wrong.'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => { startedRef.current = false; void startCall() }} style={btn('#fff','var(--color-navy)')}>Try again</button>
                <button onClick={onBack} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Fill in form manually</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
