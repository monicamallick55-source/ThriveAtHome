// Medicare Advantage aggregate outcomes report. Admin only. No PHI in output.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MIN_COHORT_SIZE = 10

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (fm?.role !== 'admin') return null
  return admin
}

export async function GET(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const cohortFilter = searchParams.get('cohort') // 'all' | 'grief_path' | 'employer' | 'agency'

  const start = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const end = endDate ? new Date(endDate).toISOString() : new Date().toISOString()

  // Fetch members (apply cohort filter; no PHI fields selected)
  let membersQuery = (admin as any)
    .from('members')
    .select('id, grief_welcome_path, plan_tier, status, check_in_frequency')
    .eq('status', 'active')

  if (cohortFilter === 'grief_path') {
    membersQuery = membersQuery.eq('grief_welcome_path', true)
  }

  const { data: members, error: mErr } = await membersQuery
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  const memberIds: string[] = (members ?? []).map((m: { id: string }) => m.id)
  const cohortSize = memberIds.length

  // Cohort suppression
  if (cohortSize < MIN_COHORT_SIZE) {
    return NextResponse.json({
      data_suppressed: true,
      reason: `Cohort size (${cohortSize}) is below the minimum of ${MIN_COHORT_SIZE} required for de-identified reporting.`,
      cohort_size: cohortSize,
      min_cohort_size: MIN_COHORT_SIZE,
      generated_at: new Date().toISOString(),
    })
  }

  // Fetch calls in range (mood, medication, clinical signals — no PHI)
  const { data: calls } = await (admin as any)
    .from('check_in_calls')
    .select('member_id, mood_score, medication_taken, pain_mentioned, social_isolation_signal, fall_risk_mention, cognitive_concern_signal, status, created_at')
    .in('member_id', memberIds)
    .gte('created_at', start)
    .lte('created_at', end)
    .eq('status', 'completed')

  const callList: {
    member_id: string; mood_score: number | null; medication_taken: boolean | null;
    pain_mentioned: boolean | null; social_isolation_signal: boolean | null;
    fall_risk_mention: boolean | null; cognitive_concern_signal: boolean | null;
  }[] = calls ?? []

  // Fetch alerts in range
  const { data: alerts } = await (admin as any)
    .from('alerts')
    .select('member_id, alert_type, severity, created_at, icd10_codes')
    .in('member_id', memberIds)
    .gte('created_at', start)
    .lte('created_at', end)

  const alertList: { member_id: string; alert_type: string; severity: string; icd10_codes: string[] }[] = alerts ?? []

  // Compute aggregates — NO PHI
  const moodScores = callList.map(c => c.mood_score).filter((s): s is number => s !== null)
  const avgMoodScore = moodScores.length > 0
    ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
    : null

  const callsWithMedData = callList.filter(c => c.medication_taken !== null)
  const medicationAdherenceRate = callsWithMedData.length > 0
    ? Math.round((callsWithMedData.filter(c => c.medication_taken).length / callsWithMedData.length) * 100)
    : null

  const callsWithSocial = callList.filter(c => c.social_isolation_signal !== null)
  const socialEngagementScore = callsWithSocial.length > 0
    ? Math.round((callsWithSocial.filter(c => !c.social_isolation_signal).length / callsWithSocial.length) * 100)
    : null

  const fallRiskCount = callList.filter(c => c.fall_risk_mention).length
  const cognitiveAlertCount = callList.filter(c => c.cognitive_concern_signal).length

  const alertFrequencyPerMember = alertList.length / cohortSize
  const urgentAlerts = alertList.filter(a => a.severity === 'urgent' || a.severity === 'emergency').length

  // ICD-10 frequency map (aggregate)
  const icd10Freq: Record<string, number> = {}
  for (const a of alertList) {
    for (const code of (a.icd10_codes ?? [])) {
      icd10Freq[code] = (icd10Freq[code] ?? 0) + 1
    }
  }
  const topIcd10 = Object.entries(icd10Freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }))

  // Mood trend over 4 windows
  const moodTrend = computeMoodTrend(callList, new Date(start), new Date(end))

  return NextResponse.json({
    data_suppressed: false,
    report: {
      cohort_description: cohortFilter === 'grief_path' ? 'Grief Welcome Path members' : 'All active members',
      date_range: { start, end },
      member_count: cohortSize,
      total_calls_analyzed: callList.length,
      total_alerts: alertList.length,
      avg_mood_score: avgMoodScore,
      mood_trend: moodTrend,
      medication_adherence_rate_pct: medicationAdherenceRate,
      social_engagement_score_pct: socialEngagementScore,
      alert_frequency_per_member: Math.round(alertFrequencyPerMember * 10) / 10,
      urgent_alert_count: urgentAlerts,
      fall_risk_mention_count: fallRiskCount,
      cognitive_alert_count: cognitiveAlertCount,
      top_icd10_codes: topIcd10,
    },
    deidentification_attestation: {
      statement: 'This report contains no Protected Health Information (PHI) as defined by HIPAA 45 CFR §164.514. All data is presented as aggregate statistics. No individual names, dates of birth, addresses, phone numbers, or other direct identifiers are included. Cohort size meets the minimum threshold of 10 required for de-identified reporting.',
      standard: 'HIPAA Safe Harbor (45 CFR §164.514(b))',
      generated_at: new Date().toISOString(),
      generated_by: 'ThriveAtHome MA Outcomes Engine v1.0',
    },
    generated_at: new Date().toISOString(),
  })
}

function computeMoodTrend(
  calls: { mood_score: number | null; created_at?: string }[],
  start: Date,
  end: Date,
): Array<{ label: string; avg_mood: number | null }> {
  const span = end.getTime() - start.getTime()
  const quarter = span / 4
  return [0, 1, 2, 3].map(i => {
    const windowStart = start.getTime() + i * quarter
    const windowEnd = windowStart + quarter
    const label = new Date(windowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const windowCalls = calls.filter(c => {
      if (!c.created_at) return false
      const t = new Date(c.created_at).getTime()
      return t >= windowStart && t < windowEnd
    })
    const scores = windowCalls.map(c => c.mood_score).filter((s): s is number => s !== null)
    return {
      label,
      avg_mood: scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null,
    }
  })
}
