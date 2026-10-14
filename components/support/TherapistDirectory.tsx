'use client'
// G7.16 — Therapist/chaplain/grief counselor directory component
// Embedded in member support pages; chaplain tab only shown when member requests

import { useState, useEffect } from 'react'

interface Advisor {
  id: string
  name: string
  category: string
  specialty: string | null
  bio: string | null
  location: string | null
  telehealth_available: boolean
  license_number: string | null
  license_state: string | null
  non_proselytizing: boolean | null
  listing_tier: string | null
}

interface Props {
  initialCategory?: string
  memberId: string
  showChaplain?: boolean // Only true when member explicitly requests
  onReferralRequested?: (advisorId: string, advisorName: string) => void
}

const CATEGORY_TABS = [
  { key: 'therapist', label: '🧠 Therapists' },
  { key: 'grief_counselor', label: '💛 Grief Counselors' },
  { key: 'social_worker', label: '🤝 Social Workers' },
  { key: 'chaplain', label: '🕊 Spiritual Care', requestOnly: true },
]

const TIER_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  premier: { label: '⭐ Premier', bg: '#fef9c3', color: '#854d0e' },
  featured: { label: '✦ Featured', bg: '#ede9fe', color: '#5b21b6' },
  basic: { label: 'Listed', bg: '#f3f4f6', color: '#6b7280' },
}

export default function TherapistDirectory({ initialCategory = 'therapist', memberId, showChaplain = false, onReferralRequested }: Props) {
  const [tab, setTab] = useState(initialCategory)
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requested, setRequested] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const visibleTabs = CATEGORY_TABS.filter(t => !t.requestOnly || showChaplain)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ category: tab })
    if (tab === 'chaplain') params.set('includeChaplain', 'true')
    fetch(`/api/trusted-advisors?${params}`)
      .then(r => r.json())
      .then(d => setAdvisors(d.advisors ?? []))
      .catch(() => setError('Unable to load advisors'))
      .finally(() => setLoading(false))
  }, [tab])

  const requestIntro = async (advisor: Advisor) => {
    setRequesting(advisor.id)
    try {
      const res = await fetch('/api/navigator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          taskType: 'advisor_intro_request',
          priority: 'medium',
          description: `Member requests introduction to ${advisor.name} (${advisor.category.replace('_', ' ')}).`,
          metadata: { advisor_id: advisor.id, advisor_name: advisor.name, category: advisor.category },
        }),
      })
      if (res.ok) {
        setRequested(prev => new Set([...prev, advisor.id]))
        onReferralRequested?.(advisor.id, advisor.name)
      }
    } catch {
      // silent
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* 988 Crisis line notice — always visible */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '22px' }}>🆘</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#9a3412', marginBottom: '4px' }}>In crisis? You're not alone.</div>
          <div style={{ fontSize: '14px', color: '#7c2d12', lineHeight: 1.5 }}>
            Call or text <strong>988</strong> (Suicide & Crisis Lifeline) — free, confidential, 24/7.
            {' '}<a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" style={{ color: '#9a3412' }}>988lifeline.org</a>
            {' '}· For SAMHSA substance use help: <strong>1-800-662-4357</strong>
            {' '}<a href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer" style={{ color: '#9a3412' }}>SAMHSA helpline</a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              borderColor: tab === t.key ? '#1e3a5f' : '#e5e7eb',
              background: tab === t.key ? '#1e3a5f' : '#fff',
              color: tab === t.key ? '#fff' : '#374151',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chaplain note */}
      {tab === 'chaplain' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#166534' }}>
          🕊 Spiritual care is available on request only. Our chaplains are non-proselytizing and welcome people of all faiths and no faith.
        </div>
      )}

      {error && <div style={{ color: '#991b1b', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>Loading…</div>
      ) : advisors.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>No advisors listed yet in this category.</div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {advisors.map(advisor => {
            const tierInfo = advisor.listing_tier ? TIER_BADGE[advisor.listing_tier] : null
            const isRequested = requested.has(advisor.id)

            return (
              <div key={advisor.id} style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: tierInfo?.bg === '#fef9c3' ? '1px solid #fde68a' : '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>{advisor.name}</h3>
                      {tierInfo && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: tierInfo.bg, color: tierInfo.color }}>
                          {tierInfo.label}
                        </span>
                      )}
                      {advisor.license_state && (
                        <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: '10px' }}>
                          Licensed in {advisor.license_state}
                        </span>
                      )}
                    </div>

                    {advisor.specialty && <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>{advisor.specialty}</div>}
                    {advisor.location && <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>📍 {advisor.location}</div>}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {advisor.telehealth_available && (
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>💻 Telehealth</span>
                      )}
                      {advisor.non_proselytizing && (
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>All faiths welcome</span>
                      )}
                    </div>

                    {advisor.bio && <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginTop: '10px', marginBottom: 0 }}>{advisor.bio}</p>}
                  </div>

                  <button
                    onClick={() => requestIntro(advisor)}
                    disabled={requesting === advisor.id || isRequested}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: isRequested ? 'default' : 'pointer',
                      fontSize: '13px', fontWeight: 600, flexShrink: 0,
                      background: isRequested ? '#dcfce7' : '#1e3a5f',
                      color: isRequested ? '#166534' : '#fff',
                    }}
                  >
                    {requesting === advisor.id ? 'Requesting…' : isRequested ? '✓ Requested' : 'Request introduction'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
