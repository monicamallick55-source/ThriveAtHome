/**
 * app/api/cron/gift-reminders/route.ts — Gift Reminder Cron
 *
 * Triggered by Vercel Cron (daily at 8am UTC).
 * Finds upcoming birthdays and anniversaries within the next 7 days
 * and sends reminder notifications to family members who might
 * want to send a gift through the gift-orders system.
 *
 * Also sends pre-holiday reminders (Thanksgiving, Christmas, Mother's/Father's Day).
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

// Holidays: [month (1-based), day, label, days_before_to_remind]
const HOLIDAYS: Array<[number, number, string, number]> = [
  [11, 28, "Thanksgiving",   14],
  [12, 25, "Christmas",      21],
  [5,   8, "Mother's Day",   10],
  [6,  16, "Father's Day",   10],
  [2,  14, "Valentine's Day",  7],
]

function isWithinDays(targetMonth: number, targetDay: number, daysAhead: number): boolean {
  const now = new Date()
  const year = now.getFullYear()
  let target = new Date(year, targetMonth - 1, targetDay)
  if (target < now) target = new Date(year + 1, targetMonth - 1, targetDay)
  const diff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= daysAhead
}

export async function GET(req: NextRequest) {
  // Auth: Vercel sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date()
    const reminded: string[] = []

    // ── 1. Birthday reminders ──────────────────────────────────────────────
    // Find members whose birthday is within 7 days
    const { data: members } = await supabase
      .from('members')
      .select('id, first_name, last_name, date_of_birth')
      .not('date_of_birth', 'is', null)

    for (const member of members ?? []) {
      if (!member.date_of_birth) continue
      const dob = new Date(member.date_of_birth)
      const bMonth = dob.getMonth() + 1
      const bDay = dob.getDate()

      if (!isWithinDays(bMonth, bDay, 7)) continue

      // Find family members for this member
      const { data: familyLinks } = await supabase
        .from('family_member_links')
        .select('family_member_id, family_members(id, name, email, user_id)')
        .eq('member_id', member.id)

      for (const link of familyLinks ?? []) {
        const fm = (link as any).family_members
        if (!fm?.user_id) continue

        // Check if we've already sent this reminder this week
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', fm.user_id)
          .eq('type', 'gift_reminder_birthday')
          .eq('related_id', member.id)
          .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (existing && existing.length > 0) continue

        await supabase.from('notifications').insert({
          user_id: fm.user_id,
          type: 'gift_reminder_birthday',
          related_id: member.id,
          title: `🎂 ${member.first_name}'s birthday is coming up!`,
          body: `${member.first_name}'s birthday is in 7 days. Send a gift or card through ThriveAtHome.`,
          action_url: '/dashboard/gifts',
          read: false,
        })

        reminded.push(`birthday:${member.id}:${fm.user_id}`)
      }
    }

    // ── 2. Holiday reminders ───────────────────────────────────────────────
    for (const [month, day, label, daysBefore] of HOLIDAYS) {
      if (!isWithinDays(month, day, daysBefore)) continue

      // Get all family member users
      const { data: familyUsers } = await supabase
        .from('family_members')
        .select('id, user_id, name')
        .not('user_id', 'is', null)

      for (const fm of familyUsers ?? []) {
        if (!fm.user_id) continue

        // Check if already sent this holiday reminder this season
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', fm.user_id)
          .eq('type', 'gift_reminder_holiday')
          .ilike('title', `%${label}%`)
          .gte('created_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (existing && existing.length > 0) continue

        await supabase.from('notifications').insert({
          user_id: fm.user_id,
          type: 'gift_reminder_holiday',
          related_id: null,
          title: `🎁 ${label} is coming up!`,
          body: `Send a gift or card to your loved one for ${label} through ThriveAtHome.`,
          action_url: '/dashboard/gifts',
          read: false,
        })

        reminded.push(`holiday:${label}:${fm.user_id}`)
      }
    }

    return NextResponse.json({
      ok: true,
      reminded_count: reminded.length,
      reminded,
      ran_at: now.toISOString(),
    })
  } catch (err: any) {
    console.error('[gift-reminders cron]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
