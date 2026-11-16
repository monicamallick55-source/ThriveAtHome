import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing env' }, { status: 500 })
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const body = await req.json().catch(() => ({}))
  const { email, first_name, last_name, department } = body
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const { data: listData } = await admin.auth.admin.listUsers()
  let authId: string
  const existing = listData?.users?.find((x: any) => x.email === email)
  if (existing) {
    authId = existing.id
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password: 'TempPass123!', email_confirm: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    authId = (data as any).user.id
  }
  const { data: existing_member } = await admin.from('members').select('id').eq('supabase_auth_id', authId).maybeSingle()
  if (existing_member) return NextResponse.json({ id: existing_member.id, member_id: existing_member.id, email, enrolled: true })
  const { data: member, error: mErr } = await admin.from('members').insert({
    supabase_auth_id: authId,
    full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim() || email,
    preferred_name: first_name ?? email.split('@')[0],
    date_of_birth: '1960-01-01',
    phone_number: '555-0000',
    preferred_language: 'english',
    timezone: 'America/New_York',
    check_in_frequency: 'daily',
    plan_tier: 'basics',
    status: 'active',
  }).select().single()
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  return NextResponse.json({ id: member.id, member_id: member.id, email, department, enrolled: true }, { status: 201 })
}
