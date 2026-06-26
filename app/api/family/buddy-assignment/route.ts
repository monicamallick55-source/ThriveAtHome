// GET /api/family/buddy-assignment?member_id=... — returns buddy assignment + recent calls for a member (family view: no concern_description)
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBuddyCallsForFamily } from '@/lib/data/buddies'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')
    if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    // Verify the user is a family member linked to this member
    const admin = createAdminClient()
    const { data: fm } = await (admin.from as any)('family_members')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .eq('member_id', memberId)
      .maybeSingle()
    if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: assignment } = await (admin.from as any)('buddy_assignments')
      .select('id, status, call_frequency, preferred_call_day, assigned_at, volunteers(full_name)')
      .eq('member_id', memberId)
      .not('status', 'eq', 'ended')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let calls: unknown[] = []
    if (assignment) {
      const { data } = await getBuddyCallsForFamily(assignment.id)
      calls = data ?? []
    }

    return NextResponse.json({ assignment, calls })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
