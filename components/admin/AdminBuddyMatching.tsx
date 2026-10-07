'use client'
import { useState } from 'react'
import { scoreBuddyVolunteer } from '@/lib/data/buddies'

interface UnmatchedMember {
  id: string
  preferred_name: string
  full_name: string
  plan_tier: string
  topics_enjoy: string[]
  address: string | null
  preferred_language: string
  buddy_match_era: string | null
  buddy_intro_note: string | null
}

interface Volunteer {
  id: string
  full_name: string
  city: string | null
  state: string | null
  languages: string[]
  interests: string[]
  hours_per_week: string | null
  buddy_capacity: number
  buddy_active_count: number
  buddy_preferences: Record<string, unknown> | null
  buddy_bio: string | null
}

interface Props {
  unmatchedMembers: UnmatchedMember[]
  volunteers: Volunteer[]
}

const PLAN_LABELS: Record<string, string> = {
  connect: 'Connect',
  complete: 'Complete',
  premier: 'Premier',
}

export function AdminBuddyMatching({ unmatchedMembers, volunteers }: Props) {
  const [selectedMember, setSelectedMember] = useState<UnmatchedMember | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())

  const availableVolunteers = volunteers.filter(v =>
    v.buddy_active_count < v.buddy_capacity
  )

  const topMatches = selectedMember
    ? availableVolunteers
        .map((v: any) => ({
          volunteer: v,
          ...scoreBuddyVolunteer(v, selectedMember),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    : []

  async function confirmMatch(volunteerId: string) {
    if (!selectedMember) return
    setConfirming(volunteerId)
    setError(null)
    try {
      const match = topMatches.find(m => m.volunteer.id === volunteerId)
      const res = await fetch('/api/admin/buddy-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember.id,
          volunteer_id: volunteerId,
          match_score: match?.score ?? 0,
          match_reasons: match?.reasons ?? [],
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Match failed')
      } else {
        setSuccess(`${selectedMember.preferred_name} matched with ${volunteers.find(v => v.id === volunteerId)?.full_name ?? 'volunteer'}!`)
        setMatched(prev => new Set([...prev, selectedMember.id]))
        setSelectedMember(null)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setConfirming(null)
    }
  }

  const displayMembers = unmatchedMembers.filter(m => !matched.has(m.id))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
      {/* Left: Unmatched members */}
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1.5px solid var(--color-warm-grey)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: 0 }}>
            Waiting for a buddy
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {displayMembers.length} member{displayMembers.length !== 1 ? 's' : ''} unmatched
          </p>
        </div>
        {displayMembers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
            All Connect+ members have buddies
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {displayMembers.map((member: any) => {
              const isSelected = selectedMember?.id === member.id
              return (
                <button
                  key={member.id}
                  onClick={() => { setSelectedMember(isSelected ? null : member); setSuccess(null); setError(null) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px', border: 'none',
                    borderBottom: '1px solid var(--color-warm-grey)',
                    backgroundColor: isSelected ? 'var(--color-teal-muted)' : 'white',
                    cursor: 'pointer',
                    borderLeft: isSelected ? '4px solid var(--color-teal)' : '4px solid transparent',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 2px' }}>
                    {member.preferred_name}
                    <span style={{ fontWeight: 400, fontSize: '14px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                      {PLAN_LABELS[member.plan_tier] ?? member.plan_tier}
                    </span>
                  </p>
                  {member.topics_enjoy?.length > 0 && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      Interests: {member.topics_enjoy.slice(0, 3).join(', ')}
                    </p>
                  )}
                  {member.address && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                      {member.address}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: Suggested volunteers */}
      <div>
        {success && (
          <div style={{ padding: '16px 20px', backgroundColor: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', color: '#065F46', marginBottom: '20px' }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ padding: '16px 20px', backgroundColor: '#FFF0F0', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-urgent-text)', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {!selectedMember ? (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-text-muted)' }}>
              Select a member on the left to see suggested buddies
            </p>
          </div>
        ) : (
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', padding: '20px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '8px' }}>
                Suggested buddies for {selectedMember.preferred_name}
              </h2>
              {selectedMember.buddy_intro_note && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-cream)', padding: '10px 14px', borderRadius: 'var(--radius-md)', margin: '8px 0 0' }}>
                  Family note: "{selectedMember.buddy_intro_note}"
                </p>
              )}
            </div>

            {topMatches.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-warm-grey)', padding: '32px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
                No available volunteers with buddy capacity right now
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {topMatches.map(({ volunteer, score, reasons }, idx) => (
                  <div key={volunteer.id} style={{
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: `1.5px solid ${idx === 0 ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '16px',
                    alignItems: 'start',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        {idx === 0 && (
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-teal)', backgroundColor: 'var(--color-teal-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' }}>
                            Best Match
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', fontWeight: 500 }}>
                          {volunteer.full_name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          Score: {score}
                        </span>
                      </div>
                      {volunteer.buddy_bio && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                          {volunteer.buddy_bio}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {reasons.map((r: any) => (
                          <span key={r} style={{ fontSize: '12px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-cream)', color: 'var(--color-text-secondary)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-warm-grey)' }}>
                            {r}
                          </span>
                        ))}
                        {volunteer.city && (
                          <span style={{ fontSize: '12px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-cream)', color: 'var(--color-text-secondary)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-warm-grey)' }}>
                            {volunteer.city}, {volunteer.state}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-cream)', color: 'var(--color-text-secondary)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-warm-grey)' }}>
                          {volunteer.buddy_active_count}/{volunteer.buddy_capacity} buddies
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => confirmMatch(volunteer.id)}
                      disabled={confirming === volunteer.id}
                      style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: idx === 0 ? 'var(--color-teal)' : 'var(--color-navy)',
                        color: 'white', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                        cursor: confirming === volunteer.id ? 'not-allowed' : 'pointer',
                        opacity: confirming === volunteer.id ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {confirming === volunteer.id ? 'Matching…' : 'Confirm Match'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
