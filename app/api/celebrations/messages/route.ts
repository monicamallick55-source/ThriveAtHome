/**
 * app/api/celebrations/messages/route.ts — G7.4/G7.5
 *
 * POST /api/celebrations/messages — leave a birthday wish or celebration message
 * GET  /api/celebrations/messages — get messages for a celebration or birthday
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const celebrationId = searchParams.get('celebration_id')
  const memberId = searchParams.get('member_id')
  const wishDate = searchParams.get('wish_date')

  let query = supabase
    .from('celebration_messages')
    .select('*')
    .order('created_at', { ascending: true })

  if (celebrationId) query = query.eq('celebration_id', celebrationId)
  if (memberId && wishDate) {
    query = query
      .eq('member_id', memberId)
      .eq('is_birthday_wish', true)
      .eq('wish_date', wishDate)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    celebration_id,
    member_id,
    author_name,
    message,
    media_url,
    is_birthday_wish = false,
    wish_date,
  } = body

  if (!author_name || !message) {
    return NextResponse.json({ error: 'author_name and message required' }, { status: 400 })
  }

  if (!celebration_id && (!member_id || !is_birthday_wish)) {
    return NextResponse.json({ error: 'Either celebration_id or (member_id + is_birthday_wish) required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('celebration_messages')
    .insert({
      celebration_id: celebration_id ?? null,
      member_id: member_id ?? null,
      author_id: user.id,
      author_name,
      message,
      media_url: media_url ?? null,
      is_birthday_wish,
      wish_date: wish_date ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}
