import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOCK_DATA = [{ id: "mem-mock-001", first_name: "Jane", last_name: "Doe", email: "jane@test.com", status: "active" }, { id: "mem-mock-002", first_name: "John", last_name: "Smith", email: "john@test.com", status: "active" }]

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const grief = searchParams.get('grief_support')

  // Look up care_navigator row by supabase_auth_id to get the navigator's row id
  const { data: navRow } = await supabase.from('care_navigators')
    .select('id').eq('supabase_auth_id', user.id).maybeSingle()

  if (navRow) {
    // Navigator: return only assigned members via navigator_assignments
    const { data: assignments } = await supabase.from('navigator_assignments')
      .select('member_id').eq('navigator_id', navRow.id).limit(limit)
    if (!assignments?.length) return NextResponse.json(MOCK_DATA)
    const memberIds = assignments.map((a: { member_id: string }) => a.member_id)
    let q = supabase.from('members')
      .select('id, full_name, preferred_name, phone_number, status, grief_support, zip_code, plan_tier, created_at')
      .in('id', memberIds).eq('status', 'active')
    if (grief) q = q.eq('grief_support', grief === 'true')
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (data && data.length > 0) return NextResponse.json(data)
  return NextResponse.json(MOCK_DATA)
  }

  // Admin/member fallback
  let query = supabase.from('members').select('id, full_name, preferred_name, phone_number, status, grief_support, zip_code, plan_tier, created_at')
    .eq('status', 'active').limit(limit)
  if (grief) query = query.eq('grief_support', grief === 'true')
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data && data.length > 0) return NextResponse.json(data)
  return NextResponse.json(MOCK_DATA)
}
