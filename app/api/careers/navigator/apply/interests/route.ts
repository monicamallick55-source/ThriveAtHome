// app/api/careers/interests/route.ts
// GET — list member's interests
// POST — express interest in an opportunity

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm?.member_id ? fm : null
}

export async function GET() {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: interests } = await (admin as any)
    .from('career_interests')
    .select('id, status, note, created_at, opportunity:career_opportunities(id, title, organization, work_type, location, pay, status)')
    .eq('member_id', fm.member_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ interests: interests ?? [] })
}

export async function POST(req: Request) {
  const fm = await resolveUser()
  if (!fm) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { opportunity_id, note } = body as { opportunity_id?: string; note?: string }
  if (!opportunity_id) return NextResponse.json({ error: 'opportunity_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Check opportunity is still active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opp } = await (admin as any)
    .from('career_opportunities')
    .select('id, status, title, organization, apply_url, apply_email')
    .eq('id', opportunity_id)
    .maybeSingle()

  if (!opp) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  if (opp.status !== 'active') return NextResponse.json({ error: 'This opportunity is no longer active' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: interest, error } = await (admin as any)
    .from('career_interests')
    .upsert({
      member_id: fm.member_id,
      opportunity_id,
      note: note ?? null,
      status: 'interested',
    }, { onConflict: 'member_id,opportunity_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ interest, apply_url: opp.apply_url, apply_email: opp.apply_email }, { status: 201 })
}
