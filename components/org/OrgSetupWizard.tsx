"use client"
// OrgSetupWizard — 5-step first-run modal for newly enrolled orgs
import React, { useState } from 'react'

interface Props {
  orgId: string
  orgName: string
  contactName: string
  contactEmail: string
  onComplete: () => void
}

const STEPS = ['Welcome', 'Dues', 'First Program', 'Join Link', 'Done']

export default function OrgSetupWizard({ orgId, orgName, contactName, contactEmail, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — Dues
  const [stdDues, setStdDues] = useState('480')
  const [slidLow, setSlidLow] = useState('120')
  const [slidMid, setSlidMid] = useState('240')
  const [duesDesc, setDuesDesc] = useState('')

  // Step 2 — First program
  const [progName, setProgName] = useState('')
  const [progType, setProgType] = useState('social')
  const [progDesc, setProgDesc] = useState('')
  const [skipProg, setSkipProg] = useState(false)

  async function saveDues() {
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/org-admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_dues_standard_cents: Math.round(parseFloat(stdDues) * 100),
          annual_dues_sliding_low_cents: Math.round(parseFloat(slidLow) * 100),
          annual_dues_sliding_mid_cents: Math.round(parseFloat(slidMid) * 100),
          dues_description: duesDesc || null,
        }),
      })
      if (!r.ok) throw new Error((await r.json()).error)
      setStep(2)
    } catch(e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function saveProgram() {
    if (!skipProg) {
      setSaving(true); setError('')
      try {
        const r = await fetch('/api/org-admin/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_name: progName, program_type: progType, description: progDesc }),
        })
        if (!r.ok) throw new Error((await r.json()).error)
      } catch(e: any) { setError(e.message); setSaving(false); return }
      setSaving(false)
    }
    setStep(3)
  }

  async function finish() {
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/org-admin/setup-complete', { method: 'PATCH' })
      if (!r.ok) throw new Error((await r.json()).error)
      setStep(4)
    } catch(e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const navy = 'var(--color-navy)'
  const teal = 'var(--color-teal)'
  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 14px', fontSize: '15px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white', color: navy }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: navy, marginBottom: '6px', fontFamily: 'var(--font-body)' }
  const btn = (disabled?: boolean): React.CSSProperties => ({ backgroundColor: disabled ? '#94a3b8' : teal, color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer' })

  const joinLink = typeof window !== 'undefined' ? `${window.location.origin}/join?org=${orgId}` : `/join?org=${orgId}`

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: i <= step ? teal : '#e5e7eb' }} />
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏘️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: navy, marginBottom: '12px' }}>Welcome to ThriveAtHome</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '8px' }}>
              Hi {contactName} — <strong>{orgName}</strong> is enrolled. This quick setup takes about 3 minutes.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              We will set up your membership dues, create your first programme, and get your member join link ready.
            </p>
            <button onClick={() => setStep(1)} style={btn()}>Let us get started →</button>
          </div>
        )}

        {/* Step 1 — Dues */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: navy, marginBottom: '8px' }}>Set membership dues</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              These are the annual dues your members pay. You can change them at any time in Settings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Standard dues ($/year)', val: stdDues, set: setStdDues },
                { label: 'Sliding scale — low ($/year)', val: slidLow, set: setSlidLow },
                { label: 'Sliding scale — mid ($/year)', val: slidMid, set: setSlidMid },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label style={lbl}>{label}</label>
                  <input type="number" min="0" value={val} onChange={e => set(e.target.value)} style={inp} />
                </div>
              ))}
              <div>
                <label style={lbl}>Dues description (optional)</label>
                <textarea value={duesDesc} onChange={e => setDuesDesc(e.target.value)} placeholder="e.g. Annual dues support village operations and member services." rows={2} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
            {error && <p style={{ color: '#b91c1c', fontSize: '14px', marginTop: '12px', fontFamily: 'var(--font-body)' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setStep(0)} style={{ ...btn(), backgroundColor: 'transparent', color: navy, border: '1px solid var(--color-border)' }}>Back</button>
              <button onClick={saveDues} disabled={saving} style={btn(saving)}>{saving ? 'Saving…' : 'Save & continue →'}</button>
            </div>
          </div>
        )}

        {/* Step 2 — First program */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: navy, marginBottom: '8px' }}>Create your first programme</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Programmes let you organise activities and track participation. Add one now or skip to do it later.
            </p>
            {!skipProg && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={lbl}>Programme name *</label>
                  <input value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. Wednesday Morning Walk" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Type</label>
                  <select value={progType} onChange={e => setProgType(e.target.value)} style={inp}>
                    {[['social','Social & Companionship'],['transport','Transportation'],['meals','Meals & Nutrition'],['technology','Technology Help'],['health','Health & Wellness'],['education','Education & Enrichment'],['general','General']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Description</label>
                  <textarea value={progDesc} onChange={e => setProgDesc(e.target.value)} placeholder="Brief description of the programme…" rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>
              </div>
            )}
            {error && <p style={{ color: '#b91c1c', fontSize: '14px', marginTop: '12px', fontFamily: 'var(--font-body)' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button onClick={() => setStep(1)} style={{ ...btn(), backgroundColor: 'transparent', color: navy, border: '1px solid var(--color-border)' }}>Back</button>
              {!skipProg
                ? <button onClick={saveProgram} disabled={saving || !progName} style={btn(saving || !progName)}>{saving ? 'Saving…' : 'Save & continue →'}</button>
                : <button onClick={() => setStep(3)} style={btn()}>Continue →</button>
              }
              <button onClick={() => setSkipProg(s => !s)} style={{ ...btn(), backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: 'none', padding: '12px 8px', fontSize: '14px' }}>
                {skipProg ? '+ Add a programme' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Join link */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: navy, marginBottom: '8px' }}>Your member join link</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Share this link with your members so they can request to join {orgName} on ThriveAtHome.
            </p>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', fontFamily: 'monospace', fontSize: '14px', color: navy, wordBreak: 'break-all', marginBottom: '16px' }}>
              {joinLink}
            </div>
            <button onClick={() => { try { navigator.clipboard.writeText(joinLink) } catch {} }} style={{ ...btn(), fontSize: '14px', padding: '10px 20px', marginBottom: '24px' }}>
              📋 Copy link
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(2)} style={{ ...btn(), backgroundColor: 'transparent', color: navy, border: '1px solid var(--color-border)' }}>Back</button>
              <button onClick={finish} disabled={saving} style={btn(saving)}>{saving ? 'Finishing…' : 'Complete setup →'}</button>
            </div>
            {error && <p style={{ color: '#b91c1c', fontSize: '14px', marginTop: '12px', fontFamily: 'var(--font-body)' }}>{error}</p>}
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: navy, marginBottom: '12px' }}>You are all set!</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
              {orgName} is live on ThriveAtHome. Head to your dashboard to start managing members and programmes.
            </p>
            <button onClick={onComplete} style={btn()}>Go to my dashboard →</button>
          </div>
        )}
      </div>
    </div>
  )
}
