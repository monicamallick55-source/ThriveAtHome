'use client'
import { useState } from 'react'

const FAITHS = [
  { value: 'all', label: '✨ All Traditions' },
  { value: 'christian', label: '✝️ Christian' },
  { value: 'jewish', label: '✡️ Jewish' },
  { value: 'muslim', label: '☪️ Muslim' },
  { value: 'hindu', label: '🕉️ Hindu' },
  { value: 'buddhist', label: '☸️ Buddhist' },
  { value: 'sikh', label: '🪯 Sikh' },
  { value: 'unitarian', label: '🌈 Unitarian' },
  { value: 'secular', label: '🌿 Non-Religious' },
  { value: 'other', label: '🙏 Other' },
]

const FAITH_LABELS: Record<string, string> = Object.fromEntries(
  FAITHS.filter(f => f.value !== 'all').map(f => [f.value, f.label])
)

interface Chaplain {
  id: string
  full_name: string
  city: string | null
  state: string | null
  faith_affiliation: string | null
  languages: string[]
  total_hours_logged: number
  rating_average: number | null
}

interface Props { chaplains: Chaplain[] }

export function ChaplaincyClient({ chaplains }: Props) {
  const [selectedFaith, setSelectedFaith] = useState('all')

  const filtered = selectedFaith === 'all'
    ? chaplains
    : chaplains.filter(c => c.faith_affiliation === selectedFaith)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
            Faith Community Chaplaincy
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Trained faith community chaplains offering spiritual companionship, prayer, and meaningful conversation.
          </p>
        </div>

        {/* Faith tradition filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {FAITHS.map(f => (
            <button
              key={f.value}
              onClick={() => setSelectedFaith(f.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedFaith === f.value ? '2px solid var(--color-teal)' : '1.5px solid var(--color-warm-grey)',
                backgroundColor: selectedFaith === f.value ? 'var(--color-teal)' : 'white',
                color: selectedFaith === f.value ? 'white' : 'var(--color-text-secondary)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                fontWeight: selectedFaith === f.value ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* What chaplains do */}
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '1.5px solid #FED7AA',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
          }}
        >
          <p style={{ fontWeight: 600, color: '#9A3412', fontFamily: 'var(--font-body)', fontSize: '15px', margin: '0 0 8px' }}>
            🙏 What our chaplains offer
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400E', fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8 }}>
            <li>Regular phone or video calls for spiritual companionship</li>
            <li>Prayer, meditation, or reflective conversation</li>
            <li>Comfort during illness, loss, or life transitions</li>
            <li>Connection to faith resources and community</li>
          </ul>
        </div>

        {/* Chaplain cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🙏</p>
            <p style={{ fontSize: '18px' }}>No chaplains in this tradition yet.</p>
            <a href="/volunteer/apply?track=chaplain" style={{ color: 'var(--color-teal)', fontWeight: 600 }}>
              Volunteer as a faith chaplain →
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {filtered.map(c => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--color-warm-grey)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    🙏
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '15px', margin: 0 }}>
                      {c.full_name}
                    </p>
                    {(c.city || c.state) && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'var(--font-body)', margin: '2px 0 0' }}>
                        📍 {[c.city, c.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {c.faith_affiliation && (
                  <span style={{
                    display: 'inline-block', backgroundColor: '#FFF7ED', color: '#9A3412',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    fontFamily: 'var(--font-body)', marginBottom: '8px',
                  }}>
                    {FAITH_LABELS[c.faith_affiliation] ?? c.faith_affiliation}
                  </span>
                )}

                <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'var(--font-body)', margin: 0 }}>
                  {Math.round(c.total_hours_logged)} hrs · {c.languages.length > 0 ? c.languages.join(', ') : 'English'}
                  {c.rating_average ? ` · ⭐ ${c.rating_average.toFixed(1)}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <a
            href="/volunteer/apply?track=chaplain"
            style={{
              display: 'inline-block',
              backgroundColor: '#EA580C',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '8px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            Volunteer as a faith chaplain →
          </a>
        </div>
      </div>
    </div>
  )
}
