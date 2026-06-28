'use client'
import { useState } from 'react'

type MoodPoint = { label: string; avg_mood: number | null }
type Icd10Entry = { code: string; count: number }

type MaReport = {
  cohort_description: string
  date_range: { start: string; end: string }
  member_count: number
  total_calls_analyzed: number
  total_alerts: number
  avg_mood_score: number | null
  mood_trend: MoodPoint[]
  medication_adherence_rate_pct: number | null
  social_engagement_score_pct: number | null
  alert_frequency_per_member: number
  urgent_alert_count: number
  fall_risk_mention_count: number
  cognitive_alert_count: number
  top_icd10_codes: Icd10Entry[]
}

type ApiResponse =
  | { data_suppressed: true; reason: string; cohort_size: number; min_cohort_size: number; generated_at: string }
  | { data_suppressed: false; report: MaReport; deidentification_attestation: { statement: string; standard: string; generated_at: string }; generated_at: string }

const COHORT_OPTIONS = [
  { value: 'all', label: 'All active members' },
  { value: 'grief_path', label: 'Grief Welcome Path members' },
  { value: 'employer', label: 'Employer-enrolled members' },
  { value: 'agency', label: 'Agency-referred members' },
]

function fmt(n: number | null, suffix = '') {
  if (n === null) return '—'
  return `${n}${suffix}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function generateCsv(res: ApiResponse): string {
  if (res.data_suppressed) return 'ERROR: Data suppressed — cohort too small'
  const r = res.report
  const att = res.deidentification_attestation

  const rows = [
    ['ThriveAtHome Medicare Advantage Outcomes Report'],
    ['De-identification standard:', att.standard],
    ['Generated:', att.generated_at],
    [''],
    ['COHORT SUMMARY'],
    ['Description', r.cohort_description],
    ['Member count', r.member_count],
    ['Date range start', r.date_range.start],
    ['Date range end', r.date_range.end],
    ['Calls analyzed', r.total_calls_analyzed],
    [''],
    ['KEY METRICS (aggregate — no PHI)'],
    ['Average mood score (1–10)', r.avg_mood_score ?? 'Insufficient data'],
    ['Medication adherence rate', r.medication_adherence_rate_pct !== null ? `${r.medication_adherence_rate_pct}%` : 'Insufficient data'],
    ['Social engagement score', r.social_engagement_score_pct !== null ? `${r.social_engagement_score_pct}%` : 'Insufficient data'],
    ['Alert frequency (per member)', r.alert_frequency_per_member],
    ['Urgent / emergency alerts', r.urgent_alert_count],
    ['Fall risk mentions', r.fall_risk_mention_count],
    ['Cognitive concern signals', r.cognitive_alert_count],
    [''],
    ['MOOD TREND (90-day window)'],
    ['Period', 'Avg Mood Score'],
    ...r.mood_trend.map(p => [p.label, p.avg_mood ?? 'n/a']),
    [''],
    ['TOP ICD-10 CODES (aggregate frequency)'],
    ['Code', 'Count'],
    ...r.top_icd10_codes.map(e => [e.code, e.count]),
    [''],
    ['DE-IDENTIFICATION ATTESTATION'],
    [att.statement],
  ]
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function MaReportSection() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [cohort, setCohort] = useState('all')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null); setResult(null)
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate, cohort })
    const res = await fetch(`/api/admin/ma-report?${params}`)
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(json.error ?? 'Failed to generate report'); return }
    setResult(json)
  }

  function downloadCsv() {
    if (!result) return
    const csv = generateCsv(result)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ma-pitch-data-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '10px', padding: '18px 22px', border: '1px solid #E8E4DC' }
  const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', marginBottom: '4px', display: 'block' }
  const valStyle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)' }

  return (
    <div style={{ marginTop: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            Medicare Advantage Outcomes Report
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            HIPAA de-identified aggregate data — safe for MA plan presentations. Cohorts under {10} members are suppressed.
          </p>
        </div>
        {result && !result.data_suppressed && (
          <button onClick={downloadCsv}
            style={{ padding: '9px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Download MA pitch data (CSV)
          </button>
        )}
      </div>

      {/* Generator form */}
      <form onSubmit={handleGenerate} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px 28px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={labelStyle}>End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={labelStyle}>Cohort</label>
            <select value={cohort} onChange={e => setCohort(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D4CFC8', borderRadius: '8px', fontFamily: 'inherit', fontSize: '15px', backgroundColor: 'white', boxSizing: 'border-box' }}>
              {COHORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '10px 20px', backgroundColor: loading ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Generating…' : 'Generate MA Report'}
            </button>
          </div>
        </div>
      </form>

      {err && <div style={{ padding: '14px 18px', backgroundColor: '#FEE2E2', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#DC2626', marginBottom: '20px' }}>{err}</div>}

      {result?.data_suppressed && (
        <div style={{ padding: '20px 24px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>
            ⚠️ Data suppressed — cohort too small
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#78350F', lineHeight: 1.6 }}>{result.reason}</div>
        </div>
      )}

      {result && !result.data_suppressed && (() => {
        const r = result.report
        const att = result.deidentification_attestation
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ ...cardStyle, backgroundColor: '#F0F9F7', border: '1px solid #86EFAC' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#065F46', marginBottom: '4px' }}>
                {r.cohort_description} · {formatDate(r.date_range.start)} – {formatDate(r.date_range.end)}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#047857' }}>
                {r.member_count} members · {r.total_calls_analyzed} calls analyzed · {r.total_alerts} alerts in period
              </div>
            </div>

            {/* Key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Avg Mood Score', value: fmt(r.avg_mood_score, '/10') },
                { label: 'Medication Adherence', value: fmt(r.medication_adherence_rate_pct, '%') },
                { label: 'Social Engagement', value: fmt(r.social_engagement_score_pct, '%') },
                { label: 'Alerts / Member', value: fmt(r.alert_frequency_per_member) },
                { label: 'Fall Risk Mentions', value: fmt(r.fall_risk_mention_count) },
                { label: 'Cognitive Signals', value: fmt(r.cognitive_alert_count) },
              ].map(m => (
                <div key={m.label} style={cardStyle}>
                  <span style={labelStyle}>{m.label}</span>
                  <div style={valStyle}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Mood trend */}
            <div style={cardStyle}>
              <span style={{ ...labelStyle, marginBottom: '16px' }}>90-Day Mood Trend (aggregate)</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '80px' }}>
                {r.mood_trend.map((p, i) => {
                  const h = p.avg_mood !== null ? Math.round((p.avg_mood / 10) * 72) : 8
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)' }}>{p.avg_mood !== null ? p.avg_mood : '—'}</div>
                      <div style={{ width: '100%', backgroundColor: p.avg_mood !== null ? 'var(--color-teal)' : '#E5E7EB', height: `${h}px`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: '#9CA3AF', textAlign: 'center' }}>{p.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top ICD-10 */}
            {r.top_icd10_codes.length > 0 && (
              <div style={cardStyle}>
                <span style={{ ...labelStyle, marginBottom: '12px' }}>Top ICD-10 Codes (aggregate frequency)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {r.top_icd10_codes.map(e => (
                    <div key={e.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F9F7F4', borderRadius: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>{e.code}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6B7280' }}>{e.count} alert{e.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* De-identification attestation */}
            <div style={{ ...cardStyle, backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: '#065F46', marginBottom: '8px' }}>
                ✓ De-Identification Attestation — {att.standard}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#047857', lineHeight: 1.7 }}>
                {att.statement}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#10B981', marginTop: '8px' }}>
                Generated by {att.generated_at}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
