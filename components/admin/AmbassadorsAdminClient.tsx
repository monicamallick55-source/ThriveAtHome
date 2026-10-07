'use client'
import { useState } from 'react'
import type { Tables } from '@/types/database'
type MemberAmbassadorRow = Tables<'member_ambassadors'>

const AMBASSADOR_SPECIALTIES = [
  { value: 'onboarding_support', label: 'Onboarding Support' },
  { value: 'event_hosting', label: 'Event Hosting' },
  { value: 'circle_moderation', label: 'Circle Moderation' },
  { value: 'cultural_liaison', label: 'Cultural Liaison' },
]

interface Props { ambassadors: MemberAmbassadorRow[] }

export function AmbassadorsAdminClient({ ambassadors: initial }: Props) {
  const [ambassadors, setAmbassadors] = useState(initial)
  const [nomForm, setNomForm] = useState({ memberId: '', specialties: [] as string[], notes: '' })
  const [nomResult, setNomResult] = useState<string | null>(null)
  const [nomLoading, setNomLoading] = useState(false)

  async function handleNominate(e: React.FormEvent) {
    e.preventDefault()
    if (!nomForm.memberId.trim()) return
    setNomLoading(true)
    const res = await fetch('/api/admin/ambassadors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nomForm),
    })
    const json = await res.json()
    if (json.error) {
      setNomResult(`Error: ${json.error}`)
    } else {
      setNomResult('Ambassador nominated successfully.')
      setNomForm({ memberId: '', specialties: [], notes: '' })
      // Re-fetch list
      const listRes = await fetch('/api/admin/ambassadors')
      const listJson = await listRes.json()
      if (listJson.data) setAmbassadors(listJson.data)
    }
    setNomLoading(false)
  }

  function toggleSpecialty(s: string) {
    setNomForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }))
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      active: { bg: '#D1FAE5', color: '#065F46' },
      paused: { bg: '#FEF3C7', color: '#92400E' },
      ended: { bg: '#F3F4F6', color: '#6B7280' },
    }
    const c = colors[status] ?? colors['ended']
    return (
      <span style={{ backgroundColor: c.bg, color: c.color, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <a href="/admin" style={{ color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontSize: '14px', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
            ← Admin
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
            Member Ambassador Programme
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '16px', margin: 0 }}>
            Active senior members who welcome newcomers, host events, and strengthen the community.
          </p>
        </div>

        {/* Nominate form */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
            Nominate a Member Ambassador
          </h2>
          <form onSubmit={handleNominate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Member ID
              </label>
              <input
                type="text"
                value={nomForm.memberId}
                onChange={e => setNomForm(f => ({ ...f, memberId: e.target.value }))}
                placeholder="UUID of the member to nominate"
                required
                style={{ width: '100%', height: '44px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                Ambassador specialties
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {AMBASSADOR_SPECIALTIES.map((s: any) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSpecialty(s.value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: nomForm.specialties.includes(s.value) ? '2px solid var(--color-teal)' : '1.5px solid var(--color-warm-grey)',
                      backgroundColor: nomForm.specialties.includes(s.value) ? 'var(--color-teal)' : 'white',
                      color: nomForm.specialties.includes(s.value) ? 'white' : 'var(--color-text-secondary)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Notes (optional)
              </label>
              <textarea
                value={nomForm.notes}
                onChange={e => setNomForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Why this member would make a great ambassador…"
                rows={3}
                style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={nomLoading}
              style={{ height: '44px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', cursor: nomLoading ? 'wait' : 'pointer' }}
            >
              {nomLoading ? 'Nominating…' : 'Nominate Ambassador'}
            </button>

            {nomResult && (
              <p style={{ color: nomResult.startsWith('Error') ? '#DC2626' : '#065F46', fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
                {nomResult}
              </p>
            )}
          </form>
        </div>

        {/* Active ambassadors table */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-warm-grey)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
              Active Ambassadors ({ambassadors.length})
            </h2>
          </div>

          {ambassadors.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>⭐</p>
              <p style={{ fontSize: '16px' }}>No ambassadors yet. Nominate your first one above!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F8F3' }}>
                    {['Member', 'Since', 'Specialties', 'Members Welcomed', 'Events Hosted', 'Status'].map((h: any) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-warm-grey)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.map((amb: any, i: number) => (
                    <tr key={amb.id} style={{ borderBottom: i < ambassadors.length - 1 ? '1px solid var(--color-warm-grey)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)' }}>
                        {((amb as any).member as { preferred_name?: string; full_name?: string } | null)?.preferred_name
                          || ((amb as any).member as { preferred_name?: string; full_name?: string } | null)?.full_name
                          || amb.member_id.slice(0, 8) + '…'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {amb.ambassador_since}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(amb.specialties?.length ?? 0) > 0
                            ? amb.specialties?.map((s: any) => (
                              <span key={s} style={{ backgroundColor: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                                {AMBASSADOR_SPECIALTIES.find(x => x.value === s)?.label ?? s}
                              </span>
                            ))
                            : <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>—</span>
                          }
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', textAlign: 'center' }}>
                        {amb.total_new_members_welcomed}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', textAlign: 'center' }}>
                        {amb.total_events_hosted}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {statusBadge(amb.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
