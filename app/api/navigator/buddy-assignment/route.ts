// GET /api/navigator/buddy-assignment?member_id=... — returns buddy assignment + calls for a member
// DELETE /api/navigator/buddy-assignment — ends a buddy assignment
import { NextResponse } from 'next/server'
import { requireAuth, isNavigatorOrAdmin } from '@/lib/auth'
import { getBuddyCalls, endBuddyAssignment } from '@/lib/data/buddies'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const user = await requireAuth()
    if (!(await isNavigatorOrAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')
    if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: assignment } = await (admin.from as any)('buddy_assignments')
      .select('*, volunteers(full_name)')
      .eq('member_id', memberId)
      .not('status', 'eq', 'ended')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let calls: unknown[] = []
    if (assignment) {
      const { data } = await getBuddyCalls(assignment.id)
      calls = data ?? []
    }

    return NextResponse.json({ assignment, calls })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth()
    if (!(await isNavigatorOrAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { assignment_id, end_reason, transition_buddy_id } = body
    if (!assignment_id || !end_reason) {
      return NextResponse.json({ error: 'assignment_id and end_reason are required' }, { status: 400 })
    }

    const { error } = await endBuddyAssignment(assignment_id, end_reason, transition_buddy_id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
