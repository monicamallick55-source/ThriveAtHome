'use client'
// components/volunteer/RetiredProfessionalCard.tsx
// G7.10 — Retired professional volunteers: surfaced in Legal/Financial/Health Hubs

import { useState } from 'react'

const SPECIALTY_LABELS: Record<string, { label: string; emoji: string; hub: string }> = {
  attorney:    { label: 'Attorney',         emoji: '⚖️', hub: 'Legal Hub' },
  cpa:         { label: 'CPA / Accountant', emoji: '📊', hub: 'Financial Hub' },
  physician:   { label: 'Physician',        emoji: '🩺', hub: 'Health Services' },
  nurse:       { label: 'Nurse',            emoji: '🏥', hub: 'Health Services' },
  pharmacist:  { label: 'Pharmacist',       emoji: '💊', hub: 'Health Services' },
  engineer:    { label: 'Engineer',         emoji: '⚙️', hub: 'Tech Support' },
  social_work: { label: 'Social Worker',    emoji: '🤝', hub: 'Navigator Services' },
  financial:   { label: 'Financial Advisor',emoji: '💰', hub: 'Financial Hub' },
  therapist:   { label: 'Therapist',        emoji: '🧠', hub: 'Wellness' },
}

interface Professional {
  id: string;
  first_name: string;
  last_initial: string;
  professional_specialty: string;
  bio: string | null;
  total_hours: number;
  status: string;
}

interface Props {
  professional: Professional;
  memberId: string;
  onReferralCreated?: (taskId: string) => void;
}

export default function RetiredProfessionalCard({ professional, memberId, onReferralCreated }: Props) {
  const [showReferral, setShowReferral] = useState(false)
  const [referralNote, setReferralNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const specialty = SPECIALTY_LABELS[professional.professional_specialty] ?? {
    label: professional.professional_specialty,
    emoji: '👤',
    hub: 'General',
  }

  async function handleReferral() {
    if (!referralNote.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/navigator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          taskType: 'professional_referral',
          priority: 'medium',
          description: `Connect member with retired ${specialty.label} volunteer ${professional.first_name} ${professional.last_initial}. — ${referralNote}`,
          metadata: {
            volunteer_id: professional.id,
            specialty: professional.professional_specialty,
            hub: specialty.hub,
          },
        }),
      })
      if (res.ok) {
        const { task } = await res.json()
        setSent(true)
        onReferralCreated?.(task?.id)
        setShowReferral(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {specialty.emoji} {professional.first_name} {professional.last_initial}.
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            Retired {specialty.label} · {professional.total_hours.toFixed(0)}h volunteered
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Available via {specialty.hub}</div>
        </div>
        {sent ? (
          <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>✅ Referral sent</span>
        ) : (
          <button
            onClick={() => setShowReferral(!showReferral)}
            style={{
              padding: '6px 12px', background: '#f0fdf4', color: '#166534',
              border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >Refer member</button>
        )}
      </div>

      {professional.bio && (
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>{professional.bio}</p>
      )}

      {showReferral && !sent && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          <textarea
            placeholder={`Describe what the member needs from this ${specialty.label}…`}
            value={referralNote}
            onChange={(e) => setReferralNote(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowReferral(false)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff' }}>
              Cancel
            </button>
            <button
              onClick={handleReferral} disabled={!referralNote.trim() || submitting}
              style={{
                padding: '6px 12px', background: '#166534', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
              }}
            >{submitting ? 'Sending…' : 'Create referral task'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
