/**
 * app/api/community-partners/route.ts — G6.0
 *
 * GET  /api/community-partners  — list active partners (members) or all (staff)
 * POST /api/community-partners  — staff creates/confirms a partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const county = searchParams.get('county')

  let query = supabase
    .from('community_partners')
    .select('*')
    .order('name')

  if (category) query = query.eq('category', category)
  if (county) query = query.contains('service_counties', [county])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partners: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Only staff can create/update partners
  // (enforced by RLS policy cp_staff_write, but also check here for clear 403)
  const { data: staff } = await supabase
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const isStaff = staff?.role === 'staff' || staff?.role === 'admin'
  if (!isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const { data, error } = await supabase
    .from('community_partners')
    .insert({
      name: body.name,
      category: body.category,
      description: body.description,
      service_counties: body.service_counties ?? [],
      service_zip_prefixes: body.service_zip_prefixes ?? [],
      phone: body.phone,
      website: body.website,
      referral_method: body.referral_method ?? 'warm_call',
      referral_email: body.referral_email,
      eligibility_notes: body.eligibility_notes,
      cost_to_member: body.cost_to_member,
      status: body.status ?? 'pending_confirmation',
      mou_signed: body.mou_signed ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partner: data }, { status: 201 })
}
