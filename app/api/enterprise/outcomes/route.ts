// Phase 54 — Medicare Advantage / Enterprise Reporting API
// Returns aggregated, cohort-level outcomes for a partner employer account.
// Auth: Authorization: Bearer <api_key>   (from partner_api_keys table)
// Rate limit: 100 requests per API key per day.
// Minimum cohort: 10 enrolled members — data suppressed below this threshold.
// Never returns individual-level data.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RATE_LIMIT_PER_DAY = 100
const MINIMUM_COHORT_SIZE = 10

export async function GET(req: NextRequest) {
  const admin = createAdminClient()

  // 1. Extract Bearer token from Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>' },
      { status: 401 }
    )
  }
  const apiKey = authHeader.slice(7).trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'API key must not be empty' }, { status: 401 })
  }

  // 2. Look up the API key
  const { data: keyRow, error: keyError } = await admin
    .from('partner_api_keys')
    .select('id, employer_account_id, is_active, requests_today, requests_date')
    .eq('api_key', apiKey)
    .maybeSingle()

  if (keyError) {
    console.error('[enterprise/outcomes] Key lookup error:', keyError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  if (!keyRow) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
  if (!keyRow.is_active) {
    return NextResponse.json({ error: 'API key is inactive. Contact ThriveAtHome to reactivate.' }, { status: 403 })
  }

  // 3. Rate limiting — reset counter at midnight, enforce 100/day cap
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const requestsToday = keyRow.requests_date === today ? keyRow.requests_today : 0

  if (requestsToday >= RATE_LIMIT_PER_DAY) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Maximum 100 requests per API key per 24-hour period.',
        retry_after: 'tomorrow (resets at midnight UTC)',
        requests_today: requestsToday,
        limit: RATE_LIMIT_PER_DAY,
      },
      { status: 429 }
    )
  }

  // 4. Log API access to audit_log (before computing metrics — so access is always recorded)
  const { error: auditError } = await admin.from('audit_log').insert({
    user_id: null,
    action: 'ENTERPRISE_API_ACCESS',
    resource_type: 'partner_api_keys',
    resource_id: keyRow.id,
  })
  if (auditError) {
    console.error('[enterprise/outcomes] Audit log write failed:', auditError)
    // Non-fatal — continue processing
  }

  // 5. Increment daily request counter
  await admin
    .from('partner_api_keys')
    .update({ requests_today: requestsToday + 1, requests_date: today })
    .eq('id', keyRow.id)

  // 6. Count members enrolled under this employer account
  const { count: memberCount } = await admin
    .from('family_members')
    .select('*', { count: 'exact', head: true })
    .eq('employer_account_id', keyRow.employer_account_id)
    .eq('role', 'family')
    .not('member_id', 'is', null)

  const cohortSize = memberCount ?? 0

  // 7. Minimum cohort size enforcement — suppress data below threshold
  if (cohortSize < MINIMUM_COHORT_SIZE) {
    return NextResponse.json(
      {
        employer_account_id: keyRow.employer_account_id,
        reporting_period: { start: thirtyDaysAgo(), end: today },
        generated_at: new Date().toISOString(),
        data_suppressed: true,
        reason: 'Cohort too small to report',
        cohort_minimum: MINIMUM_COHORT_SIZE,
        note: `Data is suppressed when fewer than ${MINIMUM_COHORT_SIZE} members are enrolled to protect individual privacy.`,
      },
      { status: 200 }
    )
  }

  // 8. Get member IDs for this employer
  const { data: memberRows } = await admin
    .from('family_members')
    .select('member_id')
    .eq('employer_account_id', keyRow.employer_account_id)
    .eq('role', 'family')
    .not('member_id', 'is', null)

  const memberIds = (memberRows ?? [])
    .map((r: any) => r.member_id)
    .filter((id): id is string => id !== null && id !== undefined)

  // 9. Compute aggregated call metrics for the last 30 days
  const periodStart = thirtyDaysAgo()
  const { data: callData } = await admin
    .from('check_in_calls')
    .select('status, mood_score, member_id')
    .in('member_id', memberIds)
    .gte('created_at', `${periodStart}T00:00:00Z`)

  const calls = callData ?? []
  const totalCalls = calls.length
  const completedCalls = calls.filter(c => c.status === 'completed').length
  const callCompletionRate =
    totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0

  const moodScores = calls
    .filter(c => c.mood_score !== null && c.mood_score !== undefined)
    .map((c: any) => c.mood_score as number)
  const avgMoodScore =
    moodScores.length > 0
      ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
      : null

  // Count unique members who had at least one completed call (engagement)
  const engagedMemberIds = new Set(
    calls
      .filter(c => c.status === 'completed')
      .map((c: any) => c.member_id)
      .filter(Boolean)
  )
  const uniqueMembersEngaged = engagedMemberIds.size

  // 10. Count active high-priority alerts (unacknowledged urgent/emergency)
  const { count: activeAlerts } = await admin
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .in('member_id', memberIds)
    .eq('acknowledged', false)
    .in('severity', ['urgent', 'emergency'])

  // 11. Return aggregated response — never individual-level data
  return NextResponse.json(
    {
      employer_account_id: keyRow.employer_account_id,
      reporting_period: { start: periodStart, end: today },
      generated_at: new Date().toISOString(),
      data_suppressed: false,
      cohort_size: cohortSize,
      metrics: {
        call_completion_rate_percent: callCompletionRate,
        total_calls_30d: totalCalls,
        completed_calls_30d: completedCalls,
        unique_members_engaged_30d: uniqueMembersEngaged,
        engagement_rate_percent:
          cohortSize > 0 ? Math.round((uniqueMembersEngaged / cohortSize) * 100) : 0,
        average_mood_score_30d: avgMoodScore,
        active_high_priority_alerts: activeAlerts ?? 0,
      },
      note: 'All metrics are aggregated cohort-level data. No individual member data is included in this response.',
      api_version: '1.0',
      requests_remaining_today: RATE_LIMIT_PER_DAY - (requestsToday + 1),
    },
    { status: 200 }
  )
}

function thirtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}
