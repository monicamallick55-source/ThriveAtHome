'use client'

/**
 * app/dashboard/grief-circles/page.tsx — G4.4 Grief Circles (member view)
 *
 * Shows circles the member has been invited to or is active in.
 * Navigator-invite only — members cannot self-enroll.
 */

import { useState, useEffect } from 'react'

type GriefCircle = {
  id: string
  name: string
  description?: string
  loss_type: string
  format: string
  schedule_text?: string
  status: string
  next_session_at?: string
  grief_circle_members: { member_id: string; status: string; joined_at?: string }[]
}

const LOSS_TYPE_LABELS: Record<string, string> = {
  spouse:  'Loss of a spouse',
  parent:  'Loss of a parent',
  child:   'Loss of a child',
  sibling: 'Loss of a sibling',
  friend:  'Loss of a friend',
  pet:     'Loss of a pet',
  general: 'General grief support',
}

const FORMAT_LABELS: Record<string, string> = {
  virtual:    '💻 Virtual',
  in_person:  '🏠 In person',
  hybrid:     '🔄 Hybrid',
}

const STATUS_COLORS: Record<string, string> = {
  forming: '#f59e0b',
  active:  '#10b981',
  paused:  '#6b7280',
  closed:  '#ef4444',
}

export default function GriefCirclesPage() {
  const [circles, setCircles] = useState<GriefCircle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/grief-circles')
      .then((r) => r.json())
      .then(({ circles: list }) => setCircles(list ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Grief Support Circles</h1>
      <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
        Grief circles are small, facilitated groups where you can share your experience with others
        who understand loss. Your navigator will invite you to a circle that fits your needs.
      </p>

      {circles.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 40, color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💙</div>
          <p style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            You haven't been invited to a grief circle yet.
          </p>
          <p style={{ fontSize: '0.875rem', maxWidth: 380, margin: '0 auto' }}>
            If you're going through a loss and would like to connect with others,
            let your navigator know — they'll find the right circle for you.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {circles.map((circle) => {
            const myMembership = circle.grief_circle_members?.[0]
            const memberStatus = myMembership?.status ?? 'invited'

            return (
              <div key={circle.id} style={{
                border: '1px solid #e5e7eb', borderRadius: 14, padding: 20,
                borderLeft: `4px solid ${STATUS_COLORS[circle.status] ?? '#e5e7eb'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{circle.name}</h2>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                      {LOSS_TYPE_LABELS[circle.loss_type] ?? circle.loss_type}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                    background: (STATUS_COLORS[circle.status] ?? '#9ca3af') + '20',
                    color: STATUS_COLORS[circle.status] ?? '#9ca3af',
                  }}>
                    {circle.status}
                  </span>
                </div>

                {circle.description && (
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: 10, lineHeight: 1.5 }}>
                    {circle.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: '#6b7280', marginBottom: 10 }}>
                  <span>{FORMAT_LABELS[circle.format] ?? circle.format}</span>
                  {circle.schedule_text && <span>🗓 {circle.schedule_text}</span>}
                  {circle.next_session_at && (
                    <span>▶ Next: {new Date(circle.next_session_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  )}
                </div>

                {memberStatus === 'invited' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', color: '#1d4ed8' }}>
                    💌 You've been invited. Contact your navigator to confirm your participation.
                  </div>
                )}
                {memberStatus === 'active' && myMembership?.joined_at && (
                  <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>
                    ✓ Active member since {new Date(myMembership.joined_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 32, padding: '16px 20px', background: '#f9fafb', borderRadius: 12, fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6 }}>
        <strong style={{ color: '#374151' }}>About our circles</strong><br />
        All circles are facilitated by trained navigators and limited to 8 members for an intimate,
        supportive environment. Everything shared stays within the group.
        Sessions are virtual via phone or video — no tech skills required.
      </div>
    </div>
  )
}
