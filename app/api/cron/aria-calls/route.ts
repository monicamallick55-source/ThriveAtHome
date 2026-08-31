// Aria morning check-in call scheduler.
// Runs daily. Only members who have EXPLICITLY opted in (members.aria_call_opted_in = true)
// are considered — everyone else is skipped, per the trust-first launch strategy where the
// human navigator relationship comes first and Aria is an opt-in add-on.
// While the call provider is a stub this only logs; wiring a real provider (Retell) changes
// nothing here — lib/providers.ts swaps the implementation.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callProvider } from '@/lib/providers'

export const runtime = 'nodejs'

// How many days must pass between Aria calls for each frequency setting.
const FREQUENCY_GAP_DAYS: Record<string, number> = {
  daily: 1,
  every_other_day: 2,
  weekly: 7,
}

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
  const now = Date.now()

  // Opt-in filter is the whole point of this cron: aria_call_opted_in = true only.
  const { data: members, error } = await admin
    .from('members')
    .select('id, preferred_name, phone_number, preferred_language, topics_enjoy, check_in_frequency')
    .eq('status', 'active')
    .eq('aria_call_opted_in', true)

  if (error) {
    console.error('[aria-calls] member fetch failed:', error)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }

  let scheduled = 0
  let skippedFrequency = 0
  let errors = 0

  for (const m of members ?? []) {
    try {
      const gapDays = FREQUENCY_GAP_DAYS[m.check_in_frequency] ?? 1
      const gapMs = gapDays * 24 * 60 * 60 * 1000

      // Respect the member's chosen cadence — don't double-book if a recent call exists.
      const { data: lastCall } = await admin
        .from('check_in_calls')
        .select('scheduled_at, created_at')
        .eq('member_id', m.id)
        .eq('call_type', 'check_in')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastWhen = lastCall?.scheduled_at ?? lastCall?.created_at ?? null
      if (lastWhen && now - new Date(lastWhen).getTime() < gapMs) {
        skippedFrequency++
        continue
      }

      const { data: recentSummaries } = await admin
        .from('check_in_calls')
        .select('ai_summary')
        .eq('member_id', m.id)
        .not('ai_summary', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)

      const providerCallId = await callProvider.scheduleCall(m.id, m.phone_number, {
        preferredName: m.preferred_name,
        interests: m.topics_enjoy ?? [],
        priorCallSummaries: (recentSummaries ?? []).map((r) => r.ai_summary as string).filter(Boolean),
        preferredLanguage: m.preferred_language ?? 'english',
      })

      await admin.from('check_in_calls').insert({
        member_id: m.id,
        call_type: 'check_in',
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        retell_call_id: providerCallId,
      })

      scheduled++
    } catch (e) {
      console.error(`[aria-calls] member ${m.id}:`, e)
      errors++
    }
  }

  console.log('[aria-calls] Complete:', { candidates: members?.length ?? 0, scheduled, skippedFrequency, errors })
  return NextResponse.json({
    success: true,
    candidates: members?.length ?? 0,
    scheduled,
    skippedFrequency,
    errors,
  })
}
