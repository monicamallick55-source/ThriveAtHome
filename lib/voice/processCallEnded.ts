// Post-call processing for every Retell agent. Called for `call_ended` and `call_analyzed`.
// Idempotent on retell_call_id: the first invocation claims the call by setting processed_at;
// later deliveries of the same call are skipped. Each step has its own try/catch so one
// failure never stops the crisis scan or the summary.
import { createAdminClient } from '../supabase/admin'
import { handleCrisisDetection, scanForCrisisPhrase, detectAlertsForCall, detectWellnessDrift } from '../alerts'
import { pushRealtimeNotification } from '../realtime/notifications'
import { aiProvider } from '../providers'
import { sendCareTeamUrgent } from '../alerts/careTeamSms'
import { AGENTS, agentNameFromId, type AgentName } from './agents'
import { toE164 } from './phone'
import { lookupCallerByPhone, NO_CALLER, type CallerMatch, type CallerRole } from './caller'
import { detectAgentsInvolved, type RetellTranscriptEvent } from './transfers'
import type { Tables } from '@/types/database'
type CallType = any
type CallStatus = any
type CallDirection = any

// ── Retell payload shape (only the fields we read) ───────────────────────────
export interface RetellTranscriptTurn {
  role: 'agent' | 'user' | string
  content: string
}

export interface RetellCall {
  call_id: string
  agent_id?: string | null
  direction?: CallDirection | null
  from_number?: string | null
  to_number?: string | null
  start_timestamp?: number | null
  end_timestamp?: number | null
  duration_ms?: number | null
  transcript?: string | null
  transcript_object?: RetellTranscriptTurn[] | null
  transcript_with_tool_calls?: RetellTranscriptEvent[] | null
  disconnection_reason?: string | null
  metadata?: { member_id?: string; call_type?: string; [key: string]: unknown } | null
}

export type { CallerMatch, CallerRole }

export interface ProcessCallResult {
  skipped: boolean
  /** Final agent on the call (after any Agent Transfers) */
  agent: AgentName
  agentsInvolved: AgentName[]
  callerRole: CallerRole
  memberId: string | null
  callRowId: string | null
  inboundLogId: string | null
  status: CallStatus
  errors: string[]
}

export interface ProcessCallOptions {
  /** Test hook — replaces the crisis phrase scanner (e.g. to force the failure path) */
  _crisisScanner?: (transcript: string) => string | null
}

const MISSED_REASONS = new Set(['dial_no_answer', 'dial_busy', 'voicemail_reached'])
const LAST_ARIA_CALL_AGENTS = new Set<AgentName>(['aria', 'joy', 'grace'])
const VALID_CALL_TYPES = new Set<CallType>([
  'check_in', 'concierge', 'navigator', 'onboarding', 'callback', 'celebration', 'reminder', 'crisis', 'care_line',
])

// ── Helpers ──────────────────────────────────────────────────────────────────

export function resolveAgent(agentId: string | null | undefined): AgentName {
  const name = agentNameFromId(agentId)
  if (!name) {
    console.warn(`[voice/processCallEnded] Unknown agent_id ${agentId ?? '(none)'} — treating as aria`)
    return 'aria'
  }
  return name
}

export function callDirection(call: RetellCall, agent: AgentName): CallDirection {
  return call.direction === 'inbound' || call.direction === 'outbound' ? call.direction : AGENTS[agent].direction
}

/** Agents on the call: the webhook's agent first, then every Agent Transfer target, in order. */
export function callAgents(call: RetellCall): { first: AgentName; final: AgentName; involved: AgentName[] } {
  const first = resolveAgent(call.agent_id)
  const involved = detectAgentsInvolved(first, call.transcript_with_tool_calls)
  return { first, final: involved[involved.length - 1], involved }
}

/**
 * Member-speech-only text for the whole call, across every agent after a transfer
 * (role 'user' in transcript_object, else transcript_with_tool_calls). Falls back to the full transcript.
 */
export function memberSpeech(call: RetellCall): string {
  const turns = call.transcript_object?.length ? call.transcript_object : call.transcript_with_tool_calls
  if (Array.isArray(turns) && turns.length > 0) {
    return turns.filter(t => t.role === 'user' && typeof t.content === 'string').map(t => t.content).join('\n')
  }
  return call.transcript ?? ''
}

/** Outbound → metadata.member_id. Inbound → phone lookup: members, then family, then volunteers. */
export async function identifyCaller(call: RetellCall, direction: CallDirection): Promise<CallerMatch> {
  const metaMember = call.metadata?.member_id
  if (metaMember) return { ...NO_CALLER, role: 'member', memberId: metaMember }
  if (direction !== 'inbound') return NO_CALLER
  return lookupCallerByPhone(call.from_number)
}

function isoOrNull(ms: number | null | undefined): string | null {
  return typeof ms === 'number' && ms > 0 ? new Date(ms).toISOString() : null
}

function durationSeconds(call: RetellCall): number {
  if (typeof call.duration_ms === 'number') return Math.round(call.duration_ms / 1000)
  if (call.start_timestamp && call.end_timestamp) return Math.round((call.end_timestamp - call.start_timestamp) / 1000)
  return 0
}

// ── call_started ─────────────────────────────────────────────────────────────

/** Upserts an in_progress row for a member call. Never overwrites a processed call. */
export async function recordCallStarted(call: RetellCall): Promise<void> {
  const { first, final: agent, involved } = callAgents(call)
  const direction = callDirection(call, first)
  const caller = await identifyCaller(call, direction)
  if (!caller.memberId) return

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('check_in_calls').select('id, processed_at').eq('retell_call_id', call.call_id).maybeSingle()
  if (existing?.processed_at) return

  const metaType = call.metadata?.call_type as CallType | undefined
  const { error } = await admin.from('check_in_calls').upsert({
    retell_call_id: call.call_id,
    member_id: caller.memberId,
    agent_id: call.agent_id ?? null,
    agent_name: agent,
    agents_involved: involved,
    direction,
    from_number: toE164(call.from_number) ?? call.from_number ?? null,
    to_number: toE164(call.to_number) ?? call.to_number ?? null,
    caller_role: caller.role,
    call_type: metaType && VALID_CALL_TYPES.has(metaType) ? metaType : AGENTS[agent].defaultCallType,
    status: 'in_progress',
    started_at: isoOrNull(call.start_timestamp) ?? new Date().toISOString(),
  }, { onConflict: 'retell_call_id' })
  if (error) console.error('[voice/recordCallStarted] upsert failed:', error.message)
}

// ── call_ended / call_analyzed ───────────────────────────────────────────────

export async function processCallEnded(call: RetellCall, opts: ProcessCallOptions = {}): Promise<ProcessCallResult> {
  const admin = createAdminClient()
  const errors: string[] = []
  const fail = (step: string, e: unknown) => {
    const msg = `${step}: ${e instanceof Error ? e.message : String(e)}`
    console.error(`[voice/processCallEnded] ${msg}`)
    errors.push(msg)
  }

  // 1. Identify agents — the webhook's agent (Quinn for every inbound call) plus any Agent Transfers.
  // agent_name / call_type / labels follow the final agent; direction follows the answering agent.
  const { first, final: agent, involved } = callAgents(call)
  const def = AGENTS[agent]
  const direction = callDirection(call, first)
  const hopeInvolved = involved.includes('hope')
  const status: CallStatus = call.disconnection_reason && MISSED_REASONS.has(call.disconnection_reason) ? 'missed' : 'completed'
  const transcript = call.transcript ?? ''
  const speech = memberSpeech(call)
  const duration = durationSeconds(call)

  const result: ProcessCallResult = {
    skipped: false, agent, agentsInvolved: involved, callerRole: 'unknown', memberId: null, callRowId: null, inboundLogId: null, status, errors,
  }

  // Idempotency pre-check — already processed?
  const { data: existingCall } = await admin
    .from('check_in_calls').select('id, processed_at').eq('retell_call_id', call.call_id).maybeSingle()
  if (existingCall?.processed_at) return { ...result, skipped: true, callRowId: existingCall.id }
  const { data: existingLog } = await admin
    .from('inbound_call_log').select('id').eq('retell_call_id', call.call_id).maybeSingle()
  if (existingLog) return { ...result, skipped: true, inboundLogId: existingLog.id }

  // 2. Identify caller
  let caller: CallerMatch = NO_CALLER
  try {
    caller = await identifyCaller(call, direction)
  } catch (e) {
    fail('identify caller', e)
  }
  result.callerRole = caller.role
  result.memberId = caller.memberId

  // 3. Save the record, then claim it (processed_at) so a concurrent delivery can't double-process
  if (caller.memberId) {
    try {
      const metaType = call.metadata?.call_type as CallType | undefined
      const { error: upErr } = await admin.from('check_in_calls').upsert({
        retell_call_id: call.call_id,
        member_id: caller.memberId,
        agent_id: call.agent_id ?? null,
        agent_name: agent,
        agents_involved: involved,
        direction,
        from_number: toE164(call.from_number) ?? call.from_number ?? null,
        to_number: toE164(call.to_number) ?? call.to_number ?? null,
        caller_role: caller.role,
        call_type: metaType && VALID_CALL_TYPES.has(metaType) ? metaType : def.defaultCallType,
        status,
        duration_seconds: duration,
        transcript: transcript || null,
        started_at: isoOrNull(call.start_timestamp),
        ended_at: isoOrNull(call.end_timestamp),
      }, { onConflict: 'retell_call_id' })
      if (upErr) throw new Error(upErr.message)

      const { data: claimed, error: claimErr } = await admin
        .from('check_in_calls')
        .update({ processed_at: new Date().toISOString() })
        .eq('retell_call_id', call.call_id)
        .is('processed_at', null)
        .select('id')
        .maybeSingle()
      if (claimErr) throw new Error(claimErr.message)
      if (!claimed) return { ...result, skipped: true }
      result.callRowId = claimed.id
    } catch (e) {
      fail('save call', e)
    }
  } else {
    try {
      const { data: logRow, error: logErr } = await admin
        .from('inbound_call_log')
        .upsert({
          retell_call_id: call.call_id,
          agent_name: agent,
          agents_involved: involved,
          from_number: toE164(call.from_number) ?? call.from_number ?? null,
          caller_role: caller.role,
          family_member_id: caller.familyMemberId,
          volunteer_id: caller.volunteerId,
          duration_seconds: duration,
          transcript: transcript || null,
        }, { onConflict: 'retell_call_id', ignoreDuplicates: true })
        .select('id')
        .maybeSingle()
      if (logErr) throw new Error(logErr.message)
      if (!logRow) return { ...result, skipped: true }
      result.inboundLogId = logRow.id
    } catch (e) {
      fail('save inbound log', e)
    }
  }

  // 4. Crisis scan — every call, whichever agents were on it, over the caller's speech for the whole
  // call (so the agents' own safety lines, "call 911 if…", can't trigger it).
  // Hope always escalates if she was on the call at any point, even when Quinn's webhook fired.
  try {
    if (caller.memberId) {
      await handleCrisisDetection({
        memberId: caller.memberId,
        callId: result.callRowId ?? undefined,
        transcript: speech,
        _scanner: opts._crisisScanner,
      })
      if (hopeInvolved) {
        const { error: hopeErr } = await admin.from('navigator_tasks').insert({
          member_id: caller.memberId,
          task_type: 'crisis',
          description: 'Hope crisis-line call — human follow-up required',
          priority: 'critical',
        })
        if (hopeErr) throw new Error(`Hope task insert failed: ${hopeErr.message}`)
      }
    } else {
      const phrase = scanForCrisisPhrase(speech)
      if (hopeInvolved || phrase) {
        if (result.inboundLogId) {
          await admin.from('inbound_call_log').update({ needs_followup: true }).eq('id', result.inboundLogId)
        }
        // No member to attach a realtime notification to — page the care team directly.
        await sendCareTeamUrgent(
          null,
          `${hopeInvolved ? AGENTS.hope.label : def.label} call from ${caller.role} caller ${toE164(call.from_number) ?? 'unknown number'}` +
            `${phrase ? ` — crisis phrase "${phrase}"` : ''}. Human follow-up required.`,
        )
      }
    }
  } catch (e) {
    fail('crisis scan', e)
  }

  // 5. Summary + scores
  let summary: string | null = null
  try {
    if (transcript.trim()) summary = await aiProvider.generateCallSummary(transcript)
  } catch (e) {
    fail('summary', e)
  }
  try {
    if (caller.memberId && result.callRowId) {
      const scores = speech.trim() ? await aiProvider.extractCallScores(speech) : null
      // A score the member gave mid-call (log_mood_score tool) wins over the AI-extracted one
      const { data: current } = await admin.from('check_in_calls').select('mood_score').eq('id', result.callRowId).maybeSingle()
      const { error } = await admin.from('check_in_calls').update({
        ai_summary: summary,
        ...(scores ? {
          mood_score: current?.mood_score ?? scores.mood_score,
          energy_score: scores.energy_score,
          pain_score: scores.pain_score,
          medication_taken: scores.medication_taken,
          alert_flags: scores.alert_flags,
        } : {}),
      }).eq('id', result.callRowId)
      if (error) throw new Error(error.message)
    } else if (result.inboundLogId && summary) {
      const { error } = await admin.from('inbound_call_log').update({ ai_summary: summary }).eq('id', result.inboundLogId)
      if (error) throw new Error(error.message)
    }
  } catch (e) {
    fail('scores', e)
  }

  // 6. Alert rules
  if (caller.memberId && result.callRowId) {
    try {
      await detectAlertsForCall(result.callRowId, caller.memberId)
      await detectWellnessDrift(caller.memberId)
    } catch (e) {
      fail('alert rules', e)
    }
  }

  // 7. Member bookkeeping
  if (caller.memberId && status === 'completed') {
    try {
      const updates: { last_aria_call_at?: string; onboarding_call_completed?: boolean } = {}
      if (direction === 'outbound' && LAST_ARIA_CALL_AGENTS.has(agent)) {
        updates.last_aria_call_at = isoOrNull(call.end_timestamp) ?? new Date().toISOString()
      }
      if (call.metadata?.call_type === 'onboarding' && duration > 60) updates.onboarding_call_completed = true
      if (Object.keys(updates).length > 0) {
        const { error } = await admin.from('members').update(updates).eq('id', caller.memberId)
        if (error) throw new Error(error.message)
      }
    } catch (e) {
      fail('member bookkeeping', e)
    }
  }

  // 8. Family notification — never includes the transcript
  if (caller.memberId && summary) {
    try {
      const { data: m } = await admin
        .from('members').select('family_can_see_call_summaries').eq('id', caller.memberId).maybeSingle()
      if (m?.family_can_see_call_summaries) {
        await pushRealtimeNotification({
          type: 'call_summary_ready',
          memberId: caller.memberId,
          title: 'New call summary',
          body: `A summary of today's call with ${def.label} is ready.`,
          callId: result.callRowId ?? undefined,
        })
      }
    } catch (e) {
      fail('family notification', e)
    }
  }

  // 9. processed_at was set when the call was claimed in step 3
  return result
}
