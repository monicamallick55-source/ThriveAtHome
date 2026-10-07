// Phase 97 — Grief pattern monitoring (Prolonged Grief Disorder risk).
// Runs only for members on a grief pathway (grief_support_requests row or
// members.grief_welcome_path). Combines time-since-loss, sustained low mood,
// sentiment trend, engagement decline and anniversary proximity, then asks the
// MlProvider for a PGD risk band. Elevated/high opens a navigator review task
// and suggests a professional referral (warm handoff, never just a number).

import { createAdminClient } from '../supabase/admin'
import { mlProvider } from '../providers'

export interface GriefPatternResult {
  memberId: string
  outcome: 'scored' | 'not_on_grief_pathway' | 'error'
  band: 'none' | 'monitoring' | 'elevated' | 'high'
  pgdRisk: boolean
  monthsSinceLoss: number | null
  indicators: string[]
  professionalReferralSuggested: boolean
  error: string | null
}

function monthsBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso)
  const ms = to.getTime() - from.getTime()
  return ms / (1000 * 60 * 60 * 24 * 30.44)
}

function anniversaryWithinDays(anniversary: string | null, days: number): boolean {
  if (!anniversary) return false
  const mmdd = anniversary.slice(5)
  const today = new Date()
  for (let i = 0; i <= days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const cmp = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (cmp === mmdd) return true
  }
  return false
}

export async function assessGriefPattern(memberId: string): Promise<GriefPatternResult> {
  const admin = createAdminClient()
  const result: GriefPatternResult = {
    memberId,
    outcome: 'scored',
    band: 'none',
    pgdRisk: false,
    monthsSinceLoss: null,
    indicators: [],
    professionalReferralSuggested: false,
    error: null,
  }

  try {
    const { data: member } = await admin
      .from('members')
      .select('grief_welcome_path, grief_enrolled_at')
      .eq('id', memberId)
      .maybeSingle()

    const { data: griefReqs } = await admin
      .from('grief_support_requests')
      .select('id, created_at, loss_anniversary_date')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true })

    const hasRequest = (griefReqs ?? []).length > 0
    if (!member?.grief_welcome_path && !hasRequest) {
      return { ...result, outcome: 'not_on_grief_pathway' }
    }

    // Earliest known loss reference point.
    const lossRefIso =
      griefReqs?.[0]?.created_at ??
      member?.grief_enrolled_at ??
      null
    const monthsSinceLoss = lossRefIso ? monthsBetween(lossRefIso) : 0
    result.monthsSinceLoss = Math.round(monthsSinceLoss * 10) / 10

    // Sustained low mood over the last 90 days.
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: calls } = await admin
      .from('check_in_calls')
      .select('mood_score, ai_summary, transcript, created_at')
      .eq('member_id', memberId)
      .eq('status', 'completed')
      .gte('created_at', since90)
      .order('created_at', { ascending: false })
    const moods = (calls ?? [])
      .map((c: any) => c.mood_score)
      .filter((n): n is number => typeof n === 'number')
    const lowMoodRatio =
      moods.length > 0 ? moods.filter((m: any) => m <= 4).length / moods.length : 0

    // Sentiment from recent grief-pathway calls.
    const texts = (calls ?? [])
      .slice(0, 10)
      .map((c: any) => c.ai_summary || c.transcript || '')
      .filter(Boolean)
    const sentiment = await mlProvider.analyzeSentiment(texts)

    // Engagement trend proxy: circle posts + event RSVPs recent 30 vs prior 30.
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const d60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const engCount = async (from: string, to?: string) => {
      let total = 0
      for (const t of ['circle_posts', 'event_rsvps']) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q = (admin.from as any)(t)
          .select('id', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .gte('created_at', from)
        if (to) q = q.lt('created_at', to)
        const { count } = await q
        total += count ?? 0
      }
      return total
    }
    const recentEng = await engCount(d30)
    const priorEng = await engCount(d60, d30)
    const engagementTrend = (recentEng + 1) / (priorEng + 1)

    const anniversaryNear = (griefReqs ?? []).some((r: any) =>
      anniversaryWithinDays(r.loss_anniversary_date, 14)
    )

    const assessment = await mlProvider.assessGriefPattern({
      monthsSinceLoss,
      lowMoodRatio,
      sentimentValence: sentiment.valence,
      engagementTrend,
      anniversaryNear,
    })

    result.band = assessment.band as GriefPatternResult['band']
    result.pgdRisk = assessment.pgdRisk
    result.indicators = assessment.indicators
    result.professionalReferralSuggested = assessment.band === 'elevated' || assessment.band === 'high'

    // Navigator task on elevated/high (dedup on open prolonged_grief_review).
    let navigatorTaskId: string | null = null
    if (result.professionalReferralSuggested) {
      const { data: existingTask } = await admin
        .from('navigator_tasks')
        .select('id')
        .eq('member_id', memberId)
        .eq('task_type', 'prolonged_grief_review')
        .eq('completed', false)
        .maybeSingle()
      if (!existingTask) {
        const { data: task } = await admin
          .from('navigator_tasks')
          .insert({
            member_id: memberId,
            task_type: 'prolonged_grief_review',
            description: `Grief pattern model flagged ${assessment.band.toUpperCase()} PGD risk (${result.monthsSinceLoss} months since loss). Indicators: ${assessment.indicators.join('; ') || 'n/a'}. Offer a warm handoff to a grief counsellor / professional referral and increase check-in support.`,
            priority: assessment.band === 'high' ? 'critical' : 'high',
          })
          .select('id')
          .maybeSingle()
        navigatorTaskId = task?.id ?? null
      }
    }

    const { error: insertError } = await admin.from('grief_pattern_flags').insert({
      member_id: memberId,
      grief_request_id: griefReqs?.[0]?.id ?? null,
      months_since_loss: result.monthsSinceLoss,
      pgd_risk: result.pgdRisk,
      risk_band: result.band,
      indicators: result.indicators,
      professional_referral_suggested: result.professionalReferralSuggested,
      navigator_task_id: navigatorTaskId,
    })
    if (insertError) {
      console.error('[ml/griefPatternModel] insert failed:', insertError)
      result.error = insertError.message
    }

    return result
  } catch (e) {
    console.error('[ml/griefPatternModel] Unexpected error:', e)
    return { ...result, outcome: 'error', error: e instanceof Error ? e.message : String(e) }
  }
}
