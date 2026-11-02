// app/api/circles/[id]/posts/route.ts
// GET  — list posts in a circle (must be a member)
// POST — create a post

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Verify membership
  const { data: membership } = await db
    .from('circle_memberships')
    .select('id')
    .eq('circle_id', circleId)
    .eq('member_id', member.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const { data: posts, error } = await db
    .from('circle_posts')
    .select('id, body, created_at, is_pinned, reply_to, author_id, members!circle_posts_author_id_fkey(preferred_name, full_name)')
    .eq('circle_id', circleId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: posts ?? [], offset, limit })
}

export async function POST(req: Request, { params }: Params) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Verify membership
  const { data: membership } = await db
    .from('circle_memberships').select('id').eq('circle_id', circleId).eq('member_id', member.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as { body?: string; reply_to?: string }
  const text = (body.body ?? '').trim().slice(0, 1000)
  if (!text) return NextResponse.json({ error: 'Body required' }, { status: 400 })

  const { data: post, error } = await db
    .from('circle_posts')
    .insert({ circle_id: circleId, author_id: member.id, body: text, reply_to: body.reply_to ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post }, { status: 201 })
}
