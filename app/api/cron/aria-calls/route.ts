// Aria call scheduler — adaptive cadence.
// Handles three call types in priority order:
// 1. Pending callback requests (member asked Aria to call back)
// 2. Onboarding calls (new Basics/Connect members, up to 3 attempts)
// 3. Regular check-in calls (member's chosen frequency, risk override)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callProvider } from '@/lib/providers'
import type { CallContext } from '@/lib/interfaces/CallProvider'

export const runtime = 'nodejs'

const FREQUENCY_GAP_DAYS: Record<string, number> = {
  daily: 1,
  few_times_week: 2,
  weekly: 7,
}

const ONBOARDING_TIERS = ['basics', 'connect'] as const

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const results = { callbacks: 0, onboarding: 0, checkins: 0, skipped: 0, errors: 0 }

  // ── 1. CALLBACK REQUESTS ────────────────────────────────────────────────────
  const { data: callbacks } = await (admin.from as any)('callback_requests')
    .select('id, member_id, notes, preferred_time')
    .eq('status', 'pending')
    .or(`preferred_time.is.null,preferred_time.lte.${now.toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(20)

  for (const cb of (callbacks ?? []) as Array<{ id: string; member_id: string; notes: string | null; preferred_time: string | null }>) {
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

  // ── 2. ONBOARDING CALLS ─────────────────────────────────────────────────────
  const cutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()

  const { data: onboardingMembers } = await (admin.from as any)('members')
    .select('id, preferred_name, phone_number, preferred_language, topics_enjoy, plan_tier, onboarding_call_attempts, onboarding_call_scheduled_at')
    .eq('status', 'active')
    .eq('onboarding_call_completed', false)
    .in('plan_tier', ONBOARDING_TIERS)
    .lt('onboarding_call_attempts', 3)
    .or(`onboarding_call_scheduled_at.is.null,onboarding_call_scheduled_at.lte.${cutoff}`)

  for (const m of (onboardingMembers ?? []) as Array<{
    id: string; preferred_name: string; phone_number: string; preferred_language: string;
    topics_enjoy: string[]; plan_tier: string; onboarding_call_attempts: number; onboarding_call_scheduled_at: string | null
  }>) {
    try {
      const ctx: CallContext = {
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: [],
        preferredLanguage: m.preferred_language ?? 'english',
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
        call_type: 'check_in',
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
    .in('checkin_preference', ['aria', 'both'])

  for (const m of (members ?? []) as Array<{
    id: string; preferred_name: string; phone_number: string; preferred_language: string;
    topics_enjoy: string[]; call_frequency_preference: string; checkin_preference: string;
    risk_override_calls: boolean; last_aria_call_at: string | null; onboarding_call_completed: boolean
  }>) {
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

  console.log('[aria-calls] Complete:', results)
  return NextResponse.json({ success: true, ...results })
}
