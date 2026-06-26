'use client'

import { useState } from 'react'
import type { NetworkAccountRow, NetworkOrgRow, NetworkDuesRow, NetworkStats } from '@/lib/data/networks'

const NETWORK_TYPE_LABELS: Record<string, string> = {
  vtvn: 'Village to Village Network',
  n4a: 'National Assoc. of Area Agencies on Aging',
  aarp: 'AARP Chapter Network',
  other: 'Network',
}

const ORG_TYPE_LABELS: Record<string, string> = {
  village_network: 'Village Network',
  area_agency_on_aging: 'Area Agency on Aging',
  senior_center: 'Senior Center',
  nonprofit: 'Nonprofit',
  other: 'Other',
}

interface Props {
  network: NetworkAccountRow
  initialOrgs: NetworkOrgRow[]
  initialDues: NetworkDuesRow[]
  stats: NetworkStats
  currentYear: number
}

export default function NetworkAdminPortal({ network, initialOrgs, initialDues, stats, currentYear }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'dues' | 'reports'>('overview')
  const [dues, setDues] = useState(initialDues)
  const [recordingDues, setRecordingDues] = useState<string | null>(null)
  const [duesError, setDuesError] = useState('')
  const [generatingInvoices, setGeneratingInvoices] = useState(false)
  const [invoiceGenResult, setInvoiceGenResult] = useState('')

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'orgs', label: '🏢 Member Organizations' },
    { id: 'dues', label: '💳 Dues Billing' },
    { id: 'reports', label: '📈 Aggregate Reports' },
  ]

  const duePerOrg = (network.dues_per_org_per_year_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const revenueDisplay = (stats.dues_revenue_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  async function handleRecordPayment(orgId: string) {
    setRecordingDues(orgId); setDuesError('')
    const res = await fetch('/api/network/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, fiscal_year: currentYear, amount_cents: network.dues_per_org_per_year_cents }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setRecordingDues(null)
    if (!res.ok) { setDuesError(json.error ?? 'Failed to record payment'); return }
    if (json.data) {
      setDues(prev => {
        const exists = prev.find(d => d.org_id === orgId && d.fiscal_year === currentYear)
        if (exists) return prev.map(d => d.org_id === orgId && d.fiscal_year === currentYear ? json.data : d)
        return [...prev, json.data]
      })
    }
  }

  async function handleGenerateInvoices() {
    const nextYear = currentYear + 1
    if (!confirm(`Generate ${nextYear} dues invoices for all ${initialOrgs.length} member organizations? This will create unpaid invoice records for orgs that don't already have one.`)) return
    setGeneratingInvoices(true); setInvoiceGenResult(''); setDuesError('')
    const res = await fetch('/api/network/generate-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiscal_year: nextYear }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setGeneratingInvoices(false)
    if (!res.ok) { setDuesError(json.error ?? 'Failed to generate invoices'); return }
    setInvoiceGenResult(`✓ Generated ${json.created} invoice${json.created !== 1 ? 's' : ''} for ${nextYear}. ${json.skipped > 0 ? `${json.skipped} org${json.skipped !== 1 ? 's' : ''} already had a record.` : ''}`)
    setTimeout(() => setInvoiceGenResult(''), 6000)
  }

  const orgDuesMap = new Map(dues.filter(d => d.fiscal_year === currentYear).map(d => [d.org_id, d]))

  const statCards = [
    { label: 'Member Organizations', value: stats.member_org_count.toString(), sub: 'Affiliated orgs' },
    { label: 'Dues Paid', value: `${stats.dues_paid_this_year}`, sub: `of ${initialOrgs.length} orgs · ${currentYear}` },
    { label: 'Dues Outstanding', value: `${stats.dues_outstanding_this_year}`, sub: 'Need follow-up' },
    { label: `${currentYear} Revenue`, value: revenueDisplay, sub: `${duePerOrg}/org/yr` },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>·</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{network.name}</span>
        </div>
        <a href="/api/auth/signout" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>Sign out</a>
      </nav>

      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
            {network.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
            {NETWORK_TYPE_LABELS[network.network_type] ?? 'Network'} · Network Federation Portal · Powered by ThriveAtHome
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #E8E4DC', paddingBottom: '0' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--color-teal)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-teal)' : '2px solid transparent',
                marginBottom: '-1px', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {statCards.map(card => (
                <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{card.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>{card.value}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Network info */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Network Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Network Type', value: NETWORK_TYPE_LABELS[network.network_type] ?? network.network_type },
                  { label: 'Contact', value: network.contact_name },
                  { label: 'Email', value: network.contact_email },
                  { label: 'Website', value: network.website ?? '—' },
                  { label: 'Annual Dues per Org', value: duePerOrg },
                  { label: 'Status', value: network.status.charAt(0).toUpperCase() + network.status.slice(1) },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{row.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)', fontWeight: 500 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orgs by type */}
            {Object.keys(stats.orgs_by_type).length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Member Org Types</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {Object.entries(stats.orgs_by_type).map(([type, count]) => (
                    <div key={type} style={{ padding: '10px 20px', backgroundColor: '#F0F8FF', borderRadius: '24px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', fontWeight: 600 }}>
                      {ORG_TYPE_LABELS[type] ?? type} · {count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MEMBER ORGS TAB ── */}
        {activeTab === 'orgs' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Member Organizations</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Organizations affiliated with {network.name}. To add an org, run: UPDATE community_orgs SET network_id = &apos;{network.id}&apos; WHERE id = &apos;[org_uuid]&apos;;
            </p>
            {initialOrgs.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', border: '1px solid #E8E4DC', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏢</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                  No member organizations linked yet. Run the SQL shown above to link orgs to this network.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {initialOrgs.map(org => {
                  const orgDues = orgDuesMap.get(org.id)
                  return (
                    <div key={org.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{org.org_name}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {ORG_TYPE_LABELS[org.org_type] ?? org.org_type}
                          {(org.city || org.state) && ` · ${[org.city, org.state].filter(Boolean).join(', ')}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {orgDues ? (
                          <span style={{ padding: '4px 12px', backgroundColor: orgDues.status === 'paid' ? '#F0FFF4' : '#FFF5F5', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: orgDues.status === 'paid' ? '#15803D' : '#D62828' }}>
                            {orgDues.status === 'paid' ? `✓ Paid ${currentYear}` : `⚠ ${orgDues.status} ${currentYear}`}
                          </span>
                        ) : (
                          <span style={{ padding: '4px 12px', backgroundColor: '#FFF9F0', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#92400E' }}>
                            No dues record {currentYear}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DUES BILLING TAB ── */}
        {activeTab === 'dues' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Dues Billing — {currentYear}</h2>
              <button
                onClick={handleGenerateInvoices}
                disabled={generatingInvoices || initialOrgs.length === 0}
                style={{ padding: '10px 20px', backgroundColor: generatingInvoices ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: generatingInvoices || initialOrgs.length === 0 ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {generatingInvoices ? 'Generating…' : `Generate ${currentYear + 1} invoices`}
              </button>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Annual dues: {duePerOrg} per organization. Track and record payments for all member orgs.
            </p>
            {invoiceGenResult && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{invoiceGenResult}</div>}
            {duesError && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#FFF5F5', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828' }}>{duesError}</div>}

            {initialOrgs.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', border: '1px solid #E8E4DC', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>No member organizations linked yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {initialOrgs.map(org => {
                  const orgDues = orgDuesMap.get(org.id)
                  const isPaid = orgDues?.status === 'paid'
                  return (
                    <div key={org.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{org.org_name}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {[org.city, org.state].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isPaid ? (
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#15803D' }}>
                            ✓ Paid {orgDues?.paid_date ? new Date(orgDues.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRecordPayment(org.id)}
                            disabled={recordingDues === org.id}
                            style={{ padding: '8px 18px', backgroundColor: recordingDues === org.id ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: recordingDues === org.id ? 'default' : 'pointer' }}
                          >
                            {recordingDues === org.id ? 'Recording…' : `Record Payment — ${duePerOrg}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── AGGREGATE REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Aggregate Network Reports</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
              Platform-wide anonymized data across all member organizations. Individual member data is never shared across orgs.
            </p>

            {/* Summary card */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Network Summary — {currentYear}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Member Organizations', value: stats.member_org_count.toString() },
                  { label: 'Dues Revenue', value: revenueDisplay },
                  { label: 'Dues Paid', value: `${stats.dues_paid_this_year} orgs` },
                  { label: 'Dues Outstanding', value: `${stats.dues_outstanding_this_year} orgs` },
                ].map(row => (
                  <div key={row.label} style={{ textAlign: 'center', padding: '16px', backgroundColor: '#FAFAF5', borderRadius: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>{row.value}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benchmarking note */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', border: '1px solid #E8E4DC' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Anonymized Benchmarking</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '20px' }}>
                Comparative benchmarks across network members help each org understand where they stand — and where ThriveAtHome can help them improve. Data is aggregated and anonymized: no org can see another&apos;s individual member data.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {[
                  { metric: 'Check-in completion rate', desc: 'Percentage of scheduled Aria calls completed across network' },
                  { metric: 'Alert resolution time', desc: 'Average hours from alert created to navigator acknowledgment' },
                  { metric: 'Volunteer hours per member', desc: 'Monthly volunteer hours per active member, network average' },
                  { metric: 'Service utilization', desc: 'Services requested per active member per quarter' },
                ].map(item => (
                  <div key={item.metric} style={{ padding: '16px', backgroundColor: '#F0F8FF', borderRadius: '8px', border: '1px solid #D4E9FF' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{item.metric}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-teal)', marginTop: '8px', fontStyle: 'italic' }}>Coming soon — requires min. 10 orgs</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
