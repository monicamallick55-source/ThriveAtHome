// app/api/campaigns/route.ts
// G6.4 — Create a new Community Care Fund campaign
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      member_id,
      title,
      story,
      need_category,
      goal_amount_cents,
      deadline,
      payment_zelle,
      payment_venmo,
      payment_other,
      navigator_notes,
      member_consent,
      status,
    } = body

    if (!title || !story || !need_category) {
      return NextResponse.json({ error: 'title, story, and need_category are required' }, { status: 400 })
    }

    // Find the requesting family_member
    const { data: fm } = await (supabase as any)
      .from('family_members')
      .select('id, member_id, role')
      .eq('supabase_auth_id', user.id)
      .single()
    if (!fm) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Determine effective member_id
    const effectiveMemberId = member_id ?? fm.member_id

    // Check permission: member/family submit for their own member; navigators/admins can specify any member_id
    if (!['admin', 'navigator'].includes(fm.role) && member_id && member_id !== fm.member_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const insertStatus = status ?? (member_consent ? 'active' : 'draft')
    const { data, error } = await (supabase as any)
      .from('member_campaigns')
      .insert({
        member_id:         effectiveMemberId,
        created_by_fm_id:  fm.id,
        navigator_id:      ['admin', 'navigator'].includes(fm.role) ? fm.id : null,
        title,
        story,
        need_category,
        goal_amount_cents: goal_amount_cents ?? null,
        deadline:          deadline ?? null,
        payment_zelle:     payment_zelle ?? null,
        payment_venmo:     payment_venmo ?? null,
        payment_other:     payment_other ?? null,
        navigator_notes:   navigator_notes ?? null,
        member_consent:    !!member_consent,
        consent_date:      member_consent ? new Date().toISOString() : null,
        status:            insertStatus,
      })
      .select()
      .single()

    if (error) {
      console.error('[campaigns POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[campaigns POST] unexpected', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')

    let query = (supabase as any)
      .from('member_campaigns')
      .select('*, members(first_name, last_name)')
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[campaigns GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
