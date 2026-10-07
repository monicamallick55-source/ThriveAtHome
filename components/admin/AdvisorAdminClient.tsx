'use client'
// Admin — advisor directory: review applications, manage listings, see revenue.
// Phase 98 (M24).
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { advisorTypeLabel, LISTING_TIERS } from '@/lib/advisors/types'
import type { Tables } from '@/types/database'
type TrustedAdvisorRow = Tables<'trusted_advisors'>
type AdvisorListingApplicationRow = Tables<'advisor_listing_applications'>
import type { DirectoryRevenueSummary } from '@/lib/data/advisors'

interface Props {
  initialAdvisors: TrustedAdvisorRow[]
  initialApplications: AdvisorListingApplicationRow[]
  revenue: DirectoryRevenueSummary | null
}

const box: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
}

export default function AdvisorAdminClient({ initialAdvisors, initialApplications, revenue }: Props) {
  const [advisors, setAdvisors] = useState(initialAdvisors)
  const [applications, setApplications] = useState(initialApplications)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function reviewApplication(id: string, action: 'approve' | 'reject', tier?: string) {
    setBusy(id)
    setMsg(null)
    const res = await fetch(`/api/admin/advisors/applications/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, listing_tier: tier }),
    })
    const json = await res.json()
    if (!res.ok) setMsg(json.error ?? 'Action failed.')
    else {
      setApplications((prev) => prev.map((a: any) => (a.id === id ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } : a)))
      if (json.advisor) setAdvisors((prev) => [json.advisor as TrustedAdvisorRow, ...prev])
      setMsg(action === 'approve' ? 'Listing created and activated.' : 'Application rejected.')
    }
    setBusy(null)
  }

  async function updateAdvisor(id: string, patch: Record<string, unknown>) {
    setBusy(id)
    const res = await fetch('/api/admin/advisors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    const json = await res.json()
    if (res.ok && json.advisor) {
      setAdvisors((prev) => prev.map((a: any) => (a.id === id ? (json.advisor as TrustedAdvisorRow) : a)))
    } else {
      setMsg(json.error ?? 'Update failed.')
    }
    setBusy(null)
  }

  const pending = applications.filter((a: any) => a.status === 'new' || a.status === 'reviewing')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {msg && (
        <div style={{ ...box, backgroundColor: 'var(--color-teal-muted)', fontFamily: 'var(--font-body)' }}>{msg}</div>
      )}

      {/* Revenue */}
      <section style={box}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
          Directory revenue
        </h2>
        {revenue ? (
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', fontFamily: 'var(--font-body)' }}>
            <Stat label="Active listings" value={String(revenue.activeListings)} />
            <Stat label="Annualised revenue" value={`$${revenue.annualisedRevenue.toLocaleString()}`} />
            <Stat label="Expiring within 45 days" value={String(revenue.expiringSoon)} />
            {revenue.byTier.map((t: any) => (
              <Stat key={t.tier} label={`${t.tier} (${t.count})`} value={`$${t.revenue.toLocaleString()}`} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>No revenue data.</p>
        )}
      </section>

      {/* Applications */}
      <section style={box}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
          Pending applications ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>No applications waiting for review.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending.map((a: any) => (
              <li key={a.id} style={{ borderTop: '1px solid var(--color-warm-grey)', paddingTop: '12px', fontFamily: 'var(--font-body)' }}>
                <strong style={{ color: 'var(--color-navy)' }}>{a.full_name}</strong>
                {a.firm_name ? ` · ${a.firm_name}` : ''} · {advisorTypeLabel(a.advisor_type)}
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {a.email}{a.phone ? ` · ${a.phone}` : ''} · wants {a.requested_tier} · {a.service_areas ?? 'areas n/a'}
                </div>
                {a.credentials && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Credentials: {a.credentials}</div>}
                {a.message && <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>&ldquo;{a.message}&rdquo;</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                  <select
                    id={`tier-${a.id}`}
                    defaultValue={a.requested_tier}
                    style={{ height: '40px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', padding: '0 10px' }}
                  >
                    {LISTING_TIERS.map((t: any) => (
                      <option key={t.value} value={t.value}>{t.label} (${t.annualFee.toLocaleString()})</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    loading={busy === a.id}
                    onClick={() => {
                      const sel = document.getElementById(`tier-${a.id}`) as HTMLSelectElement | null
                      reviewApplication(a.id, 'approve', sel?.value)
                    }}
                  >
                    Approve &amp; list
                  </Button>
                  <Button size="sm" variant="danger" loading={busy === a.id} onClick={() => reviewApplication(a.id, 'reject')}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active listings */}
      <section style={box}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
          Listings ({advisors.length})
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {advisors.map((a: any) => (
            <li key={a.id} style={{ borderTop: '1px solid var(--color-warm-grey)', paddingTop: '10px', fontFamily: 'var(--font-body)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: 'var(--color-navy)' }}>{a.full_name}</strong> · {advisorTypeLabel(a.advisor_type)} ·{' '}
                <span style={{ textTransform: 'capitalize' }}>{a.listing_tier}</span> · ${Number(a.listing_fee_annual).toLocaleString()}/yr
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {a.listing_status}
                  {a.listing_expires_at ? ` · expires ${new Date(a.listing_expires_at).toLocaleDateString()}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {a.listing_status === 'active' ? (
                  <Button size="sm" variant="secondary" loading={busy === a.id} onClick={() => updateAdvisor(a.id, { listing_status: 'suspended' })}>
                    Suspend
                  </Button>
                ) : (
                  <Button size="sm" loading={busy === a.id} onClick={() => updateAdvisor(a.id, { listing_status: 'active' })}>
                    Activate
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy)' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{label}</div>
    </div>
  )
}
