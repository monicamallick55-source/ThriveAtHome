import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiProvider } from '@/lib/providers'
import { runJoyCalls } from '@/lib/voice/outboundTriggers'
import {
  getExistingBirthdayCelebration,
  createCelebrationEvent,
  markCelebrationNotified,
  getNextBirthdayDate,
} from '@/lib/data/celebrations'

export const runtime = 'nodejs'

const BIRTHDAY_WINDOW_DAYS = 7

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log('[celebrations-cron] Starting at', new Date().toISOString())

  // 1 — Authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      console.error('[celebrations-cron] Unauthorized — header mismatch')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    console.warn('[celebrations-cron] CRON_SECRET not set — running unauthenticated')
  }

  // 2 — Validate required env vars before any DB work
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[celebrations-cron] Missing NEXT_PUBLIC_SUPABASE_URL')
    return NextResponse.json(
      { error: 'Server misconfiguration: NEXT_PUBLIC_SUPABASE_URL not set' },
      { status: 500 }
    )
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[celebrations-cron] Missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json(
      { error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    )
  }

  // 3 — Admin client
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
    console.log('[celebrations-cron] Admin client created')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[celebrations-cron] Failed to create admin client:', msg)
    return NextResponse.json(
      { error: `Admin client error: ${msg}` },
      { status: 500 }
    )
  }

  const results = {
    created: 0,
    notified: 0,
    skipped_exists: 0,
    skipped_no_dob: 0,
    skipped_outside_window: 0,
    errors: 0,
    error_details: [] as string[],
  }

  // 4 — Fetch active members
  console.log('[celebrations-cron] Fetching active members...')
  let members: Array<{
    id: string
    preferred_name: string
    full_name: string
    date_of_birth: string | null
  }> = []

  try {
    const { data, error: membersError } = await admin
      .from('members')
      .select('id, preferred_name, full_name, date_of_birth')
      .eq('status', 'active')

    if (membersError) {
      console.error('[celebrations-cron] DB error fetching members:', membersError)
      return NextResponse.json(
        {
          error: 'DB error fetching members',
          detail: membersError.message,
          code: membersError.code,
        },
        { status: 500 }
      )
    }

    members = data ?? []
    console.log(`[celebrations-cron] Found ${members.length} active members`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[celebrations-cron] Exception fetching members:', msg)
    return NextResponse.json(
      { error: `Exception fetching members: ${msg}` },
      { status: 500 }
    )
  }

  // 5 — Process each member
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  console.log(`[celebrations-cron] Today is ${todayStr}, window is ${BIRTHDAY_WINDOW_DAYS} days`)

  for (const member of members) {
    try {
      if (!member.date_of_birth) {
        results.skipped_no_dob++
        continue
      }

      // Compute next birthday
      let nextBirthday: Date
      try {
        nextBirthday = getNextBirthdayDate(member.date_of_birth)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`[celebrations-cron] Bad DOB for member ${member.id}: ${member.date_of_birth} — ${msg}`)
        results.errors++
        results.error_details.push(`member ${member.id}: invalid DOB '${member.date_of_birth}': ${msg}`)
        continue
      }

      const daysUntil = Math.round(
        (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntil < 0 || daysUntil > BIRTHDAY_WINDOW_DAYS) {
        results.skipped_outside_window++
        continue
      }

      const birthdayYear = nextBirthday.getFullYear()
      console.log(
        `[celebrations-cron] Member ${member.id} (${member.preferred_name ?? member.full_name}) ` +
        `birthday in ${daysUntil} day(s) — checking for existing row`
      )

      // Check for existing celebration event this year
      const { exists, error: checkError } = await getExistingBirthdayCelebration(
        member.id,
        birthdayYear
      )

      if (checkError) {
        console.error(
          `[celebrations-cron] Error checking existing for ${member.id}:`,
          checkError
        )
        results.errors++
        results.error_details.push(`member ${member.id}: check existing failed: ${checkError}`)
        continue
      }

      if (exists) {
        console.log(`[celebrations-cron] Already exists for ${member.id} year ${birthdayYear} — skipping`)
        results.skipped_exists++
        continue
      }

      // Generate AI message (stub in dev)
      let aiMessage = ''
      try {
        const memberForAi = {
          id: member.id,
          preferred_name: member.preferred_name ?? member.full_name,
          full_name: member.full_name,
          date_of_birth: member.date_of_birth,
          phone_number: '',
          preferred_language: 'english',
          topics_enjoy: [],
          health_conditions: null,
          medications: null,
          plan_tier: 'basics',
        }
        aiMessage = await aiProvider.generateCelebrationPersonalisation(memberForAi, 'birthday')
        console.log(`[celebrations-cron] AI message generated for ${member.id}: "${aiMessage.slice(0, 50)}..."`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn(`[celebrations-cron] AI message failed for ${member.id}: ${msg} — using default`)
        aiMessage = `Happy birthday, ${member.preferred_name ?? member.full_name}!`
      }

      // Create celebration event
      const birthdayDateStr = nextBirthday.toISOString().slice(0, 10)
      const { data: celebration, error: createError } = await createCelebrationEvent({
        member_id: member.id,
        celebration_type: 'birthday',
        event_date: birthdayDateStr,
        status: daysUntil === 0 ? 'today' : 'scheduled',
        ai_message: aiMessage,
      })

      if (createError || !celebration) {
        console.error(
          `[celebrations-cron] Failed to create celebration_events row for ${member.id}:`,
          createError
        )
        results.errors++
        results.error_details.push(
          `member ${member.id}: create celebration failed: ${createError ?? 'no data returned'}`
        )
        continue
      }

      results.created++
      console.log(`[celebrations-cron] Created celebration event ${celebration.id} for ${member.id}`)

      // Push realtime notification to each family member
      const { data: familyMembers, error: fmError } = await admin
        .from('family_members')
        .select('id')
        .eq('member_id', member.id)

      if (fmError) {
        console.warn(
          `[celebrations-cron] Could not fetch family members for ${member.id}:`,
          fmError.message
        )
      }

      if (!familyMembers?.length) {
        console.log(`[celebrations-cron] No family members for ${member.id} — no notification sent`)
        continue
      }

      const memberName = member.preferred_name ?? member.full_name
      const notifTitle =
        daysUntil === 0
          ? `Today is ${memberName}'s birthday!`
          : `${memberName}'s birthday is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
      const notifBody =
        daysUntil === 0
          ? `Wishing ${memberName} a wonderful birthday today!`
          : `Plan ahead to make ${memberName}'s day extra special.`

      const { error: notifError } = await (admin as any).from('realtime_notifications').insert({
        member_id: member.id,
        type: 'celebration_upcoming',
        severity: 'info',
        title: notifTitle,
        body: notifBody,
      })

      if (notifError) {
        console.error(
          `[celebrations-cron] Failed to insert realtime notification for ${member.id}:`,
          notifError.message,
          'code:', notifError.code
        )
        results.error_details.push(
          `member ${member.id}: notification insert failed: ${notifError.message} (code: ${notifError.code})`
        )
      } else {
        await markCelebrationNotified(celebration.id)
        results.notified++
        console.log(`[celebrations-cron] Notification sent for ${member.id}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[celebrations-cron] Unexpected error for member ${member.id}:`, msg)
      results.errors++
      results.error_details.push(`member ${member.id}: unexpected error: ${msg}`)
    }
  }

  // 6 — Joy celebration calls for today's events (opted-in members, grief-aware)
  let joy: Awaited<ReturnType<typeof runJoyCalls>> | null = null
  try {
    joy = await runJoyCalls()
  } catch (e) {
    console.error('[celebrations-cron] Joy calls failed:', e)
  }

  const elapsed = Date.now() - startTime
  const summary = { success: true, elapsed_ms: elapsed, ...results, joy }
  console.log('[celebrations-cron] Complete:', JSON.stringify(summary))
  return NextResponse.json(summary)
}
