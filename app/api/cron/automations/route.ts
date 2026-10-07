import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
type NotifType = string
type NotifSeverity = 'low' | 'medium' | 'high' | 'critical'

export const runtime = 'nodejs'

// Global cap: max 2 automation notifications per member per day
const MAX_AUTO_NOTIFS_PER_DAY = 2
// Dedup window for most rules
const RULE_DEDUP_DAYS = 7

type AutoResult = { rule: string; fired: number; skipped: number; errors: number }

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
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayStr = todayStart.toISOString()
  const dedupCutoff = new Date(now.getTime() - RULE_DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Per-member daily notification count cache
  const memberNotifCount: Record<string, number> = {}

  async function canNotify(memberId: string): Promise<boolean> {
    // Check opt-out on any linked family member
    const { data: fms } = await admin
      .from('family_members')
      .select('notification_prefs')
      .eq('member_id', memberId)
    const optedOut = (fms ?? []).some(
      (fm) => (fm.notification_prefs as Record<string, unknown>)?.automation_opt_out === true
    )
    if (optedOut) return false

    if (memberNotifCount[memberId] === undefined) {
      const { count } = await admin
        .from('realtime_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', memberId)
        .gte('created_at', todayStr)
        .like('type', 'automation_%')
      memberNotifCount[memberId] = count ?? 0
    }
    return memberNotifCount[memberId] < MAX_AUTO_NOTIFS_PER_DAY
  }

  async function pushNotif(
    memberId: string,
    type: NotifType,
    severity: NotifSeverity,
    title: string,
    body: string
  ): Promise<boolean> {
    if (!(await canNotify(memberId))) return false
    try {
      await (admin as any).from('realtime_notifications').insert({
        member_id: memberId,
        type,
        severity,
        title,
        body,
      })
      memberNotifCount[memberId] = (memberNotifCount[memberId] ?? 0) + 1
      return true
    } catch {
      return false
    }
  }

  async function wasRecentlyFired(memberId: string, type: NotifType): Promise<boolean> {
    const { data } = await (admin as any)
      .from('realtime_notifications')
      .select('id')
      .eq('member_id', memberId)
      .eq('type', type)
      .gte('created_at', dedupCutoff)
      .limit(1)
    return (data?.length ?? 0) > 0
  }

  const results: AutoResult[] = []

  // ─── RULE 1: Isolation detection ──────────────────────────────────────────
  // Daily-frequency member with no completed call in >3 days → family alert
  {
    const r: AutoResult = { rule: 'isolation_detection', fired: 0, skipped: 0, errors: 0 }
    try {
      const cutoff3days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const { data: members } = await admin
        .from('members')
        .select('id, preferred_name, full_name, check_in_frequency')
        .eq('check_in_frequency', 'daily')
        .eq('status', 'active')

      for (const m of members ?? []) {
        try {
          const { data: lastCall } = await admin
            .from('check_in_calls')
            .select('scheduled_at')
            .eq('member_id', m.id)
            .eq('status', 'completed')
            .order('scheduled_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const lastCallDate = lastCall?.scheduled_at
          if (lastCallDate && lastCallDate > cutoff3days) { r.skipped++; continue }

          if (await wasRecentlyFired(m.id, 'automation_isolation')) { r.skipped++; continue }

          const name = m.preferred_name ?? m.full_name ?? 'your family member'
          const daysSince = lastCallDate
            ? Math.round((now.getTime() - new Date(lastCallDate).getTime()) / (1000 * 60 * 60 * 24))
            : null
          const body = daysSince
            ? `${name} hasn't had a check-in call in ${daysSince} days. Log in to review or contact your navigator.`
            : `${name} hasn't had a completed check-in call yet. Log in to check their status.`

          const sent = await pushNotif(m.id, 'automation_isolation', 'medium', `Check in on ${name}`, body)
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/isolation] member ${m.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/isolation] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 2: Vaccination reminders (September / October only) ─────────────
  {
    const r: AutoResult = { rule: 'vaccination_reminder', fired: 0, skipped: 0, errors: 0 }
    const month = now.getUTCMonth() + 1
    if (month === 9 || month === 10) {
      try {
        const { data: members } = await admin
          .from('members')
          .select('id, preferred_name, full_name')
          .eq('status', 'active')

        for (const m of members ?? []) {
          try {
            const thisYear = now.getUTCFullYear()
            const { data: vaccItem } = await admin
              .from('tracked_items')
              .select('id')
              .eq('member_id', m.id)
              .ilike('item_name', '%flu%')
              .gte('expiration_or_appointment_date', `${thisYear}-01-01`)
              .limit(1)
              .maybeSingle()

            if (vaccItem) { r.skipped++; continue }
            if (await wasRecentlyFired(m.id, 'automation_vaccination')) { r.skipped++; continue }

            const name = m.preferred_name ?? m.full_name ?? 'your family member'
            const sent = await pushNotif(
              m.id, 'automation_vaccination', 'low',
              `Flu vaccine season for ${name}`,
              `It's flu vaccine season. Consider scheduling a flu shot for ${name} — your navigator can help coordinate.`
            )
            if (sent) r.fired++; else r.skipped++
          } catch (e) {
            console.error(`[automations/vaccination] member ${m.id}:`, e)
            r.errors++
          }
        }
      } catch (e) {
        console.error('[automations/vaccination] fetch error:', e)
        r.errors++
      }
    } else {
      r.skipped = 1
    }
    results.push(r)
  }

  // ─── RULE 3: Extreme weather alerts (stub) ─────────────────────────────────
  {
    console.log('[STUB][automations/extreme_weather] Would query NWS API by member zip code for severe weather alerts and push concern notifications to affected members.')
    results.push({ rule: 'extreme_weather', fired: 0, skipped: 1, errors: 0 })
  }

  // ─── RULE 4: Fall risk flag ────────────────────────────────────────────────
  // Recent unacknowledged fall alert with no open navigator task → create task
  {
    const r: AutoResult = { rule: 'fall_risk_flag', fired: 0, skipped: 0, errors: 0 }
    try {
      const since7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: fallAlerts } = await admin
        .from('alerts')
        .select('id, member_id, message, created_at')
        .eq('alert_type', 'fall')
        .gte('created_at', since7days)
        .eq('acknowledged', false)

      for (const alert of fallAlerts ?? []) {
        try {
          const { data: existingTask } = await admin
            .from('navigator_tasks')
            .select('id')
            .eq('member_id', alert.member_id)
            .eq('task_type', 'fall_risk_review')
            .eq('completed', false)
            .limit(1)
            .maybeSingle()

          if (existingTask) { r.skipped++; continue }

          const { data: assignment } = await admin
            .from('navigator_assignments')
            .select('navigator_id')
            .eq('member_id', alert.member_id)
            .limit(1)
            .maybeSingle()

          if (!assignment?.navigator_id) { r.skipped++; continue }

          await admin.from('navigator_tasks').insert({
            member_id: alert.member_id,
            navigator_id: assignment.navigator_id,
            task_type: 'fall_risk_review',
            description: `A fall alert was logged: "${alert.message}". Review fall risk and update care plan as needed.`,
            priority: 'high',
            completed: false,
          })
          r.fired++
        } catch (e) {
          console.error(`[automations/fall_risk] alert ${alert.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/fall_risk] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 5: Volunteer re-engagement ──────────────────────────────────────
  // Active volunteer match but no visit in 14 days → family notification
  {
    const r: AutoResult = { rule: 'volunteer_reengagement', fired: 0, skipped: 0, errors: 0 }
    try {
      const since14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data: matches } = await admin
        .from('volunteer_matches')
        .select('id, member_id, volunteer_id')
        .eq('status', 'matched')

      for (const match of matches ?? []) {
        try {
          const { data: recentVisit } = await admin
            .from('volunteer_visits')
            .select('id')
            .eq('member_id', match.member_id)
            .eq('volunteer_id', match.volunteer_id)
            .gte('created_at', since14)
            .limit(1)
            .maybeSingle()

          if (recentVisit) { r.skipped++; continue }
          if (await wasRecentlyFired(match.member_id, 'automation_volunteer_reengagement')) { r.skipped++; continue }

          const sent = await pushNotif(
            match.member_id, 'automation_volunteer_reengagement', 'low',
            'Stay connected with your volunteer',
            'It has been a while since your last volunteer visit. Your navigator can help schedule the next one.'
          )
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/volunteer_reengagement] match ${match.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/volunteer_reengagement] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 6: Event no-show follow-up ──────────────────────────────────────
  // RSVPd to an event that was yesterday but attended=false → follow-up notif
  {
    const r: AutoResult = { rule: 'event_noshow_followup', fired: 0, skipped: 0, errors: 0 }
    try {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      const { data: rsvps } = await admin
        .from('event_rsvps')
        .select('id, member_id, event_id')
        .eq('attended', false)

      for (const rsvp of rsvps ?? []) {
        try {
          const { data: event } = await admin
            .from('events')
            .select('event_date, title')
            .eq('id', rsvp.event_id)
            .maybeSingle()

          if (!event) { r.skipped++; continue }
          // Only follow up for events that were yesterday or the day before (not older)
          if (event.event_date < twoDaysAgo || event.event_date >= yesterday) { r.skipped++; continue }

          if (await wasRecentlyFired(rsvp.member_id, 'automation_event_noshow')) { r.skipped++; continue }

          const sent = await pushNotif(
            rsvp.member_id, 'automation_event_noshow', 'low',
            'We missed you at the event',
            `We hope you are doing well — you had registered for "${event.title}". Check the Events section for upcoming opportunities.`
          )
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/event_noshow] rsvp ${rsvp.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/event_noshow] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 7: Onboarding completion reminder ────────────────────────────────
  // Member joined >3 days ago, missing emergency contact or date_of_birth → nudge
  {
    const r: AutoResult = { rule: 'onboarding_completion', fired: 0, skipped: 0, errors: 0 }
    try {
      const joinedBefore = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const { data: members } = await admin
        .from('members')
        .select('id, preferred_name, full_name, date_of_birth, emergency_contact_1_name, created_at')
        .eq('status', 'active')
        .lt('created_at', joinedBefore)
        .or('date_of_birth.is.null,emergency_contact_1_name.is.null')

      for (const m of members ?? []) {
        try {
          if (await wasRecentlyFired(m.id, 'automation_onboarding')) { r.skipped++; continue }

          const name = m.preferred_name ?? m.full_name ?? 'their profile'
          const missing = []
          if (!m.date_of_birth) missing.push('date of birth')
          if (!m.emergency_contact_1_name) missing.push('emergency contact')

          const sent = await pushNotif(
            m.id, 'automation_onboarding', 'low',
            `Complete ${name}'s profile`,
            `Adding ${missing.join(' and ')} helps your navigator respond quickly in an emergency.`
          )
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/onboarding] member ${m.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/onboarding] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 8: Navigator caseload warning ────────────────────────────────────
  // Navigator with > caseload_limit assignments → console warning for admin
  {
    const r: AutoResult = { rule: 'navigator_caseload_warning', fired: 0, skipped: 0, errors: 0 }
    try {
      const { data: navigators } = await admin
        .from('care_navigators')
        .select('id, full_name, caseload_limit')
        .eq('is_active', true)

      for (const nav of navigators ?? []) {
        try {
          const { count } = await admin
            .from('navigator_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('navigator_id', nav.id)

          const limit = nav.caseload_limit ?? 15
          if ((count ?? 0) > limit) {
            console.warn(`[automations/caseload_warning] Navigator "${nav.full_name}" has ${count} assignments — exceeds limit of ${limit}.`)
            r.fired++
          } else {
            r.skipped++
          }
        } catch (e) {
          console.error(`[automations/caseload_warning] nav ${nav.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/caseload_warning] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 9: Transport follow-up ──────────────────────────────────────────
  // Transport booking completed in last 2–24 hours → feedback notification
  {
    const r: AutoResult = { rule: 'transport_followup', fired: 0, skipped: 0, errors: 0 }
    try {
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const since2h = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      const { data: bookings } = await admin
        .from('service_bookings')
        .select('id, member_id')
        .eq('service_type', 'transport')
        .eq('status', 'completed')
        .gte('completed_at', since24h)
        .lte('completed_at', since2h)

      for (const b of bookings ?? []) {
        try {
          if (await wasRecentlyFired(b.member_id, 'automation_transport_followup')) { r.skipped++; continue }

          const sent = await pushNotif(
            b.member_id, 'automation_transport_followup', 'low',
            'How was the ride?',
            'We hope your transport went smoothly. Let your navigator know if anything needs follow-up, or if you would like to book again.'
          )
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/transport_followup] booking ${b.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/transport_followup] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 10: Tech help success check ─────────────────────────────────────
  // Tech help booking completed in last 2–24 hours → follow-up notification
  {
    const r: AutoResult = { rule: 'tech_help_check', fired: 0, skipped: 0, errors: 0 }
    try {
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const since2h = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      const { data: bookings } = await admin
        .from('service_bookings')
        .select('id, member_id')
        .eq('service_type', 'tech_help')
        .eq('status', 'completed')
        .gte('completed_at', since24h)
        .lte('completed_at', since2h)

      for (const b of bookings ?? []) {
        try {
          if (await wasRecentlyFired(b.member_id, 'automation_tech_help_check')) { r.skipped++; continue }

          const sent = await pushNotif(
            b.member_id, 'automation_tech_help_check', 'low',
            'Did the tech help resolve your issue?',
            'We hope your tech session helped. If you still need assistance, your navigator is here for you.'
          )
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/tech_help_check] booking ${b.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/tech_help_check] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULE 11: Meal delivery feedback ──────────────────────────────────────
  // Meals booking completed in last 4–24 hours → feedback notification
  {
    const r: AutoResult = { rule: 'meal_delivery_feedback', fired: 0, skipped: 0, errors: 0 }
    try {
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const since4h = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
      const { data: bookings } = await admin
        .from('service_bookings')
        .select('id, member_id')
        .eq('service_type', 'meals')
        .eq('status', 'completed')
        .gte('completed_at', since24h)
        .lte('completed_at', since4h)

      for (const b of bookings ?? []) {
        try {
          if (await wasRecentlyFired(b.member_id, 'automation_meal_feedback')) { r.skipped++; continue }

          const sent = await pushNotif(
            b.member_id, 'automation_meal_feedback', 'low',
            'How was the meal delivery?',
            'We hope the meal arrived well and was enjoyed. Let your navigator know any preferences for next time.'
          )
          if (sent) r.fired++; else r.skipped++
        } catch (e) {
          console.error(`[automations/meal_feedback] booking ${b.id}:`, e)
          r.errors++
        }
      }
    } catch (e) {
      console.error('[automations/meal_feedback] fetch error:', e)
      r.errors++
    }
    results.push(r)
  }

  // ─── RULES 12–17: Covered by existing crons ───────────────────────────────
  // 12. Prescription refill prediction    → /api/cron/tracked-item-reminders (item_type='prescription')
  // 13. Doctor appointment reminder       → /api/cron/tracked-item-reminders (item_type='appointment')
  // 14. Seasonal home safety checks       → /api/cron/seasonal-reminders
  // 15. Inactive family nudge             → /api/cron/family-nudge
  // 16. Subscription value summary        → /api/cron/monthly-summary
  // 17. Benefits renewal reminder         → static benefits page, no external API needed

  const totalFired = results.reduce((s, r) => s + r.fired, 0)
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0)
  const totalErrors = results.reduce((s, r) => s + r.errors, 0)

  console.log('[automations] Complete:', { totalFired, totalSkipped, totalErrors })
  return NextResponse.json({
    success: true,
    totalFired,
    totalSkipped,
    totalErrors,
    rules: results,
  })
}
