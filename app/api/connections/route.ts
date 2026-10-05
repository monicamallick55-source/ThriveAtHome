import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })

  const { data, error } = await supabase
    .from('member_connections')
    .select('*, requester:members!requester_id(id,full_name,preferred_name,avatar_url), addressee:members!addressee_id(id,full_name,preferred_name,avatar_url)')
    .or(`requester_id.eq.${fm.member_id},addressee_id.eq.${fm.member_id}`)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })

  const { addresseeId } = await req.json()
  if (!addresseeId) return NextResponse.json({ error: 'addresseeId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('member_connections')
    .insert({ requester_id: fm.member_id, addressee_id: addresseeId })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
