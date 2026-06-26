'use client'
// Area Agency on Aging Admin Portal — tabbed dashboard for AAA staff.
// Covers: Overview, Service Log (Title III), Clients & OAA Fields, Counties, Reports & NAPIS Export.
import { useState } from 'react'
import type { AAARow, AAAServiceUnitRow, OAAClientAssessmentRow, AAAStats } from '@/lib/data/aaa'

// ─── Title III Service Types ───────────────────────────────────────────────

const TITLE3_CATEGORIES = [
  { value: 'III-B', label: 'Title III-B — Supportive Services' },
  { value: 'III-C1', label: 'Title III-C1 — Congregate Nutrition' },
  { value: 'III-C2', label: 'Title III-C2 — Home-Delivered Nutrition' },
  { value: 'III-D', label: 'Title III-D — Disease Prevention / Health Promotion' },
  { value: 'III-E', label: 'Title III-E — National Family Caregiver Support' },
]

const SERVICE_TYPES_BY_CATEGORY: Record<string, { value: string; label: string; unit: string }[]> = {
  'III-B': [
    { value: 'transportation', label: 'Transportation', unit: 'trip' },
    { value: 'information_referral', label: 'Information & Referral', unit: 'contact' },
    { value: 'legal_assistance', label: 'Legal Assistance', unit: 'hour' },
    { value: 'visiting', label: 'Visiting / Friendly Visit', unit: 'hour' },
    { value: 'telephone_reassurance', label: 'Telephone Reassurance', unit: 'contact' },
    { value: 'chore_services', label: 'Chore / Home Maintenance', unit: 'hour' },
    { value: 'case_management', label: 'Case Management', unit: 'hour' },
    { value: 'homemaker', label: 'Homemaker Services', unit: 'hour' },
    { value: 'adult_day', label: 'Adult Day Services', unit: 'hour' },
    { value: 'other_b', label: 'Other III-B Supportive Services', unit: 'hour' },
  ],
  'III-C1': [
    { value: 'congregate_meal', label: 'Congregate Meal (at senior center / site)', unit: 'meal' },
  ],
  'III-C2': [
    { value: 'home_delivered_meal', label: 'Home-Delivered Meal', unit: 'meal' },
  ],
  'III-D': [
    { value: 'health_promotion', label: 'Health Promotion Program', unit: 'session' },
    { value: 'fall_prevention', label: 'Fall Prevention / Evidence-Based', unit: 'session' },
    { value: 'chronic_disease', label: 'Chronic Disease Self-Management', unit: 'session' },
    { value: 'diabetes_mgmt', label: 'Diabetes Self-Management', unit: 'session' },
    { value: 'nutrition_counseling', label: 'Nutrition Counseling', unit: 'session' },
    { value: 'other_d', label: 'Other Disease Prevention', unit: 'session' },
  ],
  'III-E': [
    { value: 'respite_care', label: 'Respite Care', unit: 'hour' },
    { value: 'caregiver_counseling', label: 'Caregiver Counseling / Support Group', unit: 'session' },
    { value: 'supplemental_services', label: 'Supplemental Services', unit: 'hour' },
    { value: 'caregiver_training', label: 'Caregiver Training / Education', unit: 'session' },
    { value: 'info_assistance_caregivers', label: 'Information & Assistance for Caregivers', unit: 'contact' },
    { value: 'other_e', label: 'Other Caregiver Support', unit: 'hour' },
  ],
}

const AGE_GROUPS = ['60-64', '65-74', '75-84', '85+']
const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'not_reported', label: 'Not Reported' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'III-B': '#1B3A6B',
  'III-C1': '#2D6A4F',
  'III-C2': '#40916C',
  'III-D': '#9B2335',
  'III-E': '#7B4F9E',
}

// ─── Helper: format date ───────────────────────────────────────────────────

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${parseInt(m)}/${parseInt(day)}/${y}`
}

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  aaa: AAARow
  initialUnits: AAAServiceUnitRow[]
  initialAssessments: OAAClientAssessmentRow[]
  stats: AAAStats
}

type Tab = 'overview' | 'service_log' | 'clients' | 'counties' | 'reports'

interface ServiceUnitFormData {
  service_date: string
  title3_category: string
  service_type: string
  units_provided: string
  unit_type: string
  county: string
  client_age_group: string
  client_gender: string
  poverty_status: string
  minority_status: string
  rural_status: string
  disability_status: string
  worker_name: string
  notes: string
}

const DEFAULT_FORM: ServiceUnitFormData = {
  service_date: new Date().toISOString().split('T')[0],
  title3_category: 'III-B',
  service_type: '',
  units_provided: '1',
  unit_type: 'hour',
  county: '',
  client_age_group: '',
  client_gender: 'not_reported',
  poverty_status: '',
  minority_status: '',
  rural_status: '',
  disability_status: '',
  worker_name: '',
  notes: '',
}

export default function AAAAdminPortal({ aaa, initialUnits, stats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [units, setUnits] = useState(initialUnits)
  const [showLogForm, setShowLogForm] = useState(false)
  const [form, setForm] = useState<ServiceUnitFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [exporting, setExporting] = useState(false)

  const serviceTypesForCategory = SERVICE_TYPES_BY_CATEGORY[form.title3_category] ?? []

  // Auto-set unit type when service type changes
  function handleServiceTypeChange(serviceType: string) {
    const found = serviceTypesForCategory.find((s) => s.value === serviceType)
    setForm((f) => ({ ...f, service_type: serviceType, unit_type: found?.unit ?? 'hour' }))
  }

  function handleCategoryChange(cat: string) {
    const firstType = SERVICE_TYPES_BY_CATEGORY[cat]?.[0]
    setForm((f) => ({
      ...f,
      title3_category: cat,
      service_type: firstType?.value ?? '',
      unit_type: firstType?.unit ?? 'hour',
    }))
  }

  async function handleSubmitUnit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      const res = await fetch('/api/aaa/service-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          units_provided: parseFloat(form.units_provided) || 1,
          poverty_status: form.poverty_status === 'yes' ? true : form.poverty_status === 'no' ? false : null,
          minority_status: form.minority_status === 'yes' ? true : form.minority_status === 'no' ? false : null,
          rural_status: form.rural_status === 'yes' ? true : form.rural_status === 'no' ? false : null,
          disability_status: form.disability_status === 'yes' ? true : form.disability_status === 'no' ? false : null,
          client_age_group: form.client_age_group || null,
          county: form.county || (aaa.counties_served[0] ?? null),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError(json.error ?? 'Failed to log service unit')
        return
      }
      if (json.data) setUnits((prev) => [json.data, ...prev])
      setFormSuccess('Service unit logged successfully.')
      setShowLogForm(false)
      setForm(DEFAULT_FORM)
      setTimeout(() => setFormSuccess(''), 4000)
    } catch {
      setFormError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  async function handleNAPISExport() {
    setExporting(true)
    try {
      const fy = stats.fiscal_year
      const res = await fetch(`/api/aaa/export?fiscal_year=${fy}`)
      if (!res.ok) { setFormError('Export failed'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NAPIS_Export_FY${fy}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setFormError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }

  const totalUnitsThisYear = units.reduce((s, u) => s + u.units_provided, 0)

  const NAV_TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'service_log', label: '📋 Service Log' },
    { key: 'counties', label: '🗺️ Counties' },
    { key: 'reports', label: '📤 Reports & Export' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
            🏛️ {aaa.agency_name}
            {aaa.psa_number && <span style={{ marginLeft: '8px', opacity: 0.6, fontSize: '12px' }}>{aaa.psa_number}</span>}
          </span>
        </div>
        <a href="/api/auth/signout" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Sign out</a>
      </nav>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 32px', display: 'flex', gap: '0' }}>
        {NAV_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '14px 20px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? 'var(--color-navy)' : '#6B7280',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--color-navy)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {/* Success / error banners */}
        {formSuccess && (
          <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: '#065F46', fontFamily: 'var(--font-body)' }}>
            ✓ {formSuccess}
          </div>
        )}
        {formError && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: '#991B1B', fontFamily: 'var(--font-body)' }}>
            ⚠ {formError}
          </div>
        )}

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-navy)', marginBottom: '8px' }}>
              {aaa.agency_name}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#6B7280', marginBottom: '32px' }}>
              {aaa.psa_number && <><strong>{aaa.psa_number}</strong> · </>}
              {aaa.state} · Fiscal Year {stats.fiscal_year} (Q{stats.quarter} in progress)
            </p>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Unduplicated Clients\nThis Fiscal Year', value: stats.total_clients_this_year.toString(), icon: '👥' },
                { label: 'Service Units\nThis Quarter', value: Math.round(stats.total_service_units_this_quarter).toString(), icon: '📋' },
                { label: 'Service Units\nLogged (All Year)', value: Math.round(totalUnitsThisYear).toString(), icon: '📊' },
                { label: 'Counties\nServed', value: aaa.counties_served.length.toString(), icon: '🗺️' },
              ].map((c) => (
                <div key={c.label} style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{c.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#6B7280', marginTop: '6px', whiteSpace: 'pre-line' }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Units by Title III Category */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', marginBottom: '20px' }}>
                Service Units by Title III Category — Q{stats.quarter} FY{stats.fiscal_year}
              </h2>
              {Object.keys(stats.units_by_category).length === 0 ? (
                <p style={{ color: '#6B7280', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  No service units logged this quarter. Use the <button onClick={() => setActiveTab('service_log')} style={{ background: 'none', border: 'none', color: 'var(--color-navy)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px' }}>Service Log</button> tab to log units.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {TITLE3_CATEGORIES.map((cat) => {
                    const units_count = stats.units_by_category[cat.value] ?? 0
                    if (!units_count) return null
                    return (
                      <div key={cat.value} style={{ backgroundColor: '#F9FAFB', border: `2px solid ${CATEGORY_COLORS[cat.value]}`, borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: CATEGORY_COLORS[cat.value], fontFamily: 'var(--font-body)', marginBottom: '4px' }}>{cat.value}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: CATEGORY_COLORS[cat.value], fontWeight: 600 }}>{Math.round(units_count)}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>units</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent entries */}
            {units.length > 0 && (
              <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', marginBottom: '16px' }}>Recent Service Log Entries</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['Date', 'Category', 'Service Type', 'Units', 'County', 'Worker'].map((h) => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {units.slice(0, 10).map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '8px 12px' }}>{fmtDate(u.service_date)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ backgroundColor: CATEGORY_COLORS[u.title3_category] + '18', color: CATEGORY_COLORS[u.title3_category], padding: '2px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '11px' }}>{u.title3_category}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>{u.service_type.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '8px 12px' }}>{u.units_provided} {u.unit_type}</td>
                        <td style={{ padding: '8px 12px', color: '#6B7280' }}>{u.county ?? '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#6B7280' }}>{u.worker_name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {units.length > 10 && (
                  <button onClick={() => setActiveTab('service_log')} style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-navy)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}>
                    View all {units.length} entries →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICE LOG ───────────────────────────────────────────────────── */}
        {activeTab === 'service_log' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', margin: 0 }}>Service Log — FY{stats.fiscal_year}</h1>
              <button
                onClick={() => { setShowLogForm(!showLogForm); setFormError('') }}
                style={{ backgroundColor: 'var(--color-navy)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {showLogForm ? '✕ Close' : '+ Log Service Unit'}
              </button>
            </div>

            {/* Log form */}
            {showLogForm && (
              <form onSubmit={handleSubmitUnit} style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', marginBottom: '20px' }}>Log a Service Unit</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Service Date *</label>
                    <input type="date" value={form.service_date} onChange={(e) => setForm((f) => ({ ...f, service_date: e.target.value }))} required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Title III Category *</label>
                    <select value={form.title3_category} onChange={(e) => handleCategoryChange(e.target.value)} required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
                      {TITLE3_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Service Type *</label>
                    <select value={form.service_type} onChange={(e) => handleServiceTypeChange(e.target.value)} required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
                      <option value="">— Select —</option>
                      {serviceTypesForCategory.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Units Provided *</label>
                    <input type="number" step="0.25" min="0.25" value={form.units_provided} onChange={(e) => setForm((f) => ({ ...f, units_provided: e.target.value }))} required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Unit Type</label>
                    <select value={form.unit_type} onChange={(e) => setForm((f) => ({ ...f, unit_type: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
                      {['hour', 'meal', 'trip', 'session', 'contact'].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>County</label>
                    <select value={form.county} onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
                      <option value="">— Select county —</option>
                      {aaa.counties_served.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Worker Name</label>
                    <input type="text" value={form.worker_name} onChange={(e) => setForm((f) => ({ ...f, worker_name: e.target.value }))} placeholder="Staff or volunteer name"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* OAA Demographic Fields */}
                <details style={{ marginBottom: '16px' }}>
                  <summary style={{ fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '8px 0' }}>
                    OAA Client Demographics (for NAPIS reporting — optional)
                  </summary>
                  <div style={{ paddingTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Age Group</label>
                      <select value={form.client_age_group} onChange={(e) => setForm((f) => ({ ...f, client_age_group: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                        <option value="">Not recorded</option>
                        {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Gender</label>
                      <select value={form.client_gender} onChange={(e) => setForm((f) => ({ ...f, client_gender: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                        {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    {[
                      { key: 'poverty_status' as const, label: 'At/Below Poverty?' },
                      { key: 'minority_status' as const, label: 'Minority Status?' },
                      { key: 'rural_status' as const, label: 'Rural/Isolated?' },
                      { key: 'disability_status' as const, label: 'Has Disability?' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>{label}</label>
                        <select value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                          <option value="">Not recorded</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </details>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional notes for this entry"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {formError && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--font-body)' }}>⚠ {formError}</p>}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" disabled={saving}
                    style={{ backgroundColor: 'var(--color-navy)', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Logging…' : '✓ Log Service Unit'}
                  </button>
                  <button type="button" onClick={() => { setShowLogForm(false); setForm(DEFAULT_FORM); setFormError('') }}
                    style={{ backgroundColor: 'transparent', color: '#6B7280', padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Full service log table */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: 0 }}>
                  All Entries — FY{stats.fiscal_year}
                </h2>
                <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                  {units.length} entries · {Math.round(totalUnitsThisYear)} total units
                </span>
              </div>
              {units.length === 0 ? (
                <p style={{ color: '#6B7280', fontFamily: 'var(--font-body)', fontSize: '14px' }}>No service units logged yet. Click "+ Log Service Unit" to begin.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB' }}>
                        {['Date', 'Category', 'Service Type', 'Units', 'Age Group', 'Poverty', 'Minority', 'Rural', 'County', 'Worker'].map((h) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '7px 10px' }}>{fmtDate(u.service_date)}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{ backgroundColor: CATEGORY_COLORS[u.title3_category] + '18', color: CATEGORY_COLORS[u.title3_category], padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '11px' }}>{u.title3_category}</span>
                          </td>
                          <td style={{ padding: '7px 10px' }}>{u.service_type.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '7px 10px' }}>{u.units_provided} {u.unit_type}</td>
                          <td style={{ padding: '7px 10px', color: '#6B7280' }}>{u.client_age_group ?? '—'}</td>
                          <td style={{ padding: '7px 10px' }}>{u.poverty_status === true ? '✓' : u.poverty_status === false ? '✗' : '—'}</td>
                          <td style={{ padding: '7px 10px' }}>{u.minority_status === true ? '✓' : u.minority_status === false ? '✗' : '—'}</td>
                          <td style={{ padding: '7px 10px' }}>{u.rural_status === true ? '✓' : u.rural_status === false ? '✗' : '—'}</td>
                          <td style={{ padding: '7px 10px', color: '#6B7280' }}>{u.county ?? '—'}</td>
                          <td style={{ padding: '7px 10px', color: '#6B7280' }}>{u.worker_name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COUNTIES ──────────────────────────────────────────────────────── */}
        {activeTab === 'counties' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '8px' }}>Counties Served</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              Planning Service Area: <strong>{aaa.psa_number ?? 'N/A'}</strong> · State: <strong>{aaa.state}</strong>
            </p>

            {aaa.counties_served.length === 0 ? (
              <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontFamily: 'var(--font-body)' }}>No counties configured. Contact ThriveAtHome to update your PSA counties.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {aaa.counties_served.map((county) => {
                  const countyUnits = units.filter((u) => u.county === county)
                  const unitsCount = countyUnits.reduce((s, u) => s + u.units_provided, 0)
                  const clientCount = stats.clients_by_county[county] ?? 0

                  return (
                    <div key={county} style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', marginBottom: '12px' }}>🗺️ {county} County</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)' }}>{clientCount}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>Clients Assessed</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)' }}>{Math.round(unitsCount)}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>Units This Year</div>
                        </div>
                      </div>
                      {countyUnits.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {[...new Set(countyUnits.map((u) => u.title3_category))].map((cat) => (
                            <span key={cat} style={{ backgroundColor: CATEGORY_COLORS[cat] + '18', color: CATEGORY_COLORS[cat], padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{cat}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS & NAPIS EXPORT ────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '8px' }}>Reports & NAPIS Export</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#6B7280', marginBottom: '32px' }}>
              Export service unit data for federal NAPIS reporting. All exports include OAA demographic fields per NAPIS data element specifications.
            </p>

            {/* NAPIS Export Card */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '28px', marginBottom: '24px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '36px' }}>📤</div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: '0 0 4px' }}>NAPIS Export — FY{stats.fiscal_year}</h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    Downloads a CSV with all service unit records for fiscal year {stats.fiscal_year}. Compatible with state aging network reporting systems.
                  </p>
                </div>
              </div>

              {/* Summary for the year */}
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>FY{stats.fiscal_year} Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)' }}>{units.length}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>Records</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)' }}>{Math.round(totalUnitsThisYear)}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>Total Units</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)' }}>{stats.total_clients_this_year}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-body)' }}>Clients</div>
                  </div>
                </div>
              </div>

              {/* CSV columns info */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>CSV Columns</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {['Service Date', 'Title III Category', 'Service Type', 'Units', 'Unit Type', 'Age Group', 'Gender', 'Poverty Status', 'Minority Status', 'Rural Status', 'Disability Status', 'At Risk', 'Nutritional Risk', 'Lives Alone', 'County', 'Worker Name'].map((col) => (
                    <span key={col} style={{ backgroundColor: '#E5E7EB', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>{col}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNAPISExport}
                disabled={exporting || units.length === 0}
                style={{ backgroundColor: units.length === 0 ? '#9CA3AF' : 'var(--color-navy)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: units.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: exporting ? 0.7 : 1 }}
              >
                {exporting ? 'Generating…' : units.length === 0 ? 'No data to export' : `↓ Download NAPIS CSV — FY${stats.fiscal_year}`}
              </button>
              {units.length === 0 && (
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Log service units first to enable export.</p>
              )}
            </div>

            {/* AAA Info Card */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', maxWidth: '600px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', marginBottom: '16px' }}>Agency Information</h2>
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 12px', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                <dt style={{ fontWeight: 600, color: '#374151' }}>Agency Name</dt>
                <dd style={{ color: '#1F2937', margin: 0 }}>{aaa.agency_name}</dd>
                <dt style={{ fontWeight: 600, color: '#374151' }}>PSA Number</dt>
                <dd style={{ color: '#1F2937', margin: 0 }}>{aaa.psa_number ?? '—'}</dd>
                <dt style={{ fontWeight: 600, color: '#374151' }}>State</dt>
                <dd style={{ color: '#1F2937', margin: 0 }}>{aaa.state}</dd>
                <dt style={{ fontWeight: 600, color: '#374151' }}>Counties Served</dt>
                <dd style={{ color: '#1F2937', margin: 0 }}>{aaa.counties_served.join(', ') || '—'}</dd>
                <dt style={{ fontWeight: 600, color: '#374151' }}>Contact</dt>
                <dd style={{ color: '#1F2937', margin: 0 }}>{aaa.contact_name} · {aaa.contact_email}</dd>
                <dt style={{ fontWeight: 600, color: '#374151' }}>Fiscal Year Start</dt>
                <dd style={{ color: '#1F2937', margin: 0 }}>Month {aaa.fiscal_year_start} (FY{stats.fiscal_year})</dd>
              </dl>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
