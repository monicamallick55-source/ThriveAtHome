// GET /api/volunteer/buddy-calls?assignment_id=... — returns call history for an assignment
// POST /api/volunteer/buddy-calls — logs a buddy call
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBuddyCallsForFamily, createBuddyCall } from '@/lib/data/buddies'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TablesInsert } from '@/types/database'
type BuddyCallInsert = TablesInsert<'buddy_calls'>

export async function GET(req: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignment_id')
    if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })

    const { data, error } = await getBuddyCallsForFamily(assignmentId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth()
    const body = await req.json()
    const { assignment_id, member_id, volunteer_id, duration_minutes, call_quality, buddy_notes, family_note, concern_flag, concern_description, milestone_flag, milestone_description } = body

    if (!assignment_id || !member_id || !volunteer_id) {
      return NextResponse.json({ error: 'assignment_id, member_id, and volunteer_id are required' }, { status: 400 })
    }

    const callInsert = {
      assignment_id,
      member_id,
      volunteer_id,
      call_date: new Date().toISOString().split('T')[0],
      duration_minutes: duration_minutes ?? null,
      call_quality: call_quality ?? null,
      buddy_notes: buddy_notes ?? null,
      family_note: family_note ?? null,
      concern_flag: concern_flag ?? false,
      concern_description: concern_flag ? (concern_description ?? null) : null,
      milestone_flag: milestone_flag ?? false,
      milestone_description: milestone_flag ? (milestone_description ?? null) : null,
    }

    const { data, error } = await createBuddyCall(callInsert as any)
    if (error) return NextResponse.json({ error }, { status: 500 })

    // If concern flagged, create a navigator task
    if (concern_flag && concern_description) {
      const admin = createAdminClient()
      // Find navigator for this member
      const { data: navAssignment } = await (admin.from as any)('navigator_assignments')
        .select('navigator_id')
        .eq('member_id', member_id)
        .limit(1)
        .single()

      if (navAssignment) {
        await (admin.from as any)('navigator_tasks').insert({
          navigator_id: navAssignment.navigator_id,
          member_id,
          title: 'Buddy concern flag — follow up required',
          description: `Buddy flagged a concern after a call. Notes: ${concern_description}`,
          priority: 'high',
          status: 'pending',
        })
      }
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
