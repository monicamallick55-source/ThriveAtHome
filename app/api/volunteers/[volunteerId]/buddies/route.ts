// GET /api/volunteers/[volunteerId]/buddies
// Returns buddy assignments for the My Buddies tab on the volunteer dashboard

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { volunteerId: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await (admin as any)
    .from('buddy_assignments')
    .select('id, member_id, call_frequency, last_call_date, status, members(first_name, last_name)')
    .eq('volunteer_id', params.volunteerId)
    .eq('status', 'active')
    .order('last_call_date', { ascending: true, nullsFirst: true })

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ assignments: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const assignments = (data ?? []).map((a: any) => ({
    id: a.id,
    member_id: a.member_id,
    call_frequency: a.call_frequency,
    last_call_date: a.last_call_date,
    status: a.status,
    member_first_name: a.members?.first_name ?? 'Member',
    member_last_initial: a.members?.last_name?.[0] ?? '',
  }))

  return NextResponse.json({ assignments })
}
