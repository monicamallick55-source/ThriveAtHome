'use client'

import { useEffect, useRef, useState } from 'react'

type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

interface CapturedFields {
  full_name?: string
  preferred_name?: string
  date_of_birth?: string
  phone_number?: string
  topics_enjoy?: string
  preferred_language?: string
  aria_call_opt_in?: string
  lives_alone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

const FIELD_LABELS: Record<keyof CapturedFields, string> = {
  full_name: 'Full name',
  preferred_name: 'Preferred name',
  date_of_birth: 'Date of birth',
  phone_number: 'Phone number',
  topics_enjoy: 'Interests',
  preferred_language: 'Language',
  aria_call_opt_in: 'Daily check-in calls',
  lives_alone: 'Lives alone',
  emergency_contact_name: 'Emergency contact',
  emergency_contact_phone: 'Emergency contact phone',
}

interface QuinnOnboardingProps {
  onComplete: (preferredName: string) => void
  onBack: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RetellWebClient = any

export default function QuinnOnboarding({ onComplete, onBack }: QuinnOnboardingProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [captured, setCaptured] = useState<CapturedFields>({})
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
        body: JSON.stringify({ agent: 'quinn', dynamic_variables: { call_context: 'onboarding' } }),
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
      // Listen for tool_call events — Retell fires these when Quinn calls onboarding_submit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.on('tool_call', (data: any) => {
        if (data?.name === 'onboarding_submit' && data?.arguments) {
          try {
            const args = typeof data.arguments === 'string' ? JSON.parse(data.arguments) : data.arguments
            setCaptured(args as CapturedFields)
          } catch { /* ignore parse errors */ }
        }
      })
      // Also listen for agent_start_talking / update events to parse partial fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.on('update', (update: any) => {
        // Retell sends transcript updates; parse any field mentions from agent utterances
        if (update?.transcript) {
          parseCapturedFromTranscript(update.transcript)
        }
      })
      await client.startCall({ accessToken: access_token, sampleRate: 16000 })
    } catch (err) {
      console.error('[QuinnOnboarding] startCall', err)
      setCallState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start the call.')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseCapturedFromTranscript(transcript: any[]) {
    if (!Array.isArray(transcript)) return
    // Look for the agent's read-back summary to extract confirmed values
    const agentLines = transcript
      .filter((t: any) => t.role === 'agent')
      .map((t: any) => t.content as string)
      .join(' ')

    setCaptured(prev => {
      const next = { ...prev }
      // Simple pattern: "Your name is X" / "I have your name as X"
      const nameMatch = agentLines.match(/(?:your (?:full )?name is|I have your name as)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i)
      if (nameMatch && !next.full_name) next.full_name = nameMatch[1]
      return next
    })
  }

  // Listen for postMessage from onboarding-submit tool response
  useEffect(() => {
    function onMessage(evt: MessageEvent) {
      if (evt.data?.type === 'quinn_onboarding_complete' && evt.data.preferred_name) {
        onComplete(evt.data.preferred_name as string)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onComplete])

  // When call ends, poll for completion (onboarding-submit sets a flag)
  useEffect(() => {
    if (callState !== 'ended') return
    let attempts = 0
    const timer = setInterval(async () => {
      attempts++
      try {
        const res = await fetch('/api/auth/resolve-landing')
        if (res.ok) {
          const data = await res.json() as { path?: string }
          if (data.path === '/member-portal') {
            clearInterval(timer)
            onComplete(captured.preferred_name ?? captured.full_name?.split(' ')[0] ?? 'there')
            return
          }
        }
      } catch { /* ignore */ }
      if (attempts > 10) clearInterval(timer) // give up after ~10s
    }, 1000)
    return () => clearInterval(timer)
  }, [callState, captured, onComplete])

  const filledFields = Object.entries(captured).filter(([, v]) => v !== undefined && v !== '')
  const totalFields = Object.keys(FIELD_LABELS).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <button onClick={onBack} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, margin: 0 }}>Thrive@Home</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Left: call card */}
          <div style={{ backgroundColor: 'var(--color-warm-white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '20px 24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-navy) 0%, #1a4d6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>🎙️</div>

            {callState === 'connecting' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 8px' }}>Connecting to Quinn…</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>Please enable your microphone.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
                <style>{`@keyframes pulse{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
              </>
            )}

            {callState === 'active' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 8px' }}>Talking with Quinn</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>Speak naturally — Quinn fills the form as you go.</p>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', height: '32px', marginBottom: '24px' }}>
                  {[1,2,3,4,5,6,7].map(i => <div key={i} style={{ width: '4px', borderRadius: '3px', backgroundColor: 'var(--color-teal)', animation: `wave 1.0s ease-in-out ${(i*0.11).toFixed(2)}s infinite` }} />)}
                </div>
                <style>{`@keyframes wave{0%,100%{height:6px}50%{height:28px}}`}</style>
                <button onClick={() => { clientRef.current?.stopCall(); setCallState('ended') }} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1.5px solid rgba(192,57,43,0.25)', borderRadius: 'var(--radius-md)', padding: '8px 18px', cursor: 'pointer' }}>End call</button>
              </>
            )}

            {callState === 'ended' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 8px' }}>Call ended</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>Saving your profile…</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid var(--color-warm-grey)', borderTopColor: 'var(--color-teal)', animation: 'spin 0.8s linear infinite' }} />
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <button onClick={onBack} style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Fill manually instead</button>
              </>
            )}

            {callState === 'error' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 8px' }}>Couldn&apos;t connect</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>{errorMsg ?? 'Something went wrong.'}</p>
                <button onClick={() => { startedRef.current = false; void startCall() }} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'var(--color-navy)', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', cursor: 'pointer', marginBottom: '8px', width: '100%' }}>Try again</button>
                <button onClick={onBack} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Fill manually</button>
              </>
            )}
          </div>

          {/* Right: live form preview */}
          <div style={{ backgroundColor: 'var(--color-warm-white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>Your profile</p>
              {filledFields.length > 0 && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-teal)', fontWeight: 500 }}>
                  {filledFields.length}/{totalFields} filled
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ height: '4px', backgroundColor: 'var(--color-warm-grey)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: 'var(--color-teal)', borderRadius: '2px', width: `${(filledFields.length / totalFields) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(Object.keys(FIELD_LABELS) as (keyof CapturedFields)[]).map(key => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {FIELD_LABELS[key]}
                  </span>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: captured[key] ? 'var(--color-navy)' : 'var(--color-warm-grey)',
                    backgroundColor: captured[key] ? 'rgba(0,160,140,0.06)' : 'var(--color-cream)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    minHeight: '30px',
                    transition: 'all 0.3s ease',
                    border: captured[key] ? '1px solid rgba(0,160,140,0.2)' : '1px solid transparent',
                  }}>
                    {captured[key] ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
