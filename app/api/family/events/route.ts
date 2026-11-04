import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('family_events')
    .select('*')
    .eq('member_id', memberId)
    .order('event_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, person_name, relationship, event_type, title, event_date, end_date, recurs_yearly, notes, aria_can_mention, mailing_address } = body

  if (!member_id || !person_name || !event_type || !title || !event_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Identify if requester is a family member
  const { data: fm } = await (supabase as any)
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', member_id)
    .maybeSingle()

  const { data, error } = await (supabase as any)
    .from('family_events')
    .insert({
      member_id,
      created_by: fm?.id ?? null,
      person_name,
      relationship,
      event_type,
      title,
      event_date,
      end_date: end_date || null,
      recurs_yearly: recurs_yearly ?? false,
      notes: notes || null,
      aria_can_mention: aria_can_mention ?? true,
      mailing_address: mailing_address || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await (supabase as any).from('family_events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}