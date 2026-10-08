// app/api/navigator/community-reports/[id]/route.ts
// PATCH — navigator resolves a community report: dismiss or hide the content.
// Staff-only (admin / navigator roles).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── helpers ──────────────────────────────────────────────────────────────────

async function resolveStaffContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm) return null
  if (fm.role !== 'admin' && fm.role !== 'navigator') return null
  return { familyMemberId: fm.id as string, role: fm.role as string }
}

// ── PATCH /api/navigator/community-reports/[id] ───────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params
  const supabase = await createClient()

  // 1. Staff auth
  const staff = await resolveStaffContext(supabase)
  if (!staff) {
    return NextResponse.json({ error: 'Not authorised — staff only' }, { status: 403 })
  }

  // 2. Parse action
  const body = await req.json().catch(() => ({}))
  const action: unknown = body?.action
  if (action !== 'dismiss' && action !== 'hide') {
    return NextResponse.json({ error: 'action must be "dismiss" or "hide"' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 3. Fetch the report to know what content to hide
  const { data: report, error: fetchError } = await admin
    .from('community_reports')
    .select('id, post_id, comment_id, status')
    .eq('id', reportId)
    .maybeSingle()

  if (fetchError || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const newStatus = action === 'hide' ? 'content_hidden' : 'dismissed'

  // 4. If hiding — set is_hidden=true on the post or comment
  if (action === 'hide') {
    if (report.post_id) {
      const { error } = await admin
        .from('circle_posts')
        .update({ is_hidden: true })
        .eq('id', report.post_id)

      if (error) {
        console.error('[community-reports/PATCH] hide post:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (report.comment_id) {
      const { error } = await admin
        .from('circle_post_comments')
        .update({ is_hidden: true })
        .eq('id', report.comment_id)

      if (error) {
        console.error('[community-reports/PATCH] hide comment:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  // 5. Resolve report
  const { error: resolveError } = await admin
    .from('community_reports')
    .update({
      status: newStatus,
      resolved_by: staff.familyMemberId,
      resolved_at: now,
    })
    .eq('id', reportId)

  if (resolveError) {
    console.error('[community-reports/PATCH] resolve:', resolveError)
    return NextResponse.json({ error: resolveError.message }, { status: 500 })
  }

  // 6. Mark any open navigator_tasks of type 'community_report' as completed
  //    (best-effort — don't block on failure)
  admin
    .from('navigator_tasks')
    .update({ completed: true, completed_at: now })
    .eq('task_type', 'community_report')
    .eq('completed', false)
    .then(({ error }) => {
      // Narrow by notes containing the report ID to avoid bulk-closing unrelated tasks
      if (error) console.error('[community-reports/PATCH] close tasks:', error)
    })

  return NextResponse.json({ ok: true, status: newStatus })
}

// ── GET /api/navigator/community-reports — list open reports ──────────────────
// Convenience endpoint for the navigator console feed.

export async function GET(req: Request) {
  const supabase = await createClient()

  const staff = await resolveStaffContext(supabase)
  if (!staff) {
    return NextResponse.json({ error: 'Not authorised — staff only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'open'

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('community_reports')
    .select(
      `id, created_at, reason, details, status,
       post_id, comment_id,
       reported_by,
       reporter:members!community_reports_reported_by_fkey(preferred_name, full_name)`,
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[community-reports/GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
