import { createClient } from '@/lib/supabase/server'
import { AGENTS, agentNameFromId, agentIdFor, type AgentName } from './agents'
import { detectAgentsInvolved, type RetellTranscriptEvent } from './transfers'

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

const CRISIS_KEYWORDS = [
  "hurt myself", "end my life", "kill myself", "suicide",
  "want to die", "not worth living", "no reason to live",
  "don't want to be here", "want to end my life",
  "chest pain", "can't breathe", "fallen and can't",
]

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase()
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw))
}

export interface ProcessCallOptions {
  _crisisScanner?: (text: string) => boolean
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

  // Step 3 — Find member by phone
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

  // Step 4 — Crisis detection on member speech only
  const speech = memberSpeech(call)
  const scanner = opts._crisisScanner ?? detectCrisis
  let crisisFlag: boolean
  try {
    crisisFlag = scanner(speech)
  } catch {
    // crisis scanner threw — create manual review task and continue
    crisisFlag = false
    if (memberId) {
      const supabase2 = await createClient()
      await supabase2.from('navigator_tasks').insert({ member_id: memberId, task_type: 'crisis', priority: 'critical', description: 'Crisis detection failed — manual review required', status: 'open' } as any)
    }
  }
  const alwaysCrisis = final === 'hope' // Hope calls always get crisis task

  // Step 5 — AI summary
  const summary = call.call_analysis?.call_summary ?? null
  const sentiment = call.call_analysis?.user_sentiment ?? null
  const durationSeconds = call.duration_ms ? Math.round(call.duration_ms / 1000) : null

  // Step 6 — Upsert check_in_calls or inbound_call_log
  if (memberId) {
    await supabase.from('check_in_calls').upsert({
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
      summary,
      sentiment,
      crisis_flag: crisisFlag || alwaysCrisis,
      status: 'completed',
      processed_at: new Date().toISOString(),
    } as any, { onConflict: 'retell_call_id' })
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
      summary,
      sentiment,
      call_type: callType,
      needs_followup: crisisFlag || alwaysCrisis,
      raw_payload: call as any,
      processed_at: new Date().toISOString(),
    }, { onConflict: 'retell_call_id' })
  }

  // Step 7 — Crisis escalation
  if (crisisFlag || alwaysCrisis) {
    if (memberId) {
      await supabase.from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'crisis',
        priority: 'critical',
        description: `Hope crisis-line call ${call.call_id} — ${crisisFlag ? 'crisis phrase detected' : 'Hope line always escalates'}`,
        status: 'open',
      } as any)
      await supabase.from('emergency_log').insert({
        member_id: memberId,
        alert_type: final === 'hope' ? 'crisis' : 'crisis',
        call_id: call.call_id,
        triggered_phrase: speech.slice(0, 200),
      } as any)
    }
  }

  // Step 8 — Family notification
  if (memberId && callType === 'daily_companion') {
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('id')
      .eq('member_id', memberId)
    if (familyMembers?.length) {
      await supabase.from('realtime_notifications' as any).insert(
        familyMembers.map((fm: any) => ({
          user_id: fm.id,
          type: crisisFlag ? 'crisis_call' : 'call_completed',
          title: crisisFlag ? '🚨 Crisis flag on call' : 'Aria completed a call',
          body: summary ?? 'Daily companion call completed',
          metadata: { call_id: call.call_id, member_id: memberId },
        }))
      )
    }
  }

  return { ok: true, memberId, crisisFlag: crisisFlag || alwaysCrisis, agent: final }
}
