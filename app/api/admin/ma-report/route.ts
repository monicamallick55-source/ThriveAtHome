/**
 * app/api/admin/ma-report/route.ts — G5.1 Medicare Advantage Report
 *
 * GET /api/admin/ma-report?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|pdf
 *
 * - Admin / navigator only
 * - Audit-logged on every access
 * - Rate-limited: 100 requests per hour per user
 * - Suppresses report (with message) below 60% clinical-field coverage
 * - De-identified: no names, DOBs, addresses in export
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000  // 1 hour
const RATE_LIMIT_MAX = 100
const COVERAGE_THRESHOLD = 0.60  // suppress below 60%

// In-memory rate limit store (resets on cold start — acceptable for admin endpoint)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function toCSV(rows: any[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member || !['admin', 'navigator'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 100 requests per hour.' }, { status: 429 })
    }

    const url = new URL(req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const format = url.searchParams.get('format') ?? 'json'

    if (!start || !end) {
      return NextResponse.json({ error: 'start and end query params required (YYYY-MM-DD)' }, { status: 400 })
    }

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: user.id,
      org_id: member.org_id,
      action: 'ma_report_accessed',
      resource_type: 'ma_report',
      metadata: { start, end, format },
      created_at: new Date().toISOString(),
    }).then(({ error: _e }: { error: unknown }) => void _e)

    // Fetch call data in range
    const { data: calls, error: callsError } = await supabase
      .from('check_in_calls')
      .select(`
        id, member_id, call_ended_at, duration_seconds,
        pain_mentioned, fall_risk_mention, medication_adherence,
        social_isolation_signal, cognitive_concern_signal,
        mood_score, energy_score, pain_score, medication_taken,
        icd10_codes, clinical_extracted_at
      `)
      .eq('org_id', member.org_id)
      .gte('call_ended_at', `${start}T00:00:00Z`)
      .lte('call_ended_at', `${end}T23:59:59Z`)
      .order('call_ended_at')

    if (callsError) return NextResponse.json({ error: callsError.message }, { status: 400 })

    const totalCalls = (calls ?? []).length
    if (totalCalls === 0) {
      return NextResponse.json({
        suppressed: true,
        reason: 'No calls found in the specified date range.',
        date_range: { start, end },
        total_calls: 0,
      })
    }

    // Data quality: calls with clinical fields populated
    const callsWithClinical = (calls ?? []).filter(c =>
      c.clinical_extracted_at !== null
    ).length
    const coverage = callsWithClinical / totalCalls

    if (coverage < COVERAGE_THRESHOLD) {
      return NextResponse.json({
        suppressed: true,
        reason: `Clinical field coverage is ${Math.round(coverage * 100)}% — below the 60% minimum required for a reliable MA report. Run the backfill script to extract fields from existing transcripts.`,
        date_range: { start, end },
        total_calls: totalCalls,
        calls_with_clinical_data: callsWithClinical,
        coverage_pct: Math.round(coverage * 100),
      })
    }

    // Aggregate metrics (de-identified)
    const withClinical = (calls ?? []).filter(c => c.clinical_extracted_at)

    const avg = (arr: (number | null)[]) => {
      const nums = arr.filter(v => v !== null) as number[]
      return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null
    }

    const pct = (vals: (boolean | null)[]) => {
      const defined = vals.filter(v => v !== null)
      if (!defined.length) return null
      const trueCount = defined.filter(v => v === true).length
      return +((trueCount / defined.length) * 100).toFixed(1)
    }

    // ICD-10 frequency
    const icd10Freq: Record<string, number> = {}
    for (const call of withClinical) {
      for (const code of (call.icd10_codes ?? [])) {
        icd10Freq[code] = (icd10Freq[code] ?? 0) + 1
      }
    }

    // Active members (unique) in range
    const uniqueMembers = new Set((calls ?? []).map(c => c.member_id)).size

    const report = {
      date_range: { start, end },
      generated_at: new Date().toISOString(),
      data_quality: {
        total_calls: totalCalls,
        calls_with_clinical_data: callsWithClinical,
        coverage_pct: Math.round(coverage * 100),
      },
      member_engagement: {
        unique_members_with_calls: uniqueMembers,
        total_calls: totalCalls,
        avg_calls_per_member: uniqueMembers > 0 ? +(totalCalls / uniqueMembers).toFixed(1) : 0,
        avg_call_duration_seconds: avg((calls ?? []).map(c => c.duration_seconds)),
      },
      clinical_signals: {
        pct_with_pain_mentioned: pct(withClinical.map(c => c.pain_mentioned)),
        pct_with_fall_risk: pct(withClinical.map(c => c.fall_risk_mention)),
        pct_with_medication_adherence: pct(withClinical.map(c => c.medication_adherence)),
        pct_with_social_isolation: pct(withClinical.map(c => c.social_isolation_signal)),
        pct_with_cognitive_concern: pct(withClinical.map(c => c.cognitive_concern_signal)),
      },
      scores: {
        avg_mood_score: avg(withClinical.map(c => c.mood_score)),
        avg_energy_score: avg(withClinical.map(c => c.energy_score)),
        avg_pain_score: avg(withClinical.map(c => c.pain_score)),
      },
      icd10_frequency: icd10Freq,
    }

    if (format === 'csv') {
      // De-identified per-call rows for CSV export
      const rows = withClinical.map((c, i) => ({
        row: i + 1,
        call_date: c.call_ended_at?.split('T')[0],
        duration_seconds: c.duration_seconds,
        pain_mentioned: c.pain_mentioned,
        fall_risk_mention: c.fall_risk_mention,
        medication_adherence: c.medication_adherence,
        social_isolation_signal: c.social_isolation_signal,
        cognitive_concern_signal: c.cognitive_concern_signal,
        mood_score: c.mood_score,
        energy_score: c.energy_score,
        pain_score: c.pain_score,
        medication_taken: c.medication_taken,
        icd10_codes: (c.icd10_codes ?? []).join('|'),
      }))
      const headers = ['row','call_date','duration_seconds','pain_mentioned','fall_risk_mention',
        'medication_adherence','social_isolation_signal','cognitive_concern_signal',
        'mood_score','energy_score','pain_score','medication_taken','icd10_codes']
      const csv = toCSV(rows, headers)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ma-report-${start}-${end}.csv"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
