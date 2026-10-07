import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AGENTS, agentNameFromId, type AgentName } from './agents'
import { detectAgentsInvolved, type RetellTranscriptEvent } from './transfers'
import { aiProvider } from '@/lib/providers'
import { handleCrisisDetection } from '@/lib/alerts/detectCrisis'
import { detectAlertsForCall } from '@/lib/alerts/detectAlerts'
import { sendCareTeamUrgent } from '../alerts/careTeamSms'
import { sendFamilySummary } from '../alerts/familySummary'

export interface RetellCall {
  call_id: string
  agent_id: string
  direction?: string
  from_number?: string
  to_number?: string
  start_timestamp?: number
  end_timestamp?: number
  duration_ms?: number
  disconnection_reason?: string
  transcript?: string
  transcript_object?: { role: string; content: string }[] | null
  transcript_with_tool_calls?: RetellTranscriptEvent[] | null
  call_analysis?: {
    call_summary?: string
    user_sentiment?: string
    call_successful?: boolean
    custom_analysis_data?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
}

export interface CallAgentsResult {
  first: AgentName
  final: AgentName
  involved: AgentName[]
}

/** Determine all agents involved in a call (handles Quinn transfers). */
export function callAgents(call: RetellCall): CallAgentsResult {
  const first: AgentName = agentNameFromId(call.agent_id) ?? 'quinn'
  const involved = detectAgentsInvolved(first, call.transcript_with_tool_calls)
  const final = involved[involved.length - 1]
  return { first, final, involved }
}

/** Extract only the member's spoken lines from transcript_object or transcript. */
export function memberSpeech(call: RetellCall): string {
  if (call.transcript_object) {
    return call.transcript_object
      .filter(e => e.role === 'user')
      .map(e => e.content)
      .join('\n')
  }
  return (call.transcript ?? '')
    .split('\n')
    .filter(l => l.startsWith('User:'))
    .map(l => l.replace(/^User:\s*/, ''))
    .join('\n')
}

const MISSED_REASONS = new Set([
  'dial_no_answer',
  'dial_busy',
  'voicemail_reached',
  'no_answer',
])

export interface ProcessCallOptions {
  _crisisScanner?: (text: string) => string | null
}

export interface ProcessResult {
  ok: boolean
  skipped?: boolean
  reason?: string
  memberId?: string | null
  crisisFlag?: boolean
  agent?: string
}

export async function processCallEnded(call: RetellCall, opts: ProcessCallOptions = {}): Promise<ProcessResult> {
  const supabase = await createClient()

  // Step 1 — Idempotency
  const { data: existing } = await supabase
    .from('check_in_calls')
    .select('id, processed_at')
    .eq('retell_call_id' as any, call.call_id)
    .maybeSingle()
  if ((existing as any)?.processed_at) {
    return { ok: true, skipped: true, reason: 'already_processed', agent: undefined }
  }

  // Step 2 — Agent lookup
  const { first, final, involved } = callAgents(call)
  const agentCfg = AGENTS[final]
  const callType = agentCfg?.callType ?? 'daily_companion'
  const direction = (call.direction ?? agentCfg?.direction ?? 'inbound') as 'inbound' | 'outbound'

  // Step 3 — Missed call detection
  const isMissed = MISSED_REASONS.has(call.disconnection_reason ?? '')
  const callStatus = isMissed ? 'missed' : 'completed'

  // Step 4 — Find member by phone
  const phoneToMatch = direction === 'outbound' ? call.to_number : call.from_number
  let memberId: string | null = null

  if (phoneToMatch) {
    const normalized = phoneToMatch.replace(/\D/g, '')
    const { data: member } = await supabase
      .from('members')
      .select('id, aria_call_opted_in')
      .or(`phone.eq.${phoneToMatch},phone.eq.+${normalized},phone_number.eq.${phoneToMatch},phone_number.eq.+${normalized}`)
      .maybeSingle()
    memberId = (member as any)?.id ?? null
  }

  // Step 5 — Crisis detection (runs on full transcript, member speech preferred)
  const speech = memberSpeech(call)
  const fullTranscript = call.transcript ?? speech
  const alwaysCrisis = final === 'hope'
  let crisisFlag = false

  if (!isMissed && memberId) {
    await handleCrisisDetection({
      memberId,
      callId: call.call_id,
      transcript: speech || fullTranscript,
      _scanner: opts._crisisScanner,
    })
    // Re-read crisis flag from the scanner result for the record
    const { scanForCrisisPhrase } = await import('@/lib/alerts/detectCrisis')
    const scanner = opts._crisisScanner ?? scanForCrisisPhrase
    try {
      crisisFlag = !!scanner(speech || fullTranscript)
    } catch {
      crisisFlag = false
    }
  }

  // Step 6 — AI summary + clinical field extraction (skip for missed calls)
  const retellSummary = call.call_analysis?.call_summary ?? null
  const sentiment = call.call_analysis?.user_sentiment ?? null
  const durationSeconds = call.duration_ms ? Math.round(call.duration_ms / 1000) : null

  let aiSummary: string | null = null
  let moodScore: number | null = null
  let energyScore: number | null = null
  let painScore: number | null = null
  let medicationTaken: boolean | null = null
  let alertFlags: string[] = []

  if (!isMissed && fullTranscript) {
    // AI summary
    try {
      aiSummary = await aiProvider.generateCallSummary(fullTranscript)
    } catch (e) {
      console.warn('[processCallEnded] generateCallSummary failed:', e instanceof Error ? e.message : e)
      aiSummary = retellSummary // fall back to Retell's summary
    }

    // Clinical field extraction from member speech only
    if (speech) {
      try {
        const scores = await aiProvider.extractCallScores(speech)
        moodScore = scores.mood_score
        energyScore = scores.energy_score
        painScore = scores.pain_score
        medicationTaken = scores.medication_taken
        alertFlags = scores.alert_flags ?? []
      } catch (e) {
        console.warn('[processCallEnded] extractCallScores failed:', e instanceof Error ? e.message : e)
      }
    }
  }

  // Merge crisis into alert_flags
  if ((crisisFlag || alwaysCrisis) && !alertFlags.includes('crisis')) {
    alertFlags = [...alertFlags, 'crisis']
  }

  // Step 7 — Upsert check_in_calls or inbound_call_log
  let insertedCallId: string | null = null

  if (memberId) {
    const { data: upserted } = await supabase.from('check_in_calls').upsert({
      retell_call_id: call.call_id,
      member_id: memberId,
      agent_id: call.agent_id,
      agent_name: final,
      agents_involved: involved,
      direction,
      from_number: call.from_number,
      to_number: call.to_number,
      call_type: callType,
      duration_seconds: durationSeconds,
      transcript: call.transcript,
      summary: retellSummary,
      ai_summary: aiSummary,
      sentiment,
      mood_score: moodScore,
      energy_score: energyScore,
      pain_score: painScore,
      medication_taken: medicationTaken,
      alert_flags: alertFlags,
      crisis_flag: crisisFlag || alwaysCrisis,
      status: callStatus,
      processed_at: new Date().toISOString(),
    } as any, { onConflict: 'retell_call_id' }).select('id, phone, sms_opted_in').maybeSingle()
    insertedCallId = (upserted as any)?.id ?? null
  } else {
    // Unknown caller → inbound_call_log
    await supabase.from('inbound_call_log' as any).upsert({
      retell_call_id: call.call_id,
      agent_id: call.agent_id,
      agent_name: final,
      agents_involved: involved,
      from_number: call.from_number,
      to_number: call.to_number,
      duration_seconds: durationSeconds,
      transcript: call.transcript,
      summary: retellSummary,
      ai_summary: aiSummary,
      sentiment,
      call_type: callType,
      needs_followup: crisisFlag || alwaysCrisis,
      raw_payload: call as any,
      processed_at: new Date().toISOString(),
    }, { onConflict: 'retell_call_id' })
  }

  // Step 8 — Alert rules (mood drop, medication miss, fall, wellness drift)
  if (memberId && insertedCallId && !isMissed) {
    try {
      await detectAlertsForCall(insertedCallId, memberId)
    } catch (e) {
      console.error('[processCallEnded] detectAlertsForCall failed:', e instanceof Error ? e.message : e)
    }
  }

  // Step 9 — Hope line always escalates (if not already caught by crisis detection)
  if (alwaysCrisis && memberId && !crisisFlag) {
    const admin = createAdminClient()
    await admin.from('navigator_tasks').insert({
      member_id: memberId,
      task_type: 'crisis',
      priority: 'critical',
      description: `Hope crisis-line call ${call.call_id} — Hope line always escalates`,
      status: 'open',
    } as any)
  }

  // Step 10 — Member bookkeeping
  if (memberId && !isMissed) {
    const admin = createAdminClient()
    const updates: Record<string, unknown> = { last_aria_call_at: new Date().toISOString() }
    await admin.from('members').update(updates as any).eq('id', memberId)
  }

  // Step 11 — Family notification (all completed call types, never includes transcript)
  if (memberId && !isMissed) {
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('id, phone, sms_opted_in')
      .eq('member_id', memberId)
    if (familyMembers?.length) {
      const notifType = crisisFlag || alwaysCrisis ? 'crisis_call' : 'call_completed'
      const notifTitle = crisisFlag || alwaysCrisis
        ? '\u{1F6A8} Crisis flag on call'
        : `${final === 'joy' ? 'Joy' : final === 'grace' ? 'Grace' : 'Aria'} completed a call`
      const notifBody = aiSummary ?? retellSummary ?? 'Check-in call completed'
      await supabase.from('realtime_notifications' as any).insert(
        familyMembers.map((fm: any) => ({
          user_id: fm.id,
          type: notifType,
          title: notifTitle,
          body: notifBody,
          metadata: { call_id: call.call_id, member_id: memberId, agent: final },
        }))
      )

      // G5.8 — Family daily summary SMS
      const memberDisplayName = memberId ?? 'your loved one'
      try {
        await sendFamilySummary(familyMembers as any[], memberDisplayName, final, aiSummary ?? retellSummary ?? 'Check-in call completed.', !!(crisisFlag || alwaysCrisis))
      } catch (e) {
        console.error('[processCallEnded] familySummary SMS failed:', e instanceof Error ? e.message : e)
      }
    }
  }

  return { ok: true, memberId, crisisFlag: crisisFlag || alwaysCrisis, agent: final }
}
