// Phase 96 — Social isolation detection (sentiment NLP + engagement trend).
// Goes beyond Aria's call-based loneliness detection: combines the sentiment of
// recent check-in summaries with a hard engagement trend (circle posts, event
// RSVPs, volunteer visits, buddy calls) over the last 30 days vs the prior 30.

import { createAdminClient } from '../supabase/admin'
import { clamp01 } from './stats'
import { mlProvider } from '../providers'

export const ISOLATION_MODERATE = 0.45
export const ISOLATION_HIGH = 0.7

export interface IsolationResult {
  memberId: string
  outcome: 'scored' | 'error'
  isolationScore: number
  band: 'low' | 'moderate' | 'high'
  sentimentValence: number
  engagementTrend: number
  drivers: string[]
  suggestedConnections: { type: string; id: string; label: string }[]
  error: string | null
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

async function countSince(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  memberId: string,
  dateCol: string,
  sinceIso: string,
  untilIso?: string
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (admin.from as any)(table)
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .gte(dateCol, sinceIso)
  if (untilIso) q = q.lt(dateCol, untilIso)
  const { count, error } = await q
  if (error) {
    console.warn(`[ml/isolationModel] count ${table} failed:`, error.message)
    return 0
  }
  return count ?? 0
}

export async function computeIsolationScore(memberId: string): Promise<IsolationResult> {
  const admin = createAdminClient()
  const result: IsolationResult = {
    memberId,
    outcome: 'scored',
    isolationScore: 0,
    band: 'low',
    sentimentValence: 0,
    engagementTrend: 1,
    drivers: [],
    suggestedConnections: [],
    error: null,
  }

  try {
    const now = new Date().toISOString()
    const d30 = isoDaysAgo(30)
    const d60 = isoDaysAgo(60)

    const { data: member } = await admin
      .from('members')
      .select('lives_alone, check_in_frequency')
      .eq('id', memberId)
      .maybeSingle()

    // --- Sentiment from recent check-in text ---
    const { data: calls } = await admin
      .from('check_in_calls')
      .select('ai_summary, transcript')
      .eq('member_id', memberId)
      .eq('status', 'completed')
      .gte('created_at', d30)
      .order('created_at', { ascending: false })
      .limit(10)
    const texts = (calls ?? [])
      .map((c: any) => c.ai_summary || c.transcript || '')
      .filter(Boolean)
    const sentiment = await mlProvider.analyzeSentiment(texts)
    result.sentimentValence = Math.round(sentiment.valence * 1000) / 1000

    // --- Engagement trend: recent 30d vs prior 30d ---
    const engagementTables: { table: string; dateCol: string }[] = [
      { table: 'circle_posts', dateCol: 'created_at' },
      { table: 'event_rsvps', dateCol: 'created_at' },
      { table: 'circle_event_rsvps', dateCol: 'created_at' },
      { table: 'volunteer_visits', dateCol: 'visit_date' },
      { table: 'buddy_calls', dateCol: 'started_at' },
    ]
    let recent = 0
    let prior = 0
    for (const { table, dateCol } of engagementTables) {
      const useIsoRecent = dateCol.includes('date') ? d30.slice(0, 10) : d30
      const useIsoPriorFrom = dateCol.includes('date') ? d60.slice(0, 10) : d60
      const useIsoPriorTo = dateCol.includes('date') ? d30.slice(0, 10) : d30
      recent += await countSince(admin, table, memberId, dateCol, useIsoRecent)
      prior += await countSince(admin, table, memberId, dateCol, useIsoPriorFrom, useIsoPriorTo)
    }
    // Smoothed ratio so zero prior activity doesn't divide by zero.
    const engagementTrend = (recent + 1) / (prior + 1)
    result.engagementTrend = Math.round(engagementTrend * 1000) / 1000

    // --- Combine into an isolation score (0..1) ---
    let score = 0
    const drivers: string[] = []

    // Negative sentiment contributes up to 0.3
    if (sentiment.valence < 0) {
      score += Math.min(0.3, -sentiment.valence * 0.3)
      if (sentiment.valence <= -0.25) drivers.push('negative sentiment in recent calls')
    }
    // Explicit loneliness language contributes up to 0.25
    if (sentiment.loneliness > 0) {
      score += Math.min(0.25, sentiment.loneliness * 0.25)
      if (sentiment.loneliness >= 0.3) drivers.push('loneliness language in recent calls')
    }
    // Declining engagement contributes up to 0.3
    if (engagementTrend < 1) {
      score += Math.min(0.3, (1 - engagementTrend) * 0.4)
      if (engagementTrend < 0.7) drivers.push('declining participation in circles / events')
    }
    // No engagement at all in 30 days contributes 0.15
    if (recent === 0) {
      score += 0.15
      drivers.push('no community activity in the last 30 days')
    }
    // Lives alone contributes 0.1
    if (member?.lives_alone) {
      score += 0.1
      drivers.push('lives alone')
    }

    result.isolationScore = Math.round(clamp01(score) * 1000) / 1000
    result.drivers = drivers
    result.band =
      result.isolationScore >= ISOLATION_HIGH
        ? 'high'
        : result.isolationScore >= ISOLATION_MODERATE
          ? 'moderate'
          : 'low'

    // --- Suggested connections for moderate/high ---
    if (result.band !== 'low') {
      const { data: memberCircles } = await admin
        .from('circle_memberships')
        .select('circle_id')
        .eq('member_id', memberId)
      const joined = new Set((memberCircles ?? []).map((c: any) => c.circle_id))
      const { data: circles } = await admin
        .from('cultural_circles')
        .select('id, circle_name')
        .eq('is_active', true)
        .limit(6)
      for (const c of circles ?? []) {
        if (!joined.has(c.id)) {
          result.suggestedConnections.push({
            type: 'cultural_circle',
            id: c.id,
            label: c.circle_name,
          })
        }
        if (result.suggestedConnections.length >= 3) break
      }
      const { data: events } = await admin
        .from('circle_events')
        .select('id, title, event_date')
        .gte('event_date', now.slice(0, 10))
        .order('event_date', { ascending: true })
        .limit(3)
      for (const e of events ?? []) {
        result.suggestedConnections.push({
          type: 'circle_event',
          id: e.id,
          label: `${e.title} (${e.event_date})`,
        })
      }
    }

    // --- Persist + navigator task on high ---
    let navigatorTaskId: string | null = null
    if (result.band === 'high') {
      const { data: existingTask } = await admin
        .from('navigator_tasks')
        .select('id')
        .eq('member_id', memberId)
        .eq('task_type', 'social_isolation_outreach')
        .eq('completed', false)
        .maybeSingle()
      if (!existingTask) {
        const { data: task } = await admin
          .from('navigator_tasks')
          .insert({
            member_id: memberId,
            task_type: 'social_isolation_outreach',
            description: `Social isolation model flagged HIGH (${(result.isolationScore * 100).toFixed(0)}%). Drivers: ${drivers.join('; ') || 'n/a'}. Warm outreach + suggest a circle/event or buddy call.`,
            priority: 'high',
          })
          .select('id')
          .maybeSingle()
        navigatorTaskId = task?.id ?? null
      }
    }

    const { error: insertError } = await admin.from('isolation_scores').insert({
      member_id: memberId,
      isolation_score: result.isolationScore,
      risk_band: result.band,
      sentiment_valence: result.sentimentValence,
      engagement_trend: result.engagementTrend,
      drivers,
      suggested_connections: result.suggestedConnections,
      navigator_task_id: navigatorTaskId,
    })
    if (insertError) {
      console.error('[ml/isolationModel] insert failed:', insertError)
      result.error = insertError.message
    }

    return result
  } catch (e) {
    console.error('[ml/isolationModel] Unexpected error:', e)
    return { ...result, outcome: 'error', error: e instanceof Error ? e.message : String(e) }
  }
}
