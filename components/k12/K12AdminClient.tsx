'use client'
import type { K12SchoolRow } from '@/types/database'

const PROGRAM_LABELS: Record<string, string> = {
  pen_pals: '✉️ Pen Pals',
  life_stories: '📖 Life Stories',
  mentorship_reversal: '🤝 Mentorship Reversal',
}

interface Props { schools: K12SchoolRow[] }

export function K12AdminClient({ schools }: Props) {
  const pending = schools.filter(s => s.status === 'pending')
  const active = schools.filter(s => s.status === 'active')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <a href="/admin" style={{ color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontSize: '14px', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
          ← Admin
        </a>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
          K–12 Partner Schools
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '16px', margin: '0 0 32px' }}>
          Manage K-12 school registrations, approve schools, and track student volunteer hours.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Pending review', value: pending.length, color: '#FEF3C7', text: '#92400E' },
            { label: 'Active schools', value: active.length, color: '#D1FAE5', text: '#065F46' },
            { label: 'Total registered', value: schools.length, color: '#EEF2FF', text: '#3730A3' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: stat.color, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 700, color: stat.text, fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: '13px', color: stat.text, fontFamily: 'var(--font-body)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending schools */}
        {pending.length > 0 && (
          <div style={{ backgroundColor: 'white', border: '1px solid #FED7AA', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', backgroundColor: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: '#9A3412', margin: 0 }}>
                Pending Review ({pending.length})
              </h2>
            </div>
            {pending.map((school, i) => (
              <div key={school.id} style={{ padding: '16px 24px', borderBottom: i < pending.length - 1 ? '1px solid var(--color-warm-grey)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>{school.school_name}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '13px', margin: '0 0 4px' }}>
                    {school.school_type} · {school.contact_name} · {school.contact_email}
                    {school.city ? ` · ${school.city}, ${school.state}` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {school.program_types.map(p => (
                      <span key={p} style={{ backgroundColor: '#FFF7ED', color: '#9A3412', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                        {PROGRAM_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      await fetch(`/api/k12/schools/${school.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) })
                      window.location.reload()
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active schools */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-warm-grey)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
              Active Schools ({active.length})
            </h2>
          </div>
          {active.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              <p style={{ fontSize: '36px', margin: '0 0 12px' }}>🏫</p>
              <p>No active partner schools yet. Approve pending registrations to get started.</p>
            </div>
          ) : (
            active.map((school, i) => (
              <div key={school.id} style={{ padding: '16px 24px', borderBottom: i < active.length - 1 ? '1px solid var(--color-warm-grey)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>{school.school_name}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '13px', margin: '0 0 4px' }}>
                      {school.school_type} · {school.contact_name} · {school.contact_email}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {school.program_types.map(p => (
                        <span key={p} style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                          {PROGRAM_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/k12" style={{ color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            View public K-12 program page →
          </a>
        </div>
      </div>
    </div>
  )
}
