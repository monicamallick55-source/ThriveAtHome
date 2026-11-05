/**
 * app/api/campaigns/route.ts — G6.4 Member-in-Need Campaigns
 *
 * GET  /api/campaigns        — list active campaigns (filtered by RLS)
 * POST /api/campaigns        — create a new campaign (navigator/staff)
 *
 * Schema (migration 095):
 *   campaigns: id, member_id, title, description, goal_cents, raised_cents,
 *              status (draft|active|funded|closed), created_by, created_at,
 *              deadline, stripe_payment_link, is_public
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const status   = searchParams.get('status') ?? 'active'
    const memberId = searchParams.get('member_id')
    const myOwn    = searchParams.get('mine') === 'true'

    let query = supabase
      .from('campaigns')
      .select(`
        id, title, description, goal_cents, raised_cents,
        status, deadline, stripe_payment_link, is_public,
        created_at,
        member:members(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') query = query.eq('status', status)
    if (memberId) query = query.eq('member_id', memberId)
    if (myOwn) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      query = query.eq('created_by', user.id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ campaigns: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      member_id,
      title,
      description,
      goal_cents,
      deadline,
      is_public = true,
    } = body

    if (!member_id || !title || !goal_cents) {
      return NextResponse.json(
        { error: 'member_id, title, and goal_cents are required' },
        { status: 400 }
      )
    }

    if (goal_cents < 100) {
      return NextResponse.json({ error: 'Goal must be at least $1' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        member_id,
        title,
        description,
        goal_cents,
        raised_cents: 0,
        status: 'draft',
        created_by: user.id,
        deadline: deadline ?? null,
        is_public,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
