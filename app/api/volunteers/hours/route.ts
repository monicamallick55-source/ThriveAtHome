import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

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
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const db = createAdminClient() as any
  const { data: volunteer } = await db.from('volunteers').select('id, status').eq('email', user.email).maybeSingle()
  if (!volunteer) return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 404 })
  if (volunteer.status !== 'active') return NextResponse.json({ error: 'Volunteer account not active' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    hours?: number; activity_date?: string; date?: string;
    activity_type?: string; description?: string; notes?: string; assignment_id?: string
  }

  const hours = body.hours
  if (!hours || hours <= 0) return NextResponse.json({ error: 'hours required' }, { status: 400 })
  const activityDate = body.activity_date || body.date || new Date().toISOString().slice(0, 10)

  const { data, error } = await db.from('volunteer_hours').insert({
    volunteer_id: volunteer.id,
    hours,
    activity_date: activityDate,
    activity_type: body.activity_type ?? 'general',
    description: body.description || body.notes || null,
    assignment_id: body.assignment_id ?? null,
    verified: false,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 })
}
