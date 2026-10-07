import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_REASONS = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm?.member_id) return NextResponse.json({ error: 'No member' }, { status: 403 })

  const { post_id, comment_id, reason, details } = await req.json()
  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }
  if (!post_id && !comment_id) {
    return NextResponse.json({ error: 'post_id or comment_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('community_reports' as any)
    .insert({
      reported_by: fm.member_id,
      post_id: post_id ?? null,
      comment_id: comment_id ?? null,
      reason,
      details: details?.trim() ?? null,
      status: 'open',
    })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[report] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: (data as any)?.id }, { status: 201 })
}
