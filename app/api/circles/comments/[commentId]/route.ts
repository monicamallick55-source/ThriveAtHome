// app/api/circles/comments/[commentId]/route.ts
// DELETE — remove a comment (own comment, or staff)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deletePostComment } from '@/lib/data/circles'

async function resolveMemberContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (fm?.member_id) return { memberId: fm.member_id as string, role: fm.role as string }

  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (m?.id) return { memberId: m.id as string, role: 'member' }

  return null
}

// ── DELETE /api/circles/comments/[commentId] ──────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const { commentId } = await params
  const supabase = await createClient()

  // 1. Auth
  const ctx = await resolveMemberContext(supabase)
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Check ownership (staff may delete any comment)
  const isStaff = ctx.role === 'admin' || ctx.role === 'navigator'
  if (!isStaff) {
    const admin = createAdminClient()
    const { data: comment } = await admin
      .from('circle_post_comments')
      .select('member_id')
      .eq('id', commentId)
      .maybeSingle()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (comment.member_id !== ctx.memberId) {
      return NextResponse.json({ error: 'Cannot delete another member\'s comment' }, { status: 403 })
    }
  }

  // 3. Delete (RLS also enforces ownership at the DB level)
  const { error } = await deletePostComment(commentId)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
