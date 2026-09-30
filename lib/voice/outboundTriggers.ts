// Outbound voice triggers for Joy (celebrations) and Grace (reminders).
// Both require aria_call_opted_in = true, place at most one call per member per day,
// and record a scheduled check_in_calls row that processCallEnded later completes.
// `memberIds` limits writes to those members (tests); reads are unscoped.
import { createAdminClient } from '../supabase/admin'
import { aiProvider, callProvider } from '../providers'
import type { CallContext } from '../interfaces/CallProvider'
import type { CallType } from '@/types/database'

const DAY_MS = 24 * 60 * 60 * 1000
const GRIEF_WINDOW_DAYS = 90

type Admin = ReturnType<typeof createAdminClient>

export interface TriggerOptions {
  now?: Date
  memberIds?: string[]
}

export interface TriggerResult {
  called: number
  skippedNotOptedIn: number
  skippedGrief: number
  skippedAlreadyCalled: number
  errors: number
}

function emptyResult(): TriggerResult {
  return { called: 0, skippedNotOptedIn: 0, skippedGrief: 0, skippedAlreadyCalled: 0, errors: 0 }
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface CallableMember {
  id: string
  preferred_name: string
  full_name: string
  date_of_birth: string
  phone_number: string
  preferred_language: string
  topics_enjoy: string[] | null
  health_conditions: string | null
  medications: string | null
  plan_tier: string
  aria_call_opted_in: boolean
  status: string
}

async function loadMember(admin: Admin, memberId: string): Promise<CallableMember | null> {
  const { data, error } = await admin
    .from('members')
    .select('id, preferred_name, full_name, date_of_birth, phone_number, preferred_language, topics_enjoy, health_conditions, medications, plan_tier, aria_call_opted_in, status')
    .eq('id', memberId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as CallableMember | null) ?? null
}

/** True when this member already has a call of this type scheduled/placed today. */
async function alreadyCalledToday(admin: Admin, memberId: string, callType: CallType, now: Date): Promise<boolean> {
  const { data, error } = await admin
    .from('check_in_calls')
    .select('id')
    .eq('member_id', memberId)
    .eq('call_type', callType)
    .gte('created_at', `${dateStr(now)}T00:00:00.000Z`)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return !!data
}

async function placeCall(admin: Admin, m: CallableMember, ctx: CallContext, now: Date): Promise<void> {
  const callId = await callProvider.scheduleCall(m.id, m.phone_number, ctx)
  const { error } = await admin.from('check_in_calls').insert({
    member_id: m.id,
    call_type: ctx.callType as CallType,
    status: 'scheduled',
    scheduled_at: now.toISOString(),
    retell_call_id: callId,
    agent_name: ctx.agent ?? 'aria',
    direction: 'outbound',
  })
  if (error) console.error(`[voice/outbound] scheduled row insert failed for ${m.id}:`, error.message)
}

// ── Joy: celebrations due today (birthdays + milestones) ─────────────────────

export async function runJoyCalls(opts: TriggerOptions = {}): Promise<TriggerResult> {
  const admin = createAdminClient()
  const now = opts.now ?? new Date()
  const inScope = (id: string) => !opts.memberIds || opts.memberIds.includes(id)
  const result = emptyResult()

  const { data: events, error } = await admin
    .from('celebration_events')
    .select('member_id, celebration_type, ai_message')
    .eq('event_date', dateStr(now))
  if (error) {
    console.error('[voice/joy] celebration_events query failed:', error.message)
    result.errors++
    return result
  }

  // One call per member: birthdays take priority over milestones
  const byMember = new Map<string, { celebration_type: string; ai_message: string | null }>()
  for (const e of events ?? []) {
    const prev = byMember.get(e.member_id)
    if (!prev || e.celebration_type === 'birthday') byMember.set(e.member_id, e)
  }

  for (const [memberId, event] of byMember) {
    if (!inScope(memberId)) continue
    try {
      const m = await loadMember(admin, memberId)
      if (!m || m.status !== 'active') continue
      if (!m.aria_call_opted_in) { result.skippedNotOptedIn++; continue }

      const griefSince = new Date(now.getTime() - GRIEF_WINDOW_DAYS * DAY_MS).toISOString()
      const { data: grief, error: griefErr } = await admin
        .from('grief_support_requests')
        .select('id')
        .eq('member_id', memberId)
        .gte('created_at', griefSince)
        .limit(1)
        .maybeSingle()
      if (griefErr) throw new Error(griefErr.message)
      if (grief) {
        console.log(`[voice/joy] Skipping ${event.celebration_type} call for member ${memberId} — grief support request in the last ${GRIEF_WINDOW_DAYS} days`)
        result.skippedGrief++
        continue
      }

      if (await alreadyCalledToday(admin, memberId, 'celebration', now)) { result.skippedAlreadyCalled++; continue }

      let personalLine = event.ai_message ?? ''
      try {
        personalLine = await aiProvider.generateCelebrationPersonalisation({
          id: m.id,
          preferred_name: m.preferred_name,
          full_name: m.full_name,
          date_of_birth: m.date_of_birth,
          phone_number: m.phone_number,
          preferred_language: m.preferred_language,
          topics_enjoy: m.topics_enjoy ?? [],
          health_conditions: m.health_conditions,
          medications: m.medications,
          plan_tier: m.plan_tier,
        }, event.celebration_type)
      } catch (e) {
        console.warn(`[voice/joy] personalisation failed for ${memberId}, using stored message:`, e instanceof Error ? e.message : e)
      }

      await placeCall(admin, m, {
        agent: 'joy',
        callType: 'celebration',
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: [],
        preferredLanguage: m.preferred_language ?? 'english',
        dynamicVariables: {
          celebration_type: event.celebration_type,
          personal_line: personalLine || `Happy ${event.celebration_type.replace(/_/g, ' ')}, ${m.preferred_name}!`,
        },
      }, now)
      result.called++
    } catch (e) {
      console.error(`[voice/joy] error for member ${memberId}:`, e)
      result.errors++
    }
  }

  console.log('[voice/joy] Done:', result)
  return result
}

// ── Grace: tracked items due tomorrow with call_reminder = true ──────────────

export async function runGraceCalls(opts: TriggerOptions = {}): Promise<TriggerResult> {
  const admin = createAdminClient()
  const now = opts.now ?? new Date()
  const inScope = (id: string) => !opts.memberIds || opts.memberIds.includes(id)
  const result = emptyResult()
  const tomorrow = dateStr(new Date(now.getTime() + DAY_MS))
  const dayAfter = dateStr(new Date(now.getTime() + 2 * DAY_MS))

  const { data: items, error } = await admin
    .from('tracked_items')
    .select('id, member_id, item_name, expiration_or_appointment_date, snoozed_until')
    .eq('status', 'active')
    .eq('call_reminder', true)
    .gte('expiration_or_appointment_date', tomorrow)
    .lt('expiration_or_appointment_date', dayAfter)
  if (error) {
    console.error('[voice/grace] tracked_items query failed:', error.message)
    result.errors++
    return result
  }

  // One call per member, covering all of tomorrow's items
  const byMember = new Map<string, string[]>()
  for (const item of items ?? []) {
    if (item.snoozed_until && new Date(item.snoozed_until) > now) continue
    byMember.set(item.member_id, [...(byMember.get(item.member_id) ?? []), item.item_name])
  }

  for (const [memberId, itemNames] of byMember) {
    if (!inScope(memberId)) continue
    try {
      const m = await loadMember(admin, memberId)
      if (!m || m.status !== 'active') continue
      if (!m.aria_call_opted_in) { result.skippedNotOptedIn++; continue }
      if (await alreadyCalledToday(admin, memberId, 'reminder', now)) { result.skippedAlreadyCalled++; continue }

      await placeCall(admin, m, {
        agent: 'grace',
        callType: 'reminder',
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: [],
        preferredLanguage: m.preferred_language ?? 'english',
        dynamicVariables: {
          item_name: itemNames.join(' and '),
          due_date: tomorrow,
        },
      }, now)
      result.called++
    } catch (e) {
      console.error(`[voice/grace] error for member ${memberId}:`, e)
      result.errors++
    }
  }

  console.log('[voice/grace] Done:', result)
  return result
}
