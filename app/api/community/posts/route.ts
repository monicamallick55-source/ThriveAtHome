import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const circleId = searchParams.get('circle_id')

  const query = supabase
    .from('community_posts')
    .select('id, content, created_at, author_id, members(first_name, last_name, preferred_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (circleId) query.eq('circle_id', circleId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { content, circle_id } = body
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('community_posts')
    .insert({ content, circle_id, author_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}
