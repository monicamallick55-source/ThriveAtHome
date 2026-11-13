import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { employees, org_id } = body
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  const list = Array.isArray(employees) ? employees : [body]
  const inserts = list.map((emp: Record<string, unknown>) => ({ org_id, email: emp.email, first_name: emp.first_name || null, last_name: emp.last_name || null, status: 'invited', enrolled_by: user.id, created_at: new Date().toISOString() }))
  const { data, error } = await supabase.from('org_members').insert(inserts).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ enrolled: data?.length || 0, data }, { status: 201 })
}
