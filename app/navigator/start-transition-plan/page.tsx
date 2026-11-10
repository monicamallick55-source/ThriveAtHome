'use client'
import { useState } from 'react'
import Link from 'next/link'

const PLAN_TYPES = [
  { id: 'facility_move', label: 'Facility Move', desc: 'Moving to assisted living, memory care, or skilled nursing.' },
  { id: 'grief_support', label: 'Grief Support', desc: 'Loss of spouse, family member, or close friend.' },
  { id: 'diagnosis', label: 'New Diagnosis', desc: 'Chronic illness, cognitive decline, or major health event.' },
  { id: 'caregiving', label: 'Caregiver Transition', desc: 'Family member taking on a primary caregiving role.' },
  { id: 'financial', label: 'Financial Change', desc: 'Major income change, benefits review, or financial stress.' },
]

export default function StartTransitionPlanPage() {
  const [planType, setPlanType] = useState('')
  const [memberId, setMemberId] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!planType || !memberId) return
    setStatus('saving')
    try {
      const res = await fetch('/api/navigator/transition-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: planType, member_id: memberId, notes }),
      })
      setStatus(res.ok ? 'saved' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'saved') return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937' }}>Transition plan started</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>The member's navigator task has been created.</p>
      <Link href="/navigator" style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>← Back to portal</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '48px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/navigator" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Navigator portal</Link>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Start Transition Plan</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Create a structured transition plan for a member.</p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 10 }}>Plan type</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLAN_TYPES.map(p => (
              <label key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', border: planType === p.id ? '2px solid #6366f1' : '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', background: planType === p.id ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="plan_type" value={p.id} checked={planType === p.id} onChange={() => setPlanType(p.id)} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.875rem' }}>{p.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Member ID</label>
          <input type="text" value={memberId} onChange={e => setMemberId(e.target.value)} required placeholder="Paste member UUID"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Context, timeline, family contacts..."
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        {status === 'error' && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>Something went wrong. Please try again.</p>}

        <button type="submit" disabled={!planType || !memberId || status === 'saving'}
          style={{ padding: '12px 24px', background: !planType || !memberId ? '#e5e7eb' : '#6366f1', color: !planType || !memberId ? '#9ca3af' : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: !planType || !memberId ? 'not-allowed' : 'pointer' }}>
          {status === 'saving' ? 'Starting plan…' : 'Start transition plan'}
        </button>
      </form>
    </div>
  )
}
