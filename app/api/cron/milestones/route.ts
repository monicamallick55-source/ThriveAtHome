import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getMilestoneExists,
  createCelebrationEvent,
  markCelebrationNotified,
  getCompletedCallDatesForStreak,
  has30DayStreak,
} from '@/lib/data/celebrations'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log('[milestones-cron] Starting at', new Date().toISOString())

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

  const results = {
    first_call_milestones: 0,
    streak_milestones: 0,
    notifications_sent: 0,
    skipped: 0,
    errors: 0,
  }

  // Fetch all active members
  const { data: members, error: membersError } = await admin
    .from('members')
    .select('id, preferred_name, full_name')
    .eq('status', 'active')

  if (membersError) {
    console.error('[milestones-cron] fetch members:', membersError)
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  const today = new Date().toISOString().slice(0, 10)

  for (const member of members ?? []) {
    try {
      const memberName = member.preferred_name ?? member.full_name

      // --- Milestone 1: first completed call ---
      const firstCallExists = await getMilestoneExists(member.id, 'milestone_first_call')
      if (!firstCallExists) {
        const { count } = await admin
          .from('check_in_calls')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('status', 'completed')

        if ((count ?? 0) >= 1) {
          const { data: celebration, error: createErr } = await createCelebrationEvent({
            member_id: member.id,
            celebration_type: 'milestone_first_call',
            event_date: today,
            status: 'today',
            ai_message: `${memberName}'s first check-in call is complete — the journey begins!`,
          })

          if (!createErr && celebration) {
            results.first_call_milestones++
            console.log(`[milestones-cron] First call milestone created for ${member.id}`)

            // Push Realtime notification to all family members
            const sent = await pushMilestoneNotification(
              admin,
              member.id,
              celebration.id,
              `${memberName} completed their first check-in!`,
              `A big step — ${memberName} is connected and getting started on their wellbeing journey.`
            )
            if (sent) results.notifications_sent++
          } else {
            console.error(`[milestones-cron] Create first_call milestone failed for ${member.id}:`, createErr)
            results.errors++
          }
        }
      }

      // --- Milestone 2: 30-day streak ---
      const streakExists = await getMilestoneExists(member.id, 'milestone_30_day_streak')
      if (!streakExists) {
        const callDates = await getCompletedCallDatesForStreak(member.id)
        if (has30DayStreak(callDates)) {
          const { data: celebration, error: createErr } = await createCelebrationEvent({
            member_id: member.id,
            celebration_type: 'milestone_30_day_streak',
            event_date: today,
            status: 'today',
            ai_message: `30 days in a row — ${memberName} is on a remarkable streak!`,
          })

          if (!createErr && celebration) {
            results.streak_milestones++
            console.log(`[milestones-cron] 30-day streak milestone created for ${member.id}`)

            const sent = await pushMilestoneNotification(
              admin,
              member.id,
              celebration.id,
              `${memberName} has a 30-day check-in streak! 🔥`,
              `Thirty consecutive days of staying connected — an incredible achievement.`
            )
            if (sent) results.notifications_sent++
          } else {
            console.error(`[milestones-cron] Create streak milestone failed for ${member.id}:`, createErr)
            results.errors++
          }
        }
      }

      if (firstCallExists && streakExists) results.skipped++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[milestones-cron] Unexpected error for member ${member.id}:`, msg)
      results.errors++
    }
  }

  const elapsed = Date.now() - startTime
  const summary = { success: true, elapsed_ms: elapsed, ...results }
  console.log('[milestones-cron] Complete:', JSON.stringify(summary))
  return NextResponse.json(summary)
}

async function pushMilestoneNotification(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string,
  celebrationId: string,
  title: string,
  body: string
): Promise<boolean> {
  const { error: notifError } = await admin.from('realtime_notifications').insert({
    member_id: memberId,
    type: 'celebration_upcoming',
    severity: 'info',
    title,
    body,
  })
  if (notifError) {
    console.error('[milestones-cron] Notification insert failed:', notifError.message)
    return false
  }
  await markCelebrationNotified(celebrationId)
  return true
}
