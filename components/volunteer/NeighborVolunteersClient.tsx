'use client'
import { useState } from 'react'

const NEIGHBOR_TASKS = [
  { icon: '🛒', label: 'Grocery runs', description: 'Pick up groceries or prescriptions' },
  { icon: '🚗', label: 'Local rides', description: 'Drive to appointments or errands nearby' },
  { icon: '🌿', label: 'Garden help', description: 'Light yard work and outdoor tasks' },
  { icon: '🔨', label: 'Small repairs', description: 'Minor home repairs and handyman tasks' },
  { icon: '🐕', label: 'Pet care', description: 'Dog walks or pet check-ins' },
  { icon: '👋', label: 'Friendly visits', description: 'Drop-in social visits in your neighborhood' },
  { icon: '📦', label: 'Package help', description: 'Collect packages, sort mail' },
  { icon: '❄️', label: 'Weather help', description: 'Snowblowing, shoveling, or storm prep' },
]

export function NeighborVolunteersClient() {
  const [zipCode, setZipCode] = useState('')
  const [searched, setSearched] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearched(true)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
            Neighbor Volunteers
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Neighbors helping neighbors — small acts of help that make a big difference.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {NEIGHBOR_TASKS.map((task: any) => (
            <div
              key={task.label}
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-warm-grey)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <p style={{ fontSize: '28px', margin: '0 0 8px' }}>{task.icon}</p>
              <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '14px', margin: '0 0 4px' }}>
                {task.label}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '12px', margin: 0 }}>
                {task.description}
              </p>
            </div>
          ))}
        </div>

        {/* Search neighbors in my zip code */}
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: '#166534', margin: '0 0 8px' }}>
            Are there neighbors volunteering near you?
          </h2>
          <p style={{ color: '#15803D', fontFamily: 'var(--font-body)', fontSize: '15px', margin: '0 0 16px' }}>
            Enter your zip code to see available neighbor volunteers in your area.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              placeholder="Enter zip code…"
              maxLength={5}
              style={{
                height: '48px',
                width: '200px',
                border: '1.5px solid #BBF7D0',
                borderRadius: '8px',
                padding: '0 14px',
                fontSize: '16px',
                fontFamily: 'var(--font-body)',
                backgroundColor: 'white',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                height: '48px',
                padding: '0 24px',
                backgroundColor: '#16A34A',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>

          {searched && (
            <div style={{ marginTop: '16px', padding: '14px 18px', backgroundColor: 'white', borderRadius: '8px', fontFamily: 'var(--font-body)', color: '#166534', fontSize: '14px' }}>
              {zipCode
                ? `We'll show available neighbor volunteers near ${zipCode} once our navigator sets up local matching. In the meantime, sign up to volunteer yourself!`
                : 'Please enter a zip code to search.'}
            </div>
          )}
        </div>

        {/* Volunteer as a neighbor CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '16px', marginBottom: '16px' }}>
            Small acts of help, big impact. Commit to just 1–2 hours a month.
          </p>
          <a
            href="/volunteer/apply?track=neighbor"
            style={{
              display: 'inline-block',
              backgroundColor: '#16A34A',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '8px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '16px',
              textDecoration: 'none',
            }}
          >
            Volunteer as a neighbor →
          </a>
        </div>
      </div>
    </div>
  )
}
