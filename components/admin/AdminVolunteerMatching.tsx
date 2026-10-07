'use client'
import { useState } from 'react'
import type { MatchResult } from '@/lib/data/volunteers'

interface PendingMember {
  id: string
  full_name: string
  preferred_language: string
  address: string | null
  topics_enjoy: string[]
}

interface Props {
  pendingMembers: PendingMember[]
}

export function AdminVolunteerMatching({ pendingMembers }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    pendingMembers.length > 0 ? pendingMembers[0].id : null
  )
  const [matches, setMatches] = useState<MatchResult[] | null>(null)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const selectedMember = pendingMembers.find(m => m.id === selectedMemberId)

  async function loadMatches(memberId: string) {
    setLoadingMatches(true)
    setMatches(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/volunteer-matching/matches?memberId=${memberId}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load matches')
      } else {
        setMatches(json.matches ?? [])
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingMatches(false)
    }
  }

  async function confirmMatch(volunteerId: string, score: number, reasons: string[]) {
    if (!selectedMemberId) return
    setConfirming(volunteerId)
    setError(null)
    try {
      const res = await fetch('/api/admin/volunteer-matching/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selectedMemberId, volunteerId, score, reasons }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to confirm match')
      } else {
        setConfirmed(prev => new Set([...prev, volunteerId]))
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setConfirming(null)
    }
  }

  const navStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)', fontSize: '16px',
    color: 'var(--color-navy)', fontWeight: 500,
  }
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '32px', minHeight: '60vh' }}>
      {/* Left: pending members */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '16px' }}>
          Members needing a match
        </h2>
        {pendingMembers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
            All members have been matched.
          </div>
        ) : (
          pendingMembers.map((m: any) => (
            <div key={m.id}
              onClick={() => {
                setSelectedMemberId(m.id)
                setMatches(null)
                setError(null)
              }}
              style={{
                ...cardStyle,
                borderColor: selectedMemberId === m.id ? 'var(--color-teal)' : 'var(--color-warm-grey)',
                boxShadow: selectedMemberId === m.id ? '0 0 0 2px var(--color-teal)' : 'none',
              }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{m.full_name}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                {m.address ?? 'Location not set'} · {m.preferred_language}
              </p>
              {m.topics_enjoy.length > 0 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Interests: {m.topics_enjoy.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Right: suggested volunteers */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>
            Top volunteer matches{selectedMember ? ` for ${selectedMember.full_name}` : ''}
          </h2>
          {selectedMemberId && (
            <button
              onClick={() => loadMatches(selectedMemberId)}
              disabled={loadingMatches}
              style={{ height: '40px', padding: '0 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: loadingMatches ? 'not-allowed' : 'pointer' }}>
              {loadingMatches ? 'Loading…' : 'Find top matches'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: '14px 18px', backgroundColor: '#FFF0F0', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-urgent-text)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {!matches && !loadingMatches && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '16px', backgroundColor: 'white', border: '1px dashed var(--color-warm-grey)', borderRadius: 'var(--radius-lg)' }}>
            Select a member on the left, then click &ldquo;Find top matches&rdquo; to see ranked volunteer suggestions.
          </div>
        )}

        {loadingMatches && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
            Scoring volunteers…
          </div>
        )}

        {matches && matches.length === 0 && (
          <div style={{ padding: '40px 32px', textAlign: 'center', backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '8px' }}>No active volunteers yet</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              To match volunteers, you need at least one active volunteer. Go to the Applications page, approve an application, then click <strong>Activate Volunteer</strong> once the background check passes.
            </p>
            <a href="/admin/volunteers" style={{ display: 'inline-block', height: '44px', lineHeight: '44px', padding: '0 24px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>
              Go to Volunteer Applications
            </a>
          </div>
        )}

        {matches && matches.map((m: any) => {
          const isConfirmed = confirmed.has(m.volunteer.id)
          return (
            <div key={m.volunteer.id} style={{
              backgroundColor: 'white',
              border: `1.5px solid ${isConfirmed ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600, color: 'var(--color-navy)' }}>{m.volunteer.full_name}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}>
                      Score: {m.score}
                    </span>
                    {m.volunteer.has_drivers_license && m.volunteer.insurance_provider && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500 }}>
                        ✓ Driver verified
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {[m.volunteer.city, m.volunteer.state].filter(Boolean).join(', ')} · {m.volunteer.hours_per_week ?? 'Hours not set'}/week
                  </p>
                  {m.reasons.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {m.reasons.map((r: any) => (
                        <span key={r} style={{ display: 'inline-flex', padding: '3px 10px', backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-warm-grey)', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {isConfirmed ? (
                    <span style={{ ...navStyle, color: 'var(--color-teal)', fontSize: '15px' }}>Matched</span>
                  ) : (
                    <button
                      onClick={() => confirmMatch(m.volunteer.id, m.score, m.reasons)}
                      disabled={confirming === m.volunteer.id}
                      style={{ height: '44px', padding: '0 20px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: confirming === m.volunteer.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                      {confirming === m.volunteer.id ? 'Confirming…' : 'Confirm match'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
