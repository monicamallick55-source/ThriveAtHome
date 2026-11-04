import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBuddyCalls, createBuddyCall } from '@/lib/data/buddies'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const assignmentId = req.nextUrl.searchParams.get('assignmentId')
  if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
  const { data, error } = await getBuddyCalls(assignmentId)
  if (error) return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { assignment_id, member_id, volunteer_id, duration_minutes, call_quality, buddy_notes, family_note, concern_flag, concern_description, milestone_flag, milestone_description, aria_brief_shown } = body
  if (!assignment_id || !member_id || !volunteer_id) return NextResponse.json({ error: 'assignment_id, member_id, volunteer_id required' }, { status: 400 })
  const { data: call, error } = await createBuddyCall({ assignment_id, member_id, volunteer_id, started_at: new Date().toISOString(), duration_minutes, call_quality, buddy_notes, family_note, concern_flag: concern_flag ?? false, concern_description, milestone_flag: milestone_flag ?? false, milestone_description, aria_brief_shown: aria_brief_shown ?? false })
  if (error) return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  if (concern_flag && concern_description) {
    const admin = createAdminClient() as any
    const { data: navLink } = await admin.from('member_navigators').select('navigator_id').eq('member_id', member_id).single()
    if (navLink) {
      await admin.from('navigator_tasks').insert({ navigator_id: navLink.navigator_id, member_id, task_type: 'buddy_concern', priority: 'informational', notes: concern_description, related_id: call?.id, status: 'open' })
    }
  }
  return NextResponse.json(call, { status: 201 })
}
