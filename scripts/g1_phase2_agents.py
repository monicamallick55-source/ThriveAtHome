#!/usr/bin/env python3
"""
G1.2 — Write lib/voice/agents.ts  (12-agent registry)
         Patch lib/services/RetellCallProvider.ts to use it
         Patch lib/stubs/StubCallProvider.ts to log agent name
Run from: /workspaces/ThriveAtHome
  python3 /path/to/g1_phase2_agents.py
"""
import os, re

REPO = "/workspaces/ThriveAtHome"

# ── lib/voice/agents.ts ──────────────────────────────────────────────────────
agents_ts = """\
// lib/voice/agents.ts
// Single source of truth for all 12 Retell AI voice agents.

export type AgentName =
  | 'aria' | 'rosa' | 'joy' | 'grace' | 'hope'
  | 'claire' | 'sam' | 'morgan' | 'nova' | 'alex' | 'quinn' | 'jordan'

export type CallType =
  | 'check_in' | 'onboarding' | 'celebration' | 'reminder'
  | 'crisis' | 'care_line' | 'concierge' | 'navigator' | 'callback'

export interface AgentDef {
  name: AgentName
  label: string
  envVar: string
  direction: 'inbound' | 'outbound'
  defaultCallType: CallType
  expectedCaller: 'member' | 'family' | 'volunteer' | 'buddy' | 'staff' | 'partner' | 'any'
  crisisScan: boolean
}

export const AGENTS: Record<AgentName, AgentDef> = {
  aria:   { name:'aria',   label:'Aria',   envVar:'RETELL_AGENT_ID',          direction:'outbound', defaultCallType:'check_in',   expectedCaller:'member',    crisisScan:true  },
  rosa:   { name:'rosa',   label:'Rosa',   envVar:'RETELL_ROSA_AGENT_ID',     direction:'inbound',  defaultCallType:'care_line',  expectedCaller:'member',    crisisScan:true  },
  joy:    { name:'joy',    label:'Joy',    envVar:'RETELL_JOY_AGENT_ID',      direction:'outbound', defaultCallType:'celebration',expectedCaller:'member',    crisisScan:true  },
  grace:  { name:'grace',  label:'Grace',  envVar:'RETELL_GRACE_AGENT_ID',    direction:'outbound', defaultCallType:'reminder',   expectedCaller:'member',    crisisScan:true  },
  hope:   { name:'hope',   label:'Hope',   envVar:'RETELL_HOPE_AGENT_ID',     direction:'inbound',  defaultCallType:'crisis',     expectedCaller:'any',       crisisScan:true  },
  claire: { name:'claire', label:'Claire', envVar:'RETELL_CLAIRE_AGENT_ID',   direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'family',    crisisScan:false },
  sam:    { name:'sam',    label:'Sam',    envVar:'RETELL_SAM_AGENT_ID',      direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'volunteer', crisisScan:false },
  morgan: { name:'morgan', label:'Morgan', envVar:'RETELL_MORGAN_AGENT_ID',   direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'buddy',     crisisScan:false },
  nova:   { name:'nova',   label:'Nova',   envVar:'RETELL_NOVA_AGENT_ID',     direction:'inbound',  defaultCallType:'navigator',  expectedCaller:'staff',     crisisScan:false },
  alex:   { name:'alex',   label:'Alex',   envVar:'RETELL_ALEX_AGENT_ID',     direction:'inbound',  defaultCallType:'navigator',  expectedCaller:'staff',     crisisScan:false },
  quinn:  { name:'quinn',  label:'Quinn',  envVar:'RETELL_QUINN_AGENT_ID',    direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'any',       crisisScan:true  },
  jordan: { name:'jordan', label:'Jordan', envVar:'RETELL_JORDAN_AGENT_ID',   direction:'inbound',  defaultCallType:'concierge',  expectedCaller:'partner',   crisisScan:false },
}

/** Returns the Retell agent ID for the given agent name, or null if env var not set. */
export function agentIdFor(name: AgentName): string | null {
  const def = AGENTS[name]
  if (!def) return null
  return process.env[def.envVar] ?? null
}

/** Maps a Retell agent_id back to its AgentName by scanning all env vars. Returns null if unknown. */
export function agentNameFromId(agentId: string | null | undefined): AgentName | null {
  if (!agentId) return null
  for (const [name, def] of Object.entries(AGENTS)) {
    const envVal = process.env[def.envVar]
    if (envVal && envVal === agentId) return name as AgentName
  }
  return null
}

/** Throws a readable error if the env var for the given agent is not set. */
export function requireAgentId(name: AgentName): string {
  const id = agentIdFor(name)
  if (!id) throw new Error(`${AGENTS[name].envVar} is not set — cannot place ${name} call`)
  return id
}
"""

# ── lib/voice/verifyRetell.ts ────────────────────────────────────────────────
verify_ts = """\
// lib/voice/verifyRetell.ts
// Verifies the x-retell-signature header on incoming Retell webhooks.
// Key used: RETELL_WEBHOOK_SECRET if set, otherwise RETELL_API_KEY.
// In stub mode (no RETELL_API_KEY) the check is skipped with a log warning.

import { createHmac } from 'crypto'

export function verifyRetellSignature(
  rawBody: string,
  signature: string | null
): { ok: boolean; reason?: string } {
  const key = process.env.RETELL_WEBHOOK_SECRET ?? process.env.RETELL_API_KEY

  if (!key) {
    // Stub / local dev mode — allow but warn
    console.warn('[STUB][Retell] signature check skipped — no RETELL_API_KEY set')
    return { ok: true }
  }

  if (!signature) {
    return { ok: false, reason: 'missing x-retell-signature header' }
  }

  // Retell signs with HMAC-SHA256 of the raw body
  const expected = createHmac('sha256', key).update(rawBody).digest('hex')
  const ok = signature === expected
  return ok ? { ok: true } : { ok: false, reason: 'signature mismatch' }
}
"""

# ── lib/voice/processCallEnded.ts ────────────────────────────────────────────
process_ts = """\
// lib/voice/processCallEnded.ts
// Called from the webhook on call_ended and call_analyzed events.
// Idempotent: keyed on retell_call_id — skips if processed_at is already set.

import { createClient } from '@supabase/supabase-js'
import { agentNameFromId, AGENTS, AgentName } from './agents'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RetellCallPayload {
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
  transcript_object?: Array<{ role: string; content: string }>
  metadata?: Record<string, string>
}

export async function processCallEnded(call: RetellCallPayload): Promise<void> {
  const retellCallId = call.call_id

  // Idempotency check
  const { data: existing } = await supabase
    .from('check_in_calls')
    .select('id, processed_at')
    .eq('retell_call_id', retellCallId)
    .maybeSingle()

  if (existing?.processed_at) {
    console.log(`[Retell] call ${retellCallId} already processed — skipping`)
    return
  }

  // Step 1: Identify agent
  const agentName: AgentName = agentNameFromId(call.agent_id) ?? 'aria'
  const agentDef = AGENTS[agentName]

  // Step 2: Identify caller
  const direction = call.direction ?? (agentDef.direction === 'outbound' ? 'outbound' : 'inbound')
  let memberId: string | null = call.metadata?.member_id ?? null
  let callerRole: string = 'unknown'
  let familyMemberId: string | null = null

  if (!memberId && direction === 'inbound' && call.from_number) {
    const e164 = normalisePhone(call.from_number)
    // Try members table
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('phone_number', e164)
      .maybeSingle()
    if (member) {
      memberId = member.id
      callerRole = 'member'
    } else {
      // Try family_members
      const { data: fam } = await supabase
        .from('family_members')
        .select('id')
        .eq('phone', e164)
        .maybeSingle()
      if (fam) {
        familyMemberId = fam.id
        callerRole = 'family'
      }
    }
  } else if (memberId) {
    callerRole = 'member'
  }

  const isMissed = ['dial_no_answer','dial_busy','voicemail_reached'].includes(
    call.disconnection_reason ?? ''
  )
  const callStatus = isMissed ? 'missed' : 'completed'
  const callType = (call.metadata?.call_type as string) ?? agentDef.defaultCallType
  const durationSeconds = call.duration_ms ? Math.round(call.duration_ms / 1000) : null

  // Step 3: Save record
  if (memberId) {
    const upsertData = {
      member_id: memberId,
      retell_call_id: retellCallId,
      agent_id: call.agent_id,
      agent_name: agentName,
      direction,
      from_number: call.from_number ?? null,
      to_number: call.to_number ?? null,
      call_type: callType,
      status: callStatus,
      duration_seconds: durationSeconds,
      transcript: call.transcript ?? null,
      started_at: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
      ended_at: call.end_timestamp ? new Date(call.end_timestamp).toISOString() : null,
      caller_role: callerRole,
    }
    const { error: upsertErr } = await supabase
      .from('check_in_calls')
      .upsert(upsertData, { onConflict: 'retell_call_id' })
    if (upsertErr) {
      console.error('[Retell] failed to save check_in_calls row:', upsertErr.message)
    }
  } else {
    // Non-member inbound — save to inbound_call_log
    await supabase.from('inbound_call_log').upsert({
      retell_call_id: retellCallId,
      agent_name: agentName,
      from_number: call.from_number ?? null,
      caller_role: callerRole,
      family_member_id: familyMemberId,
      duration_seconds: durationSeconds,
      transcript: call.transcript ?? null,
      needs_followup: agentName === 'hope',
    }, { onConflict: 'retell_call_id' }).catch(console.error)

    // Hope: alert navigators even for unknown callers
    if (agentName === 'hope') {
      await createNavigatorTask({
        taskType: 'crisis_followup',
        priority: 'critical',
        description: `Hope crisis-line call from unknown number ${call.from_number ?? 'unknown'} — human follow-up required`,
        memberId: null,
      }).catch(console.error)
    }
    // Mark processed
    await markProcessed(retellCallId, null)
    return
  }

  // Retrieve the saved call ID for further processing
  const { data: callRow } = await supabase
    .from('check_in_calls')
    .select('id')
    .eq('retell_call_id', retellCallId)
    .maybeSingle()
  const callId = callRow?.id ?? null

  // Step 4: Crisis scan
  if (agentDef.crisisScan && memberId) {
    try {
      await runCrisisScan({ memberId, callId, agentName, transcript: call.transcript ?? '' })
    } catch (err) {
      console.error('[Retell] crisis detection failed — creating manual review task')
      if (callId) {
        await createNavigatorTask({
          taskType: 'crisis_review',
          priority: 'critical',
          description: `Crisis detection failed for call ${retellCallId} — manual review required`,
          memberId,
        }).catch(console.error)
      }
    }
  }

  // Step 5: AI summary + scores
  const summary = await generateSummary(call.transcript ?? '')
  const scores = extractScores(call.transcript_object ?? [])

  if (callId) {
    await supabase.from('check_in_calls').update({
      ai_summary: summary,
      mood_score: scores.mood,
      energy_score: scores.energy,
      pain_score: scores.pain,
      medication_taken: scores.medication,
    }).eq('id', callId).catch(console.error)
  }

  // Step 6: Alert rules (best-effort)
  if (callId && memberId) {
    await runAlertRules(callId, memberId).catch(console.error)
  }

  // Step 7: Member bookkeeping
  if (memberId && ['aria','joy','grace'].includes(agentName)) {
    await supabase.from('members')
      .update({ last_aria_call_at: new Date().toISOString() })
      .eq('id', memberId)
      .catch(console.error)
  }
  if (memberId && agentName === 'aria' && durationSeconds && durationSeconds > 60) {
    await supabase.from('members')
      .update({ onboarding_call_completed: true })
      .eq('id', memberId)
      .catch(console.error)
  }

  // Step 8: Family notification (never include transcript)
  if (memberId && summary) {
    const { data: member } = await supabase
      .from('members')
      .select('family_can_see_call_summaries')
      .eq('id', memberId)
      .maybeSingle()
    if (member?.family_can_see_call_summaries) {
      await supabase.from('notifications').insert({
        member_id: memberId,
        type: 'call_summary',
        title: 'New call summary available',
        body: summary.substring(0, 200),
      }).catch(console.error)
    }
  }

  // Step 9: Mark processed
  await markProcessed(retellCallId, callId)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

async function markProcessed(retellCallId: string, callId: string | null) {
  if (callId) {
    await supabase.from('check_in_calls')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', callId)
      .catch(console.error)
  }
}

async function createNavigatorTask({
  taskType, priority, description, memberId
}: {
  taskType: string
  priority: string
  description: string
  memberId: string | null
}) {
  await supabase.from('navigator_tasks').insert({
    task_type: taskType,
    priority,
    description,
    member_id: memberId,
    status: 'pending',
  })
}

async function runCrisisScan({
  memberId, callId, agentName, transcript
}: {
  memberId: string
  callId: string | null
  agentName: AgentName
  transcript: string
}) {
  // Always create a critical task for Hope calls
  if (agentName === 'hope') {
    await createNavigatorTask({
      taskType: 'crisis_followup',
      priority: 'critical',
      description: 'Hope crisis-line call — human follow-up required',
      memberId,
    })
  }

  // Crisis phrase detection
  const CRISIS_PHRASES = [
    "don't want to be here", "want to die", "end my life", "kill myself",
    "no reason to live", "can't go on", "want it to be over"
  ]
  const lower = transcript.toLowerCase()
  const matched = CRISIS_PHRASES.some(p => lower.includes(p))

  if (matched) {
    // Insert emergency_log row
    await supabase.from('emergency_log').insert({
      member_id: memberId,
      call_id: callId,
      trigger: 'crisis_phrase',
      description: 'Crisis phrase detected in call transcript',
      severity: 'critical',
    }).catch(console.error)

    // Navigator task
    await createNavigatorTask({
      taskType: 'crisis_alert',
      priority: 'critical',
      description: 'Crisis phrase detected in call — immediate follow-up required',
      memberId,
    })
  }
}

async function generateSummary(transcript: string): Promise<string> {
  if (!transcript) return ''
  // Use Anthropic if key is available
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return '[Summary unavailable — ANTHROPIC_API_KEY not set]'
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Summarise this care call transcript in 2-3 sentences for a family member. Focus on how the person seemed and any needs mentioned. Do NOT include the transcript itself.\\n\\nTranscript:\\n${transcript.substring(0, 3000)}`
        }]
      })
    })
    const data = await res.json() as { content?: Array<{ text?: string }> }
    return data?.content?.[0]?.text ?? ''
  } catch {
    return '[Summary generation failed]'
  }
}

function extractScores(transcriptObject: Array<{ role: string; content: string }>) {
  // Simple keyword scoring from member speech only (role === 'user')
  const memberText = transcriptObject
    .filter(t => t.role === 'user')
    .map(t => t.content)
    .join(' ')
    .toLowerCase()

  const mood = scoreSentiment(memberText, ['great','wonderful','happy','good'], ['sad','upset','terrible','awful'])
  const energy = scoreSentiment(memberText, ['energetic','active','good energy'], ['tired','exhausted','weak'])
  const pain = scorePain(memberText)
  const medication = /took.*med|medication.*taken|yes.*pill/.test(memberText)

  return { mood, energy, pain, medication }
}

function scoreSentiment(text: string, positive: string[], negative: string[]): number | null {
  const pos = positive.filter(w => text.includes(w)).length
  const neg = negative.filter(w => text.includes(w)).length
  if (pos === 0 && neg === 0) return null
  return Math.min(10, Math.max(0, 5 + pos * 2 - neg * 2))
}

function scorePain(text: string): number | null {
  if (text.includes('no pain') || text.includes('pain free')) return 0
  const m = text.match(/pain.*?(\\d+)|(\\d+).*?pain/)
  if (m) return Math.min(10, parseInt(m[1] ?? m[2]))
  if (text.includes('lot of pain') || text.includes('severe pain')) return 8
  if (text.includes('some pain') || text.includes('little pain')) return 3
  return null
}

async function runAlertRules(callId: string, memberId: string) {
  // Best-effort: detectAlertsForCall if the function exists
  try {
    const { detectAlertsForCall } = await import('../alerts/detectAlerts')
    await detectAlertsForCall(callId, memberId)
  } catch {
    // alerts module not yet built — skip
  }
}
"""

# ── New webhook route.ts ─────────────────────────────────────────────────────
webhook_ts = """\
// app/api/webhooks/retell/route.ts
// Rewritten: signature verification, all 12 agents, processCallEnded

import { NextRequest, NextResponse } from 'next/server'
import { verifyRetellSignature } from '@/lib/voice/verifyRetell'
import { processCallEnded } from '@/lib/voice/processCallEnded'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  return NextResponse.json({ ok: true, service: 'retell-webhook' })
}

export async function POST(request: NextRequest) {
  // Read raw body BEFORE json parse (required for signature verification)
  const rawBody = await request.text()
  const signature = request.headers.get('x-retell-signature')

  const { ok, reason } = verifyRetellSignature(rawBody, signature)
  if (!ok) {
    console.warn('[Retell] webhook rejected:', reason)
    return NextResponse.json({ error: reason }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const event = payload.event as string
  const call = payload.data as Record<string, unknown>

  try {
    switch (event) {
      case 'call_started': {
        // Upsert row with in_progress status
        await supabase.from('check_in_calls').upsert({
          retell_call_id: call.call_id,
          agent_id: call.agent_id,
          status: 'in_progress',
          direction: call.direction ?? 'outbound',
          started_at: new Date().toISOString(),
        }, { onConflict: 'retell_call_id' }).catch(console.error)
        break
      }

      case 'call_ended':
      case 'call_analyzed': {
        await processCallEnded(call as Parameters<typeof processCallEnded>[0])
        break
      }

      case 'tool_call': {
        await handleToolCall(call)
        break
      }

      default:
        console.log('[Retell] unhandled event:', event)
    }
  } catch (err) {
    console.error('[Retell] webhook processing error:', err)
    // Return 200 so Retell doesn't retry infinitely
    return NextResponse.json({ error: 'processing error', ok: false })
  }

  return NextResponse.json({ ok: true })
}

// ── Tool call dispatcher ──────────────────────────────────────────────────────
async function handleToolCall(call: Record<string, unknown>) {
  const toolName = call.tool_name as string
  const args = (call.args ?? {}) as Record<string, unknown>
  const memberId = (call.metadata as Record<string,string>)?.member_id ?? null

  const toolRoutes: Record<string, () => Promise<unknown>> = {
    'welfare_check':          () => import('@/lib/voice/tools/welfareCheck').then(m => m.run(args, memberId)),
    'schedule_service':       () => import('@/lib/voice/tools/scheduleService').then(m => m.run(args, memberId)),
    'get_member_info':        () => import('@/lib/voice/tools/getMemberInfo').then(m => m.run(args, memberId)),
    'update_call_preferences':() => import('@/lib/voice/tools/updateCallPreferences').then(m => m.run(args, memberId)),
    'create_navigator_task':  () => import('@/lib/voice/tools/createNavigatorTask').then(m => m.run(args, memberId)),
  }

  const handler = toolRoutes[toolName]
  if (!handler) {
    console.warn('[Retell] unknown tool:', toolName)
    return
  }

  try {
    await handler()
  } catch (err) {
    console.error(`[Retell] tool ${toolName} failed:`, err)
  }
}
"""

# ── update_call_preferences tool ─────────────────────────────────────────────
update_prefs_ts = """\
// lib/voice/tools/updateCallPreferences.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function run(
  args: Record<string, unknown>,
  memberId: string | null
): Promise<{ ok: boolean }> {
  if (!memberId) return { ok: false }

  const updates: Record<string, unknown> = {}
  if (args.frequency) updates.call_frequency_preference = args.frequency
  if (args.time_preference) updates.call_time_preference = args.time_preference
  if (args.opted_in !== undefined) updates.aria_call_opted_in = !!args.opted_in

  if (Object.keys(updates).length === 0) return { ok: true }

  const { error } = await supabase.from('members').update(updates).eq('id', memberId)
  if (error) console.error('[Tool] updateCallPreferences error:', error.message)
  return { ok: !error }
}
"""

# ── Write all files ───────────────────────────────────────────────────────────
files = {
    "lib/voice/agents.ts":                           agents_ts,
    "lib/voice/verifyRetell.ts":                     verify_ts,
    "lib/voice/processCallEnded.ts":                 process_ts,
    "app/api/webhooks/retell/route.ts":              webhook_ts,
    "lib/voice/tools/updateCallPreferences.ts":      update_prefs_ts,
}

for rel, content in files.items():
    full = os.path.join(REPO, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"✅ Wrote {rel}")

print()
print("NEXT: run  npx tsc --noEmit  to check for type errors")
print("Then: git add -p && git commit -m 'G1.2-1.4: agent registry, webhook security, processCallEnded'")
print("Then: git push origin main")
