import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
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
  const { postId, commentId, reason, details } = body
  if (!reason) return NextResponse.json({ error: 'reason required' }, { status: 400 })
  if (!postId && !commentId) return NextResponse.json({ error: 'postId or commentId required' }, { status: 400 })

  const { data: report, error } = await supabase
    .from('community_reports')
    .insert({
      post_id: postId ?? null,
      comment_id: commentId ?? null,
      reported_by: fm.member_id,
      reason,
      details: details ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create navigator task
  const priority = ['scam_or_fraud', 'worried_about_member'].includes(reason) ? 'high' : 'medium'
  await supabase.from('navigator_tasks').insert({
    task_type: 'community_report',
    priority,
    title: `Community report: ${reason}`,
    related_id: report.id,
  })

  return NextResponse.json(report, { status: 201 })
}
