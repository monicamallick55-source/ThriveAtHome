// app/api/birthday-arc/route.ts
// GET  — upcoming birthdays within N days (navigator/staff)
// POST — send a birthday message to a member

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '30'), 90)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Get members with birth_date set
  const { data: members, error } = await admin
    .from('members')
    .select('id, full_name, preferred_name, birth_date, birth_date_year_hidden, status')
    .not('birth_date', 'is', null)
    .eq('status', 'active')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calculate upcoming birthdays
  const today = new Date()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()
  const todayDayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

  const upcoming = ((members ?? []) as Array<{
    id: string; full_name: string; preferred_name: string | null
    birth_date: string; birth_date_year_hidden: boolean; status: string
  }>)
    .map(m => {
      const [, month, day] = m.birth_date.split('-').map(Number)
      // Next birthday this year or next
      let nextBirthday = new Date(today.getFullYear(), month - 1, day)
      if (nextBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, month - 1, day)
      }
      const daysUntil = Math.floor((nextBirthday.getTime() - today.getTime()) / 86400000)
      const birthYear = m.birth_date_year_hidden ? null : parseInt(m.birth_date.split('-')[0])
      const age = birthYear ? nextBirthday.getFullYear() - birthYear : null

      return {
        member_id: m.id,
        full_name: m.full_name,
        preferred_name: m.preferred_name,
        birth_month: month,
        birth_day: day,
        birth_date: m.birth_date,
        age,
        days_until: daysUntil,
        is_today: daysUntil === 0,
        next_birthday: nextBirthday.toISOString().split('T')[0],
      }
    })
    .filter(m => m.days_until <= days)
    .sort((a, b) => a.days_until - b.days_until)

  // Load already-sent messages this year
  const currentYear = today.getFullYear()
  const { data: sentMessages } = await admin
    .from('birthday_messages')
    .select('member_id')
    .eq('birthday_year', currentYear)

  const sentSet = new Set(((sentMessages ?? []) as Array<{ member_id: string }>).map(m => m.member_id))

  const result = upcoming.map(m => ({
    ...m,
    message_sent_this_year: sentSet.has(m.member_id),
  }))

  return NextResponse.json({ birthdays: result, days_window: days })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { member_id, message, delivery_method = 'in_app' } = body as {
    member_id?: string; message?: string; delivery_method?: string
  }

  if (!member_id || !message?.trim()) {
    return NextResponse.json({ error: 'member_id and message required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: fm } = await supabase
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const currentYear = new Date().getFullYear()

  const { data: msg, error } = await admin
    .from('birthday_messages')
    .insert({
      member_id,
      sent_by: fm?.id ?? null,
      message: message.trim(),
      delivery_method,
      birthday_year: currentYear,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the member via realtime_notifications
  await admin.from('realtime_notifications').insert({
    type: 'birthday_message',
    title: '🎂 Happy Birthday!',
    body: message.trim(),
    severity: 'info',
    member_id,
  }).catch(() => null)

  // Award the 'welcome' achievement if it triggers birthday engagement — no-op if already awarded
  return NextResponse.json({ message: msg }, { status: 201 })
}
