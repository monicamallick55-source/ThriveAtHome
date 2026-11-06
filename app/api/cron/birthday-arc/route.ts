/**
 * app/api/cron/birthday-arc/route.ts — G7.5 + G7.6
 *
 * Runs daily. Handles:
 *  G7.5 — 7-day birthday arc: D-5, D-3, D-1, D+1 steps
 *          (D-7 and D-0 handled by existing cron/celebrations)
 *  G7.6 — Milestone birthday programs: triggered 30 days before milestone ages
 *
 * Schedule: "0 9 * * *" (9am UTC daily)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isBirthdayInNDays(birthday: string, n: number, today: Date): boolean {
  const bday = new Date(birthday)
  const target = new Date(today)
  target.setDate(today.getDate() + n)
  return bday.getMonth() === target.getMonth() && bday.getDate() === target.getDate()
}

function ageOnDate(birthday: string, date: Date): number {
  const bday = new Date(birthday)
  let age = date.getFullYear() - bday.getFullYear()
  if (
    date.getMonth() < bday.getMonth() ||
    (date.getMonth() === bday.getMonth() && date.getDate() < bday.getDate())
  ) {
    age--
  }
  return age
}

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET && req.headers.get('authorization')?.replace('Bearer ', '') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const today = new Date()
  const results: string[] = []

  // ── Fetch members with birthdays who haven't opted out ────────────────────
  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name, date_of_birth, supabase_auth_id, celebration_opt_out')
    .not('date_of_birth', 'is', null)
    .eq('celebration_opt_out', false)
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  for (const member of members ?? []) {
    if (!member.date_of_birth) continue

    // Check for active grief request (skip arc if member is in grief)
    const { count: griefCount } = await supabase
      .from('grief_support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('status', 'active')

    const inGrief = (griefCount ?? 0) > 0

    // ── G7.5 Birthday arc steps ─────────────────────────────────────────────

    // D-5: flag for Aria to mention birthday in context
    if (!inGrief && isBirthdayInNDays(member.date_of_birth, 5, today)) {
      // Store a context note for the next Aria call — write to aria_context_flags table
      // (or member metadata). We use a simple approach: upsert a row in
      // important_dates with a note type, so Aria picks it up via its existing context.
      // The main Aria context injection reads important_dates for upcoming events.
      results.push(`D-5 arc: ${member.full_name}`)
      // No additional DB action needed; the upcoming-birthday context is already
      // injected by the existing celebrations cron via important_dates. The D-5
      // step ensures Aria mentions it; a note is stored in member_metadata for
      // the call AI prompt.
      await supabase.from('member_metadata').upsert({
        member_id: member.id,
        key: 'birthday_arc_d5_noted',
        value: today.toISOString().split('T')[0],
      }, { onConflict: 'member_id,key' }).then(({ error: _e }: { error: unknown }) => void _e)
    }

    // D-3: open community wishes — navigator task to invite circle members
    if (!inGrief && isBirthdayInNDays(member.date_of_birth, 3, today)) {
      results.push(`D-3 arc (wishes open): ${member.full_name}`)

      // Create navigator task to send wish invitations to circle members
      await supabase.from('navigator_tasks').insert({
        member_id: member.id,
        title: `Birthday in 3 days — invite circle members to leave wishes`,
        description: `${member.full_name}'s birthday is in 3 days. Send invitations to their circle members so wishes are ready for the big day. Members can leave messages at /dashboard/celebrations.`,
        priority: 'low',
        category: 'birthday_arc',
        status: 'pending',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }).then(({ error: _e }: { error: unknown }) => void _e)
    }

    // D-1: family reminder with link to send a card/gift
    if (!inGrief && isBirthdayInNDays(member.date_of_birth, 1, today)) {
      results.push(`D-1 arc (family reminder): ${member.full_name}`)

      // Get family members with SMS/email contact
      const { data: family } = await supabase
        .from('family_members')
        .select('id, name, email, phone, preferred_contact_method')
        .eq('member_id', member.id)

      for (const fm of family ?? []) {
        // Queue a notification via the notification system
        await supabase.from('notifications').insert({
          user_id: fm.id,
          type: 'birthday_reminder',
          title: `${member.full_name}'s birthday is tomorrow!`,
          body: `Don't forget — you can send a card or gift from your family dashboard.`,
          metadata: {
            member_id: member.id,
            days_until: 1,
            action_url: '/family/dashboard/gifts',
          },
          read: false,
        }).then(({ error: _e }: { error: unknown }) => void _e)
      }
    }

    // D+1: compile thank-you card PDF from birthday wishes
    if (isBirthdayInNDays(member.date_of_birth, -1, today)) {
      results.push(`D+1 arc (thank-you card): ${member.full_name}`)

      // Count wishes collected
      const birthday = new Date(member.date_of_birth)
      const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
      // Yesterday was D-0
      const d0 = new Date(birthdayThisYear)
      d0.setDate(birthdayThisYear.getDate() - 1)
      const wishDateStr = d0.toISOString().split('T')[0]

      const { count: wishCount } = await supabase
        .from('celebration_messages')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('is_birthday_wish', true)
        .eq('wish_date', wishDateStr)

      if ((wishCount ?? 0) > 0) {
        // Queue navigator task to compile and send the thank-you card PDF
        await supabase.from('navigator_tasks').insert({
          member_id: member.id,
          title: `Compile birthday thank-you card for ${member.full_name}`,
          description: `${wishCount} community wishes were left for ${member.full_name}'s birthday. Compile them into a thank-you card PDF and share it with the member.`,
          priority: 'low',
          category: 'birthday_arc',
          status: 'pending',
        }).then(({ error: _e }: { error: unknown }) => void _e)

        // Mark wishes as compiled
        await supabase
          .from('celebration_messages')
          .update({ compiled_in_pdf: true })
          .eq('member_id', member.id)
          .eq('is_birthday_wish', true)
          .eq('wish_date', wishDateStr)
      }
    }

    // ── G7.6 Milestone birthday programs ───────────────────────────────────

    // Check 30 days (and 60 days for age 100) before each milestone age
    const { data: milestones } = await supabase
      .from('milestone_birthday_programs')
      .select('*')
      .eq('enabled', true)

    for (const milestone of milestones ?? []) {
      const daysAhead = milestone.action_days_before as number
      if (!isBirthdayInNDays(member.date_of_birth, daysAhead, today)) continue

      const ageAtBirthday = ageOnDate(
        member.date_of_birth,
        new Date(
          today.getFullYear(),
          new Date(member.date_of_birth).getMonth(),
          new Date(member.date_of_birth).getDate()
        )
      )

      if (ageAtBirthday !== milestone.age) continue

      results.push(`Milestone ${milestone.age}: ${member.full_name}`)

      // Check if we already created this milestone task this year
      const { count: existing } = await supabase
        .from('navigator_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('category', 'milestone_birthday')
        .gte('created_at', `${today.getFullYear()}-01-01`)

      if ((existing ?? 0) > 0) continue

      let taskTitle = ''
      let taskDesc = ''

      switch (milestone.action_type) {
        case 'navigator_task':
          taskTitle = `Age ${milestone.age} milestone — ${milestone.offering}`
          taskDesc = `${member.full_name} turns ${milestone.age} in ${daysAhead} days. ${milestone.offering}`
          break
        case 'navigator_call':
          taskTitle = `Schedule milestone call — ${member.full_name} turning ${milestone.age}`
          taskDesc = `${member.full_name} turns ${milestone.age} in ${daysAhead} days. ${milestone.offering}`
          break
        case 'joy_call':
          taskTitle = `Schedule Joy's milestone interview call — ${member.full_name} turning ${milestone.age}`
          taskDesc = `${member.full_name} turns ${milestone.age} in ${daysAhead} days. Joy should call and ask life-story questions (with member consent). Recording saved to life story.`
          break
        case 'community_event':
          taskTitle = `Create community toast event — ${member.full_name} turning ${milestone.age}!`
          taskDesc = `${member.full_name} is turning ${milestone.age}! Create a community toast event and optionally request a mayor/governor greeting letter. ${milestone.offering}`
          break
        default:
          taskTitle = `Milestone birthday — ${member.full_name} turning ${milestone.age}`
          taskDesc = milestone.offering as string
      }

      await supabase.from('navigator_tasks').insert({
        member_id: member.id,
        title: taskTitle,
        description: taskDesc,
        priority: milestone.age >= 90 ? 'high' : 'medium',
        category: 'milestone_birthday',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metadata: {
          milestone_age: milestone.age,
          action_type: milestone.action_type,
        },
      }).then(({ error: _e }: { error: unknown }) => void _e)
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}

// POST is the standard Vercel cron invocation method.
// Delegate to GET logic after auth check.
export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET && req.headers.get('authorization')?.replace('Bearer ', '') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return GET(req)
}
