import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(req.url)
  const circleId = searchParams.get('circle_id')

  const query = supabase
    .from('community_posts')
    .select('id, content, created_at, author_id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (circleId) query.eq('circle_id', circleId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Never expose author identity — posts are always anonymous in community
  const posts = (data ?? []).map(p => ({
    id: p.id,
    content: p.content,
    created_at: p.created_at,
    author_display: 'Community Member',
  }))

  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { content, circle_id } = body
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('community_posts')
    .insert({ content, circle_id, author_id: user.id })
    .select('id, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: { ...data, author_display: 'Community Member' } }, { status: 201 })
}
