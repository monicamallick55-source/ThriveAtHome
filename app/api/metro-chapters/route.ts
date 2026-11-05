/**
 * app/api/metro-chapters/route.ts — G5.3 Geographic Chapter Matching
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, zip_code, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const url = new URL(req.url)
    const stateFilter = url.searchParams.get('state')
    const activeOnly = url.searchParams.get('active_only') !== 'false'

    let query = supabase
      .from('metro_chapters')
      .select('*')
      .eq('org_id', member.org_id)
      .order('state')
      .order('city')

    if (activeOnly) query = query.eq('is_active', true)
    if (stateFilter) query = query.eq('state', stateFilter)

    const { data: chapters, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const isAdmin = member.role === 'admin' || member.role === 'navigator'

    if (isAdmin) {
      const chapterIds = (chapters ?? []).map((c: any) => c.id)
      const { data: memberships } = await supabase
        .from('member_chapter_assignments')
        .select('chapter_id')
        .in('chapter_id', chapterIds)

      const countMap: Record<string, number> = {}
      ;(memberships ?? []).forEach((m: any) => {
        countMap[m.chapter_id] = (countMap[m.chapter_id] ?? 0) + 1
      })

      return NextResponse.json({
        chapters: (chapters ?? []).map((c: any) => ({ ...c, member_count: countMap[c.id] ?? 0 })),
        is_admin: true,
      })
    }

    const { data: myAssignment } = await supabase
      .from('member_chapter_assignments')
      .select('chapter_id, assigned_at')
      .eq('member_id', member.id)
      .single()

    return NextResponse.json({
      chapters: chapters ?? [],
      my_chapter_id: myAssignment?.chapter_id ?? null,
      is_admin: false,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members').select('id, org_id, role').eq('supabase_auth_id', user.id).single()

    if (!member || !['admin', 'navigator'].includes(member.role))
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await req.json()
    const { city, state, zip_codes, service_radius_miles, coordinator_name, coordinator_email, notes } = body

    if (!city || !state) return NextResponse.json({ error: 'city and state are required' }, { status: 400 })

    const { data: chapter, error } = await supabase
      .from('metro_chapters')
      .insert({
        org_id: member.org_id, city, state,
        zip_codes: zip_codes ?? [],
        service_radius_miles: service_radius_miles ?? 25,
        coordinator_name: coordinator_name ?? null,
        coordinator_email: coordinator_email ?? null,
        notes: notes ?? null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ chapter }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members').select('id, org_id, role').eq('supabase_auth_id', user.id).single()

    if (!member || !['admin', 'navigator'].includes(member.role))
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await req.json()
    const { chapter_id, is_active, coordinator_name, coordinator_email, zip_codes, notes } = body

    if (!chapter_id) return NextResponse.json({ error: 'chapter_id required' }, { status: 400 })

    const updates: any = { updated_at: new Date().toISOString() }
    if (is_active !== undefined) updates.is_active = is_active
    if (coordinator_name !== undefined) updates.coordinator_name = coordinator_name
    if (coordinator_email !== undefined) updates.coordinator_email = coordinator_email
    if (zip_codes !== undefined) updates.zip_codes = zip_codes
    if (notes !== undefined) updates.notes = notes

    const { data: chapter, error } = await supabase
      .from('metro_chapters')
      .update(updates)
      .eq('id', chapter_id)
      .eq('org_id', member.org_id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ chapter })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
