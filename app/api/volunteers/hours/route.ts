// app/api/volunteers/hours/route.ts
// POST — log volunteer hours; GET — own hours summary

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: volunteer } = await db.from('volunteers').select('id, total_hours').eq('email', user.email).maybeSingle()
  if (!volunteer) return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 404 })

  const { data: hours } = await db
    .from('volunteer_hours')
    .select('id, hours, activity_date, description, verified, assignment_id')
    .eq('volunteer_id', volunteer.id)
    .order('activity_date', { ascending: false })
    .limit(30)

  return NextResponse.json({ total_hours: volunteer.total_hours, recent: hours ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: volunteer } = await db.from('volunteers').select('id, status').eq('email', user.email).maybeSingle()
  if (!volunteer) return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 404 })
  if (volunteer.status !== 'active') return NextResponse.json({ error: 'Volunteer account not active' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    hours?: number
    activity_date?: string
    description?: string
    assignment_id?: string
    member_id?: string
  }

  const hours = Number(body.hours)
  if (!hours || hours <= 0 || hours > 24) return NextResponse.json({ error: 'hours must be 0–24' }, { status: 400 })
  if (!body.activity_date) return NextResponse.json({ error: 'activity_date required (YYYY-MM-DD)' }, { status: 400 })

  const { data: entry, error } = await db
    .from('volunteer_hours')
    .insert({
      volunteer_id: volunteer.id,
      assignment_id: body.assignment_id ?? null,
      member_id: body.member_id ?? null,
      hours,
      activity_date: body.activity_date,
      description: body.description ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry }, { status: 201 })
}
