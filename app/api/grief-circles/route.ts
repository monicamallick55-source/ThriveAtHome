/**
 * app/api/grief-circles/route.ts — G4.4 Facilitated Grief Circles
 *
 * GET  /api/grief-circles              — list circles (member sees own; staff sees all)
 * POST /api/grief-circles              — create circle (staff only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  let query = supabase
    .from('grief_circles')
    .select(`
      *,
      grief_circle_members(id, member_id, status, joined_at)
    `)
    .order('created_at', { ascending: false })

  if (memberId) {
    // Filter to circles this member is in
    query = query.eq('grief_circle_members.member_id', memberId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ circles: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    org_id, name, description, loss_type = 'general',
    format = 'virtual', schedule_text, max_members = 8,
    is_private = true, next_session_at,
  } = body

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('grief_circles')
    .insert({
      org_id: org_id ?? null,
      name,
      description: description ?? null,
      facilitator_id: user.id,
      loss_type,
      format,
      schedule_text: schedule_text ?? null,
      max_members,
      status: 'forming',
      is_private,
      next_session_at: next_session_at ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ circle: data }, { status: 201 })
}
