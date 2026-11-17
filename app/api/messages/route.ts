import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: fm } = await supabase
    .from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })

  const withId = req.nextUrl.searchParams.get('with')
  let query = supabase
    .from('direct_messages')
    .select('*, sender:members!sender_id(id,full_name,preferred_name,avatar_url)')
    .or(`sender_id.eq.${fm.member_id},recipient_id.eq.${fm.member_id}`)
    .order('created_at', { ascending: true })

  if (withId) {
    query = supabase
      .from('direct_messages')
      .select('*, sender:members!sender_id(id,full_name,preferred_name,avatar_url)')
      .or(`and(sender_id.eq.${fm.member_id},recipient_id.eq.${withId}),and(sender_id.eq.${withId},recipient_id.eq.${fm.member_id})`)
      .order('created_at', { ascending: true })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: fm } = await supabase
    .from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })

  const { recipientId, content } = await req.json()
  if (!recipientId || !content?.trim()) return NextResponse.json({ error: 'recipientId and content required' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: fm.member_id, recipient_id: recipientId, content: content.trim() })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
