import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostComments, addPostComment } from '@/lib/data/circles-comments'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const { data, error } = await getPostComments(postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Member not found' }, { status: 403 })

  const body = await req.json()
  const content = (body.content ?? '').trim()
  if (!content || content.length > 1000) return NextResponse.json({ error: 'Invalid content' }, { status: 400 })

  const { data, error } = await addPostComment(fm.member_id, postId, content)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
