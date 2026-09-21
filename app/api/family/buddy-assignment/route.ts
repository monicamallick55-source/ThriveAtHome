// GET /api/family/buddy-assignment?member_id=... — returns buddy assignment + recent calls for a member
// (family view: no concern_description). Also used by the member portal itself, so a senior
// who logged in directly (members.supabase_auth_id, no family_members row) must be allowed too.
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBuddyCallsForFamily, getCompletedBuddyCallCount } from '@/lib/data/buddies'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')
    if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    // Verify the user is either a family member linked to this member, or the
    // senior themselves logged in via direct member auth.
    const admin = createAdminClient()
    const [{ data: fm }, { data: directMember }] = await Promise.all([
      (admin.from as any)('family_members')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .eq('member_id', memberId)
        .maybeSingle(),
      (admin.from as any)('members')
        .select('id')
        .eq('id', memberId)
        .eq('supabase_auth_id', user.id)
        .maybeSingle(),
    ])
    if (!fm && !directMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: assignment } = await (admin.from as any)('buddy_assignments')
      .select('id, status, call_frequency, preferred_call_day, assigned_at, volunteers(full_name)')
      .eq('member_id', memberId)
      .not('status', 'eq', 'ended')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let calls: unknown[] = []
    let completedCallCount = 0
    if (assignment) {
      const [{ data }, { data: count }] = await Promise.all([
        getBuddyCallsForFamily(assignment.id),
        getCompletedBuddyCallCount(assignment.id),
      ])
      calls = data ?? []
      completedCallCount = count
    }

    return NextResponse.json({ assignment, calls, completedCallCount })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
