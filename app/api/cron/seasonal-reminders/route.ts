import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const SEASON_TIPS: Record<string, string> = {
  '1': 'winter home safety check — heating system, carbon monoxide detector, slip hazards on steps',
  '4': 'spring home safety check — smoke detectors, outdoor walkways, medication review before summer',
  '7': 'summer safety check — cooling, hydration reminders, outdoor heat hazards',
  '10': 'fall home safety check — heating system, grab bars, lighting for shorter days',
}

// G5.1 — Medicare Open Enrollment: Oct 15 – Dec 7
// Reminder fires on Oct 15 (start) and Nov 15 (mid-period nudge)
function isMedicareOpenEnrollmentReminderDay(): boolean {
  const now = new Date()
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()
  return (month === 10 && day === 15) || (month === 11 && day === 15)
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
  const db = admin as any
  const month = String(new Date().getUTCMonth() + 1)
  const seasonTip = SEASON_TIPS[month] ?? 'seasonal home safety check'

  const { data: members, error } = await db
    .from('members')
    .select('id, full_name, date_of_birth')
    .eq('status', 'active')

  if (error) {
    console.error('[seasonal-reminders] Failed to fetch members:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = members?.length ?? 0
  console.log(`[seasonal-reminders] Sending ${seasonTip} reminders to ${count} active members`)

  // G5.1 — Medicare Open Enrollment reminder for members aged 65+
  let medicareReminderCount = 0
  if (isMedicareOpenEnrollmentReminderDay()) {
    const eligibleMembers = (members ?? []).filter((m: any) => {
      if (!m.date_of_birth) return false
      const age = Math.floor(
        (Date.now() - new Date(m.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
      return age >= 65
    })

    for (const member of eligibleMembers) {
      try {
        // Create a navigator task so no member is missed
        await db.from('navigator_tasks').insert({
          member_id: member.id,
          type: 'medicare_open_enrollment',
          title: 'Medicare Open Enrollment reminder',
          description: `Medicare Open Enrollment runs Oct 15 – Dec 7. Ask ${member.full_name ?? 'this member'} if they want help reviewing their plan. Connect with HICAP if needed.`,
          priority: 'low',
          status: 'open',
        })
        medicareReminderCount++
      } catch (err) {
        console.error('[seasonal-reminders] Medicare task error:', err)
      }
    }

    console.log(`[seasonal-reminders] Created ${medicareReminderCount} Medicare Open Enrollment tasks`)
  }

  // In production: send email/SMS to each family member via emailProvider
  // Currently stubs the notification — real send added when SendGrid is configured

  return NextResponse.json({
    sent: count,
    season_tip: seasonTip,
    medicare_enrollment_tasks_created: medicareReminderCount,
  })
}
