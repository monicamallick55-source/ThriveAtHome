import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const { org_name, org_type = 'employer', admin_email, seat_count = 10, plan = 'b2b_standard' } = body
  if (!org_name || !admin_email) return NextResponse.json({ error: 'org_name and admin_email required' }, { status: 400 })
  const slug = org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name: org_name, slug, org_type, plan, seat_count, status: 'active', created_at: new Date().toISOString() })
    .select().single()
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
  return NextResponse.json({ org_id: org.id, org_name: org.name, admin_email, plan, seat_count, created: true }, { status: 201 })
}
