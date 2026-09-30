// Aria call scheduler — adaptive cadence, gated by aria_call_opted_in (Launch Protocol).
// Handles, in priority order:
// 1. Pending callback requests (member asked Aria to call back)
// 2. Onboarding: opted-in members get an Aria onboarding call (up to 3 attempts);
//    everyone else gets a human welcome_call navigator task (days 1–7, no Aria)
// 3. Regular check-in calls (opted-in only; member's chosen frequency, risk override)
// 4. Day-21 aria_intro task for members who haven't opted in
// 5. Elevated risk on a non-opted-in member → human call task, never an Aria call
import { createAdminClient } from '../supabase/admin'
import { callProvider } from '../providers'
import type { CallContext } from '../interfaces/CallProvider'

const FREQUENCY_GAP_DAYS: Record<string, number> = {
  daily: 1,
  few_times_week: 2,
  weekly: 7,
}

const ONBOARDING_TIERS = ['basics', 'connect'] as const
const DAY_MS = 24 * 60 * 60 * 1000

type Admin = ReturnType<typeof createAdminClient>

/** Creates a navigator task unless the member already has one of this type. Returns true when created. */
async function createTaskOnce(
  admin: Admin,
  memberId: string,
  taskType: string,
  task: { description: string; priority: 'low' | 'medium' | 'high' | 'critical'; due_by?: string | null },
  opts: { openOnly?: boolean } = {},
): Promise<boolean> {
  let q = admin.from('navigator_tasks').select('id').eq('member_id', memberId).eq('task_type', taskType)
  if (opts.openOnly) q = q.eq('completed', false)
  const { data: existing, error: findErr } = await q.limit(1).maybeSingle()
  if (findErr) throw new Error(findErr.message)
  if (existing) return false
  const { error } = await admin.from('navigator_tasks').insert({ member_id: memberId, task_type: taskType, ...task })
  if (error) throw new Error(error.message)
  return true
}

export interface AriaScheduleOptions {
  now?: Date
  /** Limit every query to these members (tests). Omit in production. */
  memberIds?: string[]
}

export interface AriaScheduleResult {
  callbacks: number; onboarding: number; checkins: number; skipped: number; errors: number
  welcomeTasks: number; ariaIntroTasks: number; riskTasks: number
}

export async function runAriaSchedule(opts: AriaScheduleOptions = {}): Promise<AriaScheduleResult> {
  const admin = createAdminClient()
  const now = opts.now ?? new Date()
  // Reads are unscoped; writes only happen for members in scope (all members when unset)
  const inScope = (id: string) => !opts.memberIds || opts.memberIds.includes(id)
  const results = {
    callbacks: 0, onboarding: 0, checkins: 0, skipped: 0, errors: 0,
    welcomeTasks: 0, ariaIntroTasks: 0, riskTasks: 0,
  }

  // ── 1. CALLBACK REQUESTS ────────────────────────────────────────────────────
  const { data: callbacks } = await (admin.from as any)('callback_requests')
    .select('id, member_id, notes, preferred_time')
    .eq('status', 'pending')
    .or(`preferred_time.is.null,preferred_time.lte.${now.toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(20)

  for (const cb of (callbacks ?? []) as Array<{ id: string; member_id: string; notes: string | null; preferred_time: string | null }>) {
    if (!inScope(cb.member_id)) continue
    try {
      const { data: m } = await admin
        .from('members')
        .select('id, preferred_name, phone_number, preferred_language, topics_enjoy')
        .eq('id', cb.member_id)
        .eq('status', 'active')
        .maybeSingle()
      if (!m) continue

      const ctx: CallContext = {
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: [],
        preferredLanguage: m.preferred_language ?? 'english',
      }

      const callId = await callProvider.scheduleCall(m.id, m.phone_number, ctx)

      await (admin.from as any)('callback_requests')
        .update({ status: 'triggered', triggered_at: now.toISOString(), call_id: callId })
        .eq('id', cb.id)

      await admin.from('check_in_calls').insert({
        member_id: m.id,
        call_type: 'check_in',
        status: 'scheduled',
        scheduled_at: now.toISOString(),
        retell_call_id: callId,
      })

      results.callbacks++
    } catch (e) {
      console.error('[aria-calls] callback error:', e)
      results.errors++
    }
  }

  // ── 2a. HUMAN WELCOME CALL (Launch Protocol days 1–7) ──────────────────────
  // Members who have not opted in to Aria get a personal welcome call from a navigator instead.
  const { data: welcomeMembers } = await admin
    .from('members')
    .select('id, created_at')
    .eq('status', 'active')
    .eq('aria_call_opted_in', false)
    .gte('created_at', new Date(now.getTime() - 7 * DAY_MS).toISOString())

  for (const m of welcomeMembers ?? []) {
    if (!inScope(m.id)) continue
    try {
      const created = await createTaskOnce(admin, m.id, 'welcome_call', {
        description: 'Personal welcome call — do not mention Aria (Launch Protocol days 1–7)',
        priority: 'high',
        due_by: new Date(new Date(m.created_at).getTime() + DAY_MS).toISOString(),
      })
      if (created) results.welcomeTasks++
    } catch (e) {
      console.error(`[aria-calls] welcome task error ${m.id}:`, e)
      results.errors++
    }
  }

  // ── 2b. ARIA ONBOARDING CALLS (opted-in members only) ──────────────────────
  // callType: 'onboarding' is passed so Aria uses the welcome script branch
  const cutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()

  const { data: onboardingMembers } = await (admin.from as any)('members')
    .select('id, preferred_name, phone_number, preferred_language, topics_enjoy, plan_tier, onboarding_call_attempts, onboarding_call_scheduled_at')
    .eq('status', 'active')
    .eq('aria_call_opted_in', true)
    .eq('onboarding_call_completed', false)
    .in('plan_tier', ONBOARDING_TIERS)
    .lt('onboarding_call_attempts', 3)
    .or(`onboarding_call_scheduled_at.is.null,onboarding_call_scheduled_at.lte.${cutoff}`)

  for (const m of (onboardingMembers ?? []) as Array<{
    id: string; preferred_name: string; phone_number: string; preferred_language: string;
    topics_enjoy: string[]; plan_tier: string; onboarding_call_attempts: number; onboarding_call_scheduled_at: string | null
  }>) {
    if (!inScope(m.id)) continue
    try {
      const ctx: CallContext = {
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: [],
        preferredLanguage: m.preferred_language ?? 'english',
        callType: 'onboarding',
      }

      const callId = await callProvider.scheduleCall(m.id, m.phone_number, ctx)
      const newAttempts = (m.onboarding_call_attempts ?? 0) + 1

      await (admin.from as any)('members')
        .update({
          onboarding_call_attempts: newAttempts,
          onboarding_call_scheduled_at: now.toISOString(),
        })
        .eq('id', m.id)

      await admin.from('check_in_calls').insert({
        member_id: m.id,
        call_type: 'onboarding',
        status: 'scheduled',
        scheduled_at: now.toISOString(),
        retell_call_id: callId,
      })

      if (newAttempts >= 3) {
        await admin.from('alerts').insert({
          member_id: m.id,
          alert_type: 'missed_call',
          severity: 'concern',
          message: `${m.preferred_name} did not answer onboarding call after 3 attempts — please reach out manually.`,
        })
      }

      results.onboarding++
    } catch (e) {
      console.error('[aria-calls] onboarding error:', e)
      results.errors++
    }
  }

  // ── 3. REGULAR CHECK-IN CALLS ───────────────────────────────────────────────
  const { data: members } = await (admin.from as any)('members')
    .select('id, preferred_name, phone_number, preferred_language, topics_enjoy, call_frequency_preference, checkin_preference, risk_override_calls, last_aria_call_at, onboarding_call_completed')
    .eq('status', 'active')
    .eq('aria_call_opted_in', true)
    .in('checkin_preference', ['aria', 'both'])

  for (const m of (members ?? []) as Array<{
    id: string; preferred_name: string; phone_number: string; preferred_language: string;
    topics_enjoy: string[]; call_frequency_preference: string; checkin_preference: string;
    risk_override_calls: boolean; last_aria_call_at: string | null; onboarding_call_completed: boolean
  }>) {
    if (!inScope(m.id)) continue
    try {
      if (!m.onboarding_call_completed) {
        results.skipped++
        continue
      }

      const freqKey = m.risk_override_calls ? 'daily' : (m.call_frequency_preference ?? 'weekly')
      const gapDays = FREQUENCY_GAP_DAYS[freqKey] ?? 7
      const gapMs = gapDays * 24 * 60 * 60 * 1000

      if (m.last_aria_call_at && now.getTime() - new Date(m.last_aria_call_at).getTime() < gapMs) {
        results.skipped++
        continue
      }

      const { data: recentSummaries } = await admin
        .from('check_in_calls')
        .select('ai_summary')
        .eq('member_id', m.id)
        .not('ai_summary', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)

      const ctx: CallContext = {
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: (recentSummaries ?? []).map((r: { ai_summary: string }) => r.ai_summary).filter(Boolean),
        preferredLanguage: m.preferred_language ?? 'english',
      }

      const callId = await callProvider.scheduleCall(m.id, m.phone_number, ctx)

      await admin.from('check_in_calls').insert({
        member_id: m.id,
        call_type: 'check_in',
        status: 'scheduled',
        scheduled_at: now.toISOString(),
        retell_call_id: callId,
      })

      await (admin.from as any)('members')
        .update({ last_aria_call_at: now.toISOString() })
        .eq('id', m.id)

      results.checkins++
    } catch (e) {
      console.error(`[aria-calls] checkin error ${m.id}:`, e)
      results.errors++
    }
  }

  // ── 4. DAY-21 ARIA INTRO ───────────────────────────────────────────────────
  // 21–28 days after joining (window so a missed cron run still catches them)
  const { data: day21Members } = await admin
    .from('members')
    .select('id')
    .eq('status', 'active')
    .eq('aria_call_opted_in', false)
    .lte('created_at', new Date(now.getTime() - 21 * DAY_MS).toISOString())
    .gte('created_at', new Date(now.getTime() - 28 * DAY_MS).toISOString())

  for (const m of day21Members ?? []) {
    if (!inScope(m.id)) continue
    try {
      const created = await createTaskOnce(admin, m.id, 'aria_intro', {
        description: 'Offer Aria (play sample call if wanted). Default is NO.',
        priority: 'medium',
      })
      if (created) results.ariaIntroTasks++
    } catch (e) {
      console.error(`[aria-calls] aria_intro task error ${m.id}:`, e)
      results.errors++
    }
  }

  // ── 5. ELEVATED RISK, NOT OPTED IN → HUMAN CALL ────────────────────────────
  // risk_override_calls never bypasses opt-in; one open task at a time per member.
  // risk_override_calls is not in types/database.ts yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: riskMembers } = await (admin.from as any)('members')
    .select('id')
    .eq('status', 'active')
    .eq('aria_call_opted_in', false)
    .eq('risk_override_calls', true)

  for (const m of (riskMembers ?? []) as Array<{ id: string }>) {
    if (!inScope(m.id)) continue
    try {
      const created = await createTaskOnce(admin, m.id, 'elevated_risk_call', {
        description: 'Elevated risk — human call needed',
        priority: 'high',
      }, { openOnly: true })
      if (created) results.riskTasks++
    } catch (e) {
      console.error(`[aria-calls] risk task error ${m.id}:`, e)
      results.errors++
    }
  }

  console.log('[aria-calls] Complete:', results)
  return results
}
