// app/api/circles/posts/[postId]/comments/route.ts
// GET  — list visible comments on a post (circle members only)
// POST — add a comment (must be a circle member; max 1 000 chars)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPostComments, addPostComment } from '@/lib/data/circles'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Resolve the member_id that the current auth session acts on.
 *  Works for both family-member sessions and direct member auth sessions. */
async function resolveMemberContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Family-member or navigator login
  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (fm?.member_id) return { memberId: fm.member_id as string, role: fm.role as string }

  // Direct member login (supabase_auth_id on members table)
  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (m?.id) return { memberId: m.id as string, role: 'member' }

  return null
}

/** Return true if the member belongs to the circle that owns this post. */
async function memberInCircle(postId: string, memberId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('circle_posts')
    .select('circle_id')
    .eq('id', postId)
    .maybeSingle()

  if (!post) return false

  const { data: membership } = await admin
    .from('circle_memberships')
    .select('id')
    .eq('circle_id', post.circle_id)
    .eq('member_id', memberId)
    .maybeSingle()

  return !!membership
}

// ── GET /api/circles/posts/[postId]/comments ──────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  const supabase = await createClient()

  // Must be authenticated
  const ctx = await resolveMemberContext(supabase)
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Must belong to the circle (RLS also enforces this, but we give a clean 403)
  const allowed = await memberInCircle(postId, ctx.memberId)
  if (!allowed && ctx.role !== 'admin' && ctx.role !== 'navigator') {
    return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })
  }

  const { data, error } = await getPostComments(postId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

// ── POST /api/circles/posts/[postId]/comments ─────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  const supabase = await createClient()

  // 1. Auth
  const ctx = await resolveMemberContext(supabase)
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Circle membership
  const allowed = await memberInCircle(postId, ctx.memberId)
  if (!allowed && ctx.role !== 'admin' && ctx.role !== 'navigator') {
    return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })
  }

  // 3. Validate input
  const body = await req.json().catch(() => ({}))
  const content: unknown = body?.content
  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  }
  if (content.length > 1000) {
    return NextResponse.json(
      { error: 'Comment must be 1 000 characters or fewer' },
      { status: 400 },
    )
  }

  // 4. Insert
  const { data, error } = await addPostComment(ctx.memberId, postId, content.trim())
  if (error) return NextResponse.json({ error }, { status: 500 })

  // 5. Notify the post author (fire-and-forget — failure never blocks the response)
  notifyPostAuthor(postId, ctx.memberId, data!.members).catch((e) =>
    console.error('[comments/POST] notify failed:', e),
  )

  return NextResponse.json(data, { status: 201 })
}

/** Push a Realtime notification to the post author when someone comments. */
async function notifyPostAuthor(
  postId: string,
  commenterMemberId: string,
  commenterMembers: { preferred_name: string | null; full_name: string | null } | null,
) {
  const admin = createAdminClient()

  const { data: post } = await admin
    .from('circle_posts')
    .select('member_id')
    .eq('id', postId)
    .maybeSingle()

  // Don't notify yourself
  if (!post || post.member_id === commenterMemberId) return

  const commenterName =
    commenterMembers?.preferred_name ?? commenterMembers?.full_name ?? 'A member'

  await admin.from('realtime_notifications').insert({
    member_id: post.member_id,
    type: 'system_message',
    title: 'New comment on your post',
    body: `${commenterName} replied to your post.`,
    severity: 'info',
  })
}
