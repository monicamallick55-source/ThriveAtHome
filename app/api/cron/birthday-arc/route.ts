// app/api/cron/birthday-arc/route.ts
// G5.4 — Daily cron: fire birthday arc steps for all members
// Vercel cron: "0 10 * * *" (10am UTC = 2am PT, well before any member's day starts)

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'hello@thriveathome.com'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.log('[birthday-arc] No RESEND_API_KEY, skipping email to', to); return }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
}

function daysUntilBirthday(dob: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const bday = new Date(dob)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1)
  return Math.round((thisYear.getTime() - today.getTime()) / 86400000)
}

function ageThisYear(dob: string): number {
  const today = new Date()
  const bday = new Date(dob)
  return today.getFullYear() - bday.getFullYear()
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const year = new Date().getFullYear()
  const fired: string[] = []

  // Fetch all active members with DOB, not opted out
  const { data: members } = await db
    .from('members')
    .select('id, full_name, preferred_name, date_of_birth, celebration_opt_out')
    .eq('status', 'active')
    .eq('celebration_opt_out', false)
    .not('date_of_birth', 'is', null)

  for (const m of (members ?? [])) {
    const days = daysUntilBirthday(m.date_of_birth)
    const age = ageThisYear(m.date_of_birth)
    const name = m.preferred_name ?? m.full_name ?? 'the member'

    // Determine which step fires today
    let step: string | null = null
    if (days === 7)  step = 'd_minus_7'
    else if (days === 5) step = 'd_minus_5'
    else if (days === 3) step = 'd_minus_3'
    else if (days === 1) step = 'd_minus_1'
    else if (days === 0) step = 'd_day'
    else if (days === 364 || days === 365) {
      // d+1: check if yesterday was their birthday
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      const bday = new Date(m.date_of_birth)
      const wasYesterday = yesterday.getMonth() === bday.getMonth() && yesterday.getDate() === bday.getDate()
      if (wasYesterday) step = 'd_plus_1'
    }

    if (!step) continue

    // Idempotency check
    const { data: existing } = await db
      .from('birthday_arc_log')
      .select('id')
      .eq('member_id', m.id)
      .eq('year', year)
      .eq('step', step)
      .maybeSingle()
    if (existing) continue

    // Fetch family contacts for emails
    const { data: family } = await db
      .from('family_members')
      .select('email, full_name')
      .eq('member_id', m.id)
      .not('email', 'is', null)

    const familyEmails: string[] = (family ?? []).map((f: { email: string }) => f.email).filter(Boolean)

    // Fire the step
    if (step === 'd_minus_7') {
      // Email family with heads-up
      for (const email of familyEmails) {
        await sendEmail(email,
          `${name}'s birthday is in 7 days 🎂`,
          `<p>Hi! Just a reminder that ${name}'s birthday is coming up in one week.</p>
           <p>Visit the <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/celebrations">celebrations page</a> to leave a birthday wish or plan something special.</p>
           <p>— The ThriveAtHome Team</p>`
        )
      }
    }

    if (step === 'd_minus_5') {
      // Flag for Aria to mention in next check-in via navigator task
      await db.from('navigator_tasks').insert({
        type: 'birthday_aria_mention',
        member_id: m.id,
        priority: 'low',
        title: `Aria birthday mention: ${name}`,
        body: `${name}'s birthday is in 5 days. Aria should mention it warmly in the next check-in call.`,
        metadata: { birthday_year: year, age_turning: age },
        status: 'open',
      })
    }

    if (step === 'd_minus_3') {
      // Open community wishes — create navigator task to notify circle members
      await db.from('navigator_tasks').insert({
        type: 'birthday_wishes_open',
        member_id: m.id,
        priority: 'low',
        title: `Birthday wishes open: ${name}`,
        body: `${name}'s birthday is in 3 days. Community members can leave birthday wishes at /dashboard/celebrations.`,
        metadata: { birthday_year: year },
        status: 'open',
      })
    }

    if (step === 'd_minus_1') {
      // Reminder email to family with gift/card link
      for (const email of familyEmails) {
        await sendEmail(email,
          `${name}'s birthday is tomorrow! 🎉`,
          `<p>${name}'s birthday is tomorrow!</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/celebrations">Click here</a> to send a card, leave a birthday wish, or coordinate a gift.</p>
           <p>— The ThriveAtHome Team</p>`
        )
      }
    }

    if (step === 'd_day') {
      // Trigger Joy call + create birthday banner task
      await db.from('navigator_tasks').insert({
        type: 'birthday_joy_call',
        member_id: m.id,
        priority: 'high',
        title: `Birthday Joy call: ${name} turns ${age}`,
        body: `Today is ${name}'s ${age}th birthday. Trigger Joy agent call and display birthday banner on dashboards.`,
        metadata: { birthday_year: year, age_turning: age, joy_agent_id: process.env.RETELL_JOY_AGENT_ID },
        status: 'open',
      })

      // Check for milestone age program
      const { data: milestone } = await db
        .from('milestone_birthday_programs')
        .select('*')
        .eq('age', age)
        .maybeSingle()

      if (milestone) {
        await db.from('navigator_tasks').insert({
          type: 'milestone_birthday',
          member_id: m.id,
          priority: 'high',
          title: `Milestone birthday ${age}: ${name}`,
          body: `${name} turns ${age} today. Program: ${milestone.title} — ${milestone.description}`,
          metadata: { birthday_year: year, age, offering: milestone.offering, auto_create_event: milestone.auto_create_event },
          status: 'open',
        })
      }
    }

    if (step === 'd_plus_1') {
      // Thank-you: compile wishes into summary for family
      const { data: wishes } = await db
        .from('birthday_wishes')
        .select('author_name, message')
        .eq('member_id', m.id)
        .eq('year', year)
        .eq('is_approved', true)

      const wishList = (wishes ?? []) as Array<{ author_name: string; message: string }>
      const wishesHtml = wishList.length > 0
        ? `<ul>${wishList.map(w => `<li><strong>${w.author_name}:</strong> ${w.message}</li>`).join('')}</ul>`
        : '<p>No community wishes were recorded this year.</p>'

      for (const email of familyEmails) {
        await sendEmail(email,
          `How was ${name}'s birthday? 🎂`,
          `<p>We hope ${name} had a wonderful birthday!</p>
           <p>Here are the birthday wishes from the ThriveAtHome community:</p>
           ${wishesHtml}
           <p>— The ThriveAtHome Team</p>`
        )
      }
    }

    // Log the step
    await db.from('birthday_arc_log').insert({
      member_id: m.id,
      year,
      step,
      sent_at: new Date().toISOString(),
    })

    fired.push(`${m.full_name} (${step})`)
  }

  return NextResponse.json({ fired, count: fired.length, ran_at: new Date().toISOString() })
}
