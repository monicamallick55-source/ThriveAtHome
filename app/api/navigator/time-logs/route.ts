// app/api/navigator/time-logs/route.ts
// GET  — list time logs (staff: all or filtered; navigator: own)
// POST — log time for a member interaction

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  const navigatorId = searchParams.get('navigator_id')
  const approved = searchParams.get('approved')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any
  const { data: isStaff } = await supabase.rpc('is_staff')

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  let query = (admin as any)
    .from('navigator_time_logs')
    .select(`
      id, created_at, logged_at, duration_minutes, activity_type,
      notes, billable, approved, approved_at,
      navigator_id, member_id,
      navigator:navigator_id(id, full_name),
      member:member_id(id, full_name, preferred_name)
    `)
    .order('logged_at', { ascending: false })

  if (!isStaff) {
    // Navigator can only see their own logs
    if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    query = query.eq('navigator_id', fm.id)
  } else {
    if (memberId) query = query.eq('member_id', memberId)
    if (navigatorId) query = query.eq('navigator_id', navigatorId)
  }

  if (approved !== null && approved !== undefined) {
    query = query.eq('approved', approved === 'true')
  }
  if (from) query = query.gte('logged_at', from)
  if (to) query = query.lte('logged_at', to)

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute totals
  const logs = (data ?? []) as Array<{ duration_minutes: number; billable: boolean; approved: boolean }>
  const totalMinutes = logs.reduce((s: any, l: any) => s + l.duration_minutes, 0)
  const billableMinutes = logs.filter(l => l.billable).reduce((s: any, l: any) => s + l.duration_minutes, 0)
  const approvedMinutes = logs.filter(l => l.approved).reduce((s: any, l: any) => s + l.duration_minutes, 0)

  return NextResponse.json({
    logs: data ?? [],
    totals: { total_minutes: totalMinutes, billable_minutes: billableMinutes, approved_minutes: approvedMinutes },
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const {
    member_id, duration_minutes, activity_type = 'check_in',
    notes, billable = true, logged_at, navigator_id,
  } = body as {
    member_id?: string; duration_minutes?: number; activity_type?: string
    notes?: string; billable?: boolean; logged_at?: string; navigator_id?: string
  }

  if (!member_id || !duration_minutes || duration_minutes <= 0) {
    return NextResponse.json({ error: 'member_id and duration_minutes (>0) required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  const resolvedNavigatorId = isStaff && navigator_id ? navigator_id : fm?.id
  if (!resolvedNavigatorId) return NextResponse.json({ error: 'No navigator identity' }, { status: 400 })

  const { data: log, error } = await db
    .from('navigator_time_logs')
    .insert({
      navigator_id: resolvedNavigatorId,
      member_id,
      duration_minutes,
      activity_type,
      notes: notes ?? null,
      billable,
      logged_at: logged_at ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log }, { status: 201 })
}
