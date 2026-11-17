import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const admin = createAdminClient()
  const { data: volRow } = await admin.from('volunteers')
    .select('id').eq('supabase_auth_id', user.id).maybeSingle()
  let query = admin.from('buddy_assignments').select('id, status, member_id, volunteer_id, created_at, end_reason, ended_at')
  if (volRow) query = query.eq('volunteer_id', volRow.id)
  if (status) query = query.eq('status', status)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  const { data, error } = await admin.from('buddy_assignments').insert({ ...body, created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
