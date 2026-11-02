// app/api/members/[id]/birthday-wishes/route.ts
// GET  — fetch approved wishes for a member's current birthday year
// POST — submit a wish (family members or circle members)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: memberId } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const year = new Date().getFullYear()
  const { data: wishes, error } = await db
    .from('birthday_wishes')
    .select('id, author_name, message, created_at')
    .eq('member_id', memberId)
    .eq('year', year)
    .eq('is_approved', true)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ wishes: wishes ?? [], year })
}

export async function POST(req: Request, { params }: Params) {
  const { id: memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { message?: string }
  const message = (body.message ?? '').trim().slice(0, 500)
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const year = new Date().getFullYear()

  // Get author name from family_members
  const { data: author } = await db
    .from('family_members')
    .select('id, full_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const authorName = author?.full_name ?? 'A friend'
  const authorId = author?.id ?? null

  // Verify birthday arc is open (D-3 through D+1)
  const { data: member } = await db
    .from('members')
    .select('date_of_birth, celebration_opt_out')
    .eq('id', memberId)
    .maybeSingle()

  if (!member?.date_of_birth) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (member.celebration_opt_out) return NextResponse.json({ error: 'Member has opted out of celebrations' }, { status: 403 })

  const bday = new Date(member.date_of_birth)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  const daysUntil = Math.round((thisYearBday.getTime() - today.getTime()) / 86400000)
  // Allow wishes from D-3 through D+1
  if (daysUntil > 3 || daysUntil < -1) {
    return NextResponse.json({ error: 'Birthday wishes are only open from 3 days before to 1 day after the birthday' }, { status: 400 })
  }

  const { data: wish, error } = await db
    .from('birthday_wishes')
    .insert({ member_id: memberId, year, author_id: authorId, author_name: authorName, message })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ wish }, { status: 201 })
}
