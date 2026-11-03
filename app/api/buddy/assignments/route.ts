import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveBuddyAssignment, getBuddyAssignments, createBuddyAssignment } from '@/lib/data/buddies'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const memberId = req.nextUrl.searchParams.get('memberId')
  const volunteerId = req.nextUrl.searchParams.get('volunteerId')
  if (memberId) {
    const { data, error } = await getActiveBuddyAssignment(memberId)
    if (error && (error as any).code !== 'PGRST116') return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
    return NextResponse.json(data)
  }
  if (volunteerId) {
    const { data, error } = await getBuddyAssignments(volunteerId)
    if (error) return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    return NextResponse.json(data)
  }
  return NextResponse.json({ error: 'memberId or volunteerId required' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: staff } = await (supabase as any).from('staff').select('id,role').eq('supabase_auth_id', user.id).single()
  if (!staff || !['admin','navigator','super_admin'].includes(staff.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { member_id, volunteer_id, call_frequency, preferred_call_day, preferred_call_time, match_score, match_reasons, navigator_notes } = body
  if (!member_id || !volunteer_id) return NextResponse.json({ error: 'member_id and volunteer_id required' }, { status: 400 })
  const { data, error } = await createBuddyAssignment({ member_id, volunteer_id, call_frequency: call_frequency ?? 'weekly', preferred_call_day, preferred_call_time, match_score, match_reasons, navigator_notes })
  if (error) return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
