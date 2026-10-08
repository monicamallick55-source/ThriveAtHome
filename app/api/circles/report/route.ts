// app/api/circles/report/route.ts
// POST — submit a moderation report on a post or comment.
// Creates a community_reports row + navigator_tasks row.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_REASONS = [
  'unkind',
  'spam',
  'scam_or_fraud',
  'private_info',
  'worried_about_member',
  'other',
] as const
type ReportReason = (typeof VALID_REASONS)[number]

const HIGH_PRIORITY_REASONS: ReportReason[] = ['scam_or_fraud', 'worried_about_member']

// ── helpers ──────────────────────────────────────────────────────────────────

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

/** Resolve the member_id of the author of the reported content. */
async function resolveContentAuthor(
  postId: string | null,
  commentId: string | null,
): Promise<string | null> {
  const admin = createAdminClient()

  if (postId) {
    const { data } = await admin
      .from('circle_posts')
      .select('member_id')
      .eq('id', postId)
      .maybeSingle()
    return data?.member_id ?? null
  }

  if (commentId) {
    const { data } = await admin
      .from('circle_post_comments')
      .select('member_id')
      .eq('id', commentId)
      .maybeSingle()
    return data?.member_id ?? null
  }

  return null
}

// ── POST /api/circles/report ──────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()

  // 1. Auth
  const ctx = await resolveMemberContext(supabase)
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Parse body
  const body = await req.json().catch(() => ({}))
  const postId: string | null = typeof body?.postId === 'string' ? body.postId : null
  const commentId: string | null = typeof body?.commentId === 'string' ? body.commentId : null
  const reason: unknown = body?.reason
  const details: unknown = body?.details ?? null

  // 3. Validate: exactly one of postId or commentId
  if (!postId && !commentId) {
    return NextResponse.json({ error: 'Provide postId or commentId' }, { status: 400 })
  }
  if (postId && commentId) {
    return NextResponse.json({ error: 'Provide only one of postId or commentId' }, { status: 400 })
  }
  if (!VALID_REASONS.includes(reason as ReportReason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }
  if (details !== null && (typeof details !== 'string' || details.length > 500)) {
    return NextResponse.json({ error: 'Details must be 500 characters or fewer' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 4. Insert report (UNIQUE constraint catches duplicate reports gracefully)
  const { data: report, error: reportError } = await admin
    .from('community_reports')
    .insert({
      post_id: postId,
      comment_id: commentId,
      reported_by: ctx.memberId,
      reason: reason as ReportReason,
      details: details as string | null,
    })
    .select('id')
    .maybeSingle()

  if (reportError) {
    // Duplicate report (unique constraint on reported_by + post_id + comment_id)
    if (reportError.code === '23505') {
      return NextResponse.json(
        { error: "You've already reported this. Our team is reviewing it." },
        { status: 409 },
      )
    }
    console.error('[report/POST] insert report:', reportError)
    return NextResponse.json({ error: reportError.message }, { status: 500 })
  }

  // 5. Resolve author for navigator task subject
  const authorMemberId = await resolveContentAuthor(postId, commentId)
  const priority = HIGH_PRIORITY_REASONS.includes(reason as ReportReason) ? 'high' : 'medium'

  // 6. Create navigator task for the community report
  if (authorMemberId) {
    const taskNote =
      reason === 'worried_about_member'
        ? `A member has reported concern for ${authorMemberId}'s wellbeing via a community post/comment.`
        : `Community report received. Reason: ${reason}. Report ID: ${report?.id ?? 'unknown'}.`

    await admin
      .from('navigator_tasks')
      .insert({
        member_id: authorMemberId,
        task_type: 'community_report',
        priority,
        description: taskNote,
      })
      .then(({ error }) => {
        if (error) console.error('[report/POST] navigator task:', error)
      })

    // 7. Extra wellbeing task for "worried about member"
    if (reason === 'worried_about_member') {
      await admin
        .from('navigator_tasks')
        .insert({
          member_id: authorMemberId,
          task_type: 'concern_flag',
          priority: 'high',
          description: `A community member flagged concern for this member's wellbeing. Please follow up.`,
        })
        .then(({ error }) => {
          if (error) console.error('[report/POST] wellbeing task:', error)
        })
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
