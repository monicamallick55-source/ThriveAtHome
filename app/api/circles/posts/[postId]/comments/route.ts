import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostComments, addPostComment } from '@/lib/data/circles'

interface Ctx { params: Promise<{ postId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { postId } = await params
  const comments = await getPostComments(postId)
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'No member' }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const comment = await addPostComment(fm.member_id!, postId, content.trim())
  if (!comment) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  return NextResponse.json(comment, { status: 201 })
}
