// GET /api/family/buddy-assignment — returns buddy assignment for the authenticated user
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id') ?? user.id

    const { data: assignment, error } = await supabase
      .from('buddy_assignments')
      .select('id, status, call_frequency, preferred_call_day, assigned_at')
      .eq('member_id', memberId)
      .not('status', 'eq', 'ended')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ assignment: null, calls: [], completedCallCount: 0 })
    return NextResponse.json({ assignment, calls: [], completedCallCount: 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
