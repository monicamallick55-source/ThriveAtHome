import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const body = await req.json()
  const { contribution_type, amount_cents, volunteer_date, in_kind_description, message, anonymous, contributor_member_id } = body
  const { data, error } = await supabase
    .from('campaign_contributions')
    .insert({
      campaign_id: params.id,
      contributor_member_id,
      contribution_type,
      amount_cents: contribution_type === 'financial' ? amount_cents : null,
      volunteer_date: contribution_type === 'volunteer' ? volunteer_date : null,
      in_kind_description: contribution_type === 'in_kind' ? in_kind_description : null,
      message,
      anonymous: anonymous ?? false,
      status: 'pending',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campaign_contributions')
    .select('*')
    .eq('campaign_id', params.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const masked = (data ?? []).map((c) => ({
    ...c,
    contributor_member_id: c.anonymous ? null : c.contributor_member_id,
  }))
  return NextResponse.json(masked)
}
