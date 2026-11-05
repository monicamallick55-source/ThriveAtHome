'use client'

import { useState } from 'react'

interface MAReport {
  date_range: { start: string; end: string }
  generated_at: string
  data_quality: { total_calls: number; calls_with_clinical_data: number; coverage_pct: number }
  member_engagement: { unique_members_with_calls: number; total_calls: number; avg_calls_per_member: number; avg_call_duration_seconds: number | null }
  clinical_signals: { pct_with_pain_mentioned: number | null; pct_with_fall_risk: number | null; pct_with_medication_adherence: number | null; pct_with_social_isolation: number | null; pct_with_cognitive_concern: number | null }
  scores: { avg_mood_score: number | null; avg_energy_score: number | null; avg_pain_score: number | null }
  icd10_frequency: Record<string, number>
  suppressed?: boolean
  reason?: string
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function PctBar({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="text-gray-400">N/A</span></div>
      <div className="h-2 bg-gray-100 rounded-full" />
    </div>
  )
  const color = pct > 20 ? 'bg-red-400' : 'bg-teal-500'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-700">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function MAReportPage() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  const [start, setStart] = useState(monthStart)
  const [end, setEnd] = useState(today)
  const [report, setReport] = useState<MAReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch(`/api/admin/ma-report?start=${start}&end=${end}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setReport(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    window.open(`/api/admin/ma-report?start=${start}&end=${end}&format=csv`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medicare Advantage Report</h1>
        <p className="text-gray-500 text-sm mt-1">De-identified clinical outcomes for MA partners</p>
      </div>

      {/* Date range picker */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <button onClick={load} disabled={loading}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
            {loading ? 'Loading…' : 'Generate Report'}
          </button>
          {report && !report.suppressed && (
            <button onClick={downloadCSV}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              ⬇ CSV Export
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">{error}</div>}

      {report?.suppressed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="font-semibold text-amber-800 mb-1">⚠ Report Suppressed</div>
          <div className="text-amber-700 text-sm">{report.reason}</div>
        </div>
      )}

      {report && !report.suppressed && (
        <>
          {/* Data quality banner */}
          <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
            report.data_quality.coverage_pct >= 80 ? 'bg-teal-50 border border-teal-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <span className="text-lg">{report.data_quality.coverage_pct >= 80 ? '✅' : '⚠️'}</span>
            <div className="text-sm">
              <span className="font-semibold">Data quality: {report.data_quality.coverage_pct}% coverage</span>
              {' '}— {report.data_quality.calls_with_clinical_data} of {report.data_quality.total_calls} calls have clinical fields extracted.
            </div>
          </div>

          {/* Engagement stats */}
          <h2 className="font-semibold text-gray-700 mb-3">Member Engagement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Unique Members" value={report.member_engagement.unique_members_with_calls} />
            <StatCard label="Total Calls" value={report.member_engagement.total_calls} />
            <StatCard label="Avg Calls / Member" value={report.member_engagement.avg_calls_per_member} />
            <StatCard
              label="Avg Call Duration"
              value={report.member_engagement.avg_call_duration_seconds
                ? `${Math.round(report.member_engagement.avg_call_duration_seconds / 60)}m`
                : 'N/A'}
            />
          </div>

          {/* Clinical scores */}
          <h2 className="font-semibold text-gray-700 mb-3">Clinical Scores</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
              label="Avg Mood Score"
              value={report.scores.avg_mood_score !== null ? `${report.scores.avg_mood_score} / 10` : 'N/A'}
              sub="10 = very positive"
            />
            <StatCard
              label="Avg Energy Score"
              value={report.scores.avg_energy_score !== null ? `${report.scores.avg_energy_score} / 10` : 'N/A'}
              sub="10 = very energetic"
            />
            <StatCard
              label="Avg Pain Score"
              value={report.scores.avg_pain_score !== null ? `${report.scores.avg_pain_score} / 10` : 'N/A'}
              sub="0 = no pain"
            />
          </div>

          {/* Clinical signals */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Clinical Signal Prevalence</h2>
            <PctBar label="Fall risk mentioned" pct={report.clinical_signals.pct_with_fall_risk} />
            <PctBar label="Pain mentioned" pct={report.clinical_signals.pct_with_pain_mentioned} />
            <PctBar label="Social isolation signals" pct={report.clinical_signals.pct_with_social_isolation} />
            <PctBar label="Cognitive concern signals" pct={report.clinical_signals.pct_with_cognitive_concern} />
            <PctBar label="Medication adherence confirmed" pct={report.clinical_signals.pct_with_medication_adherence} />
          </div>

          {/* ICD-10 */}
          {Object.keys(report.icd10_frequency).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">ICD-10 Code Frequency</h2>
              <div className="space-y-2">
                {Object.entries(report.icd10_frequency)
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, count]) => (
                    <div key={code} className="flex justify-between text-sm">
                      <span className="font-mono text-gray-700">{code}</span>
                      <span className="text-gray-500">{count} call{count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Report generated {new Date(report.generated_at).toLocaleString()}. De-identified — no member names, DOBs, or addresses included.
          </p>
        </>
      )}
    </div>
  )
}
