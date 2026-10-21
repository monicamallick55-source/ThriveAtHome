// app/api/neighbor-match/route.ts
// G7.12 — Neighbor volunteer matching: zip-code enforcement + navigator approval

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/neighbor-match?memberId=xxx — list pending/approved matches for member
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('neighbor_match_requests')
    .select(`
      id, status, created_at, navigator_note, approved_at,
      volunteers(id, first_name, last_initial, zip_code, total_hours, bio)
    `)
    .eq('member_id', memberId)
    .neq('status', 'declined')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ matches: data ?? [] })
}

// POST /api/neighbor-match — navigator creates a neighbor match request
// Body: { volunteerId, memberId }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json()
  const { volunteerId, memberId } = body

  if (!volunteerId || !memberId) {
    return NextResponse.json({ error: 'volunteerId and memberId required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // G7.12: Verify volunteer is neighbor category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: volunteer } = await (admin as any)
    .from('volunteers')
    .select('id, volunteer_category, zip_code')
    .eq('id', volunteerId)
    .single()

  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
  if (volunteer.volunteer_category !== 'neighbor') {
    return NextResponse.json({ error: 'Volunteer is not in neighbor category' }, { status: 422 })
  }

  // G7.12: Verify zip code match with member's zip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (admin as any)
    .from('members')
    .select('id, zip_code')
    .eq('id', memberId)
    .single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  if (volunteer.zip_code && member.zip_code && volunteer.zip_code !== member.zip_code) {
    return NextResponse.json({
      error: 'Zip code mismatch — neighbor volunteers must be in the same zip code as the member',
      volunteerZip: volunteer.zip_code,
      memberZip: member.zip_code,
    }, { status: 422 })
  }

  // G7.13: Family reciprocity guard — volunteer must not be a family member of this member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: familyLink } = await (admin as any)
    .from('family_members')
    .select('id')
    .eq('member_id', memberId)
    .eq('user_id', volunteer.id)  // volunteer.id is their user_id if applicable
    .maybeSingle()

  // Also check by volunteer's linked family_member record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: volFamilyLink } = await (admin as any)
    .from('volunteers')
    .select('family_member_id')
    .eq('id', volunteerId)
    .single()

  if (volFamilyLink?.family_member_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fmCheck } = await (admin as any)
      .from('family_members')
      .select('id')
      .eq('id', volFamilyLink.family_member_id)
      .eq('member_id', memberId)
      .maybeSingle()

    if (fmCheck) {
      return NextResponse.json({
        error: 'Family reciprocity violation — a family volunteer cannot be matched to their own senior member',
      }, { status: 422 })
    }
  }

  if (familyLink) {
    return NextResponse.json({
      error: 'Family reciprocity violation — a family volunteer cannot be matched to their own senior member',
    }, { status: 422 })
  }

  // Check for existing pending/approved match
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('neighbor_match_requests')
    .select('id, status')
    .eq('volunteer_id', volunteerId)
    .eq('member_id', memberId)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `Match already exists with status: ${existing.status}`, existingId: existing.id }, { status: 409 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match, error } = await (admin as any)
    .from('neighbor_match_requests')
    .insert({ volunteer_id: volunteerId, member_id: memberId, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ match }, { status: 201 })
}

// PATCH /api/neighbor-match — navigator approves or declines
// Body: { matchId, status: 'approved'|'declined', navigatorNote }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json()
  const { matchId, status, navigatorNote } = body

  if (!matchId || !['approved', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'matchId and status (approved|declined) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('neighbor_match_requests')
    .update({
      status,
      navigator_note: navigatorNote ?? null,
      approved_by: user.id,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', matchId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ match: data })
}
