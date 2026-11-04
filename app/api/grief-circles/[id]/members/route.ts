/**
 * app/api/grief-circles/[id]/members/route.ts — G4.4
 *
 * GET  /api/grief-circles/[id]/members   — list members in a circle (staff only)
 * POST /api/grief-circles/[id]/members   — invite a member (navigator only)
 * PATCH /api/grief-circles/[id]/members  — update member status (accept/leave)
 *   body: { member_id, status: 'active' | 'paused' | 'left' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('grief_circle_members')
    .select('*, members(id, first_name, last_name)')
    .eq('circle_id', id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id } = body
  if (!member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  // Check circle capacity
  const { data: circle } = await supabase
    .from('grief_circles')
    .select('max_members, status')
    .eq('id', id)
    .single()

  if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  if (circle.status === 'closed') return NextResponse.json({ error: 'Circle is closed' }, { status: 400 })

  const { count } = await supabase
    .from('grief_circle_members')
    .select('id', { count: 'exact', head: true })
    .eq('circle_id', id)
    .eq('status', 'active')

  if ((count ?? 0) >= circle.max_members) {
    return NextResponse.json({ error: 'Circle is at capacity' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('grief_circle_members')
    .insert({
      circle_id: id,
      member_id,
      invited_by: user.id,
      status: 'invited',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create navigator task to follow up on invitation
  await supabase
    .from('navigator_tasks')
    .insert({
      member_id,
      task_type: 'grief_circle_followup',
      description: `Member was invited to a grief circle. Follow up to ensure they received the invitation and answer any questions.`,
      priority: 'low',
      category: 'wellbeing',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    .then(({ error: _e }: { error: unknown }) => void _e)

  return NextResponse.json({ membership: data }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, status } = body
  if (!member_id || !status) return NextResponse.json({ error: 'member_id and status required' }, { status: 400 })

  const updates: Record<string, unknown> = { status }
  if (status === 'active') updates.joined_at = new Date().toISOString()
  if (status === 'left') updates.left_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('grief_circle_members')
    .update(updates)
    .eq('circle_id', id)
    .eq('member_id', member_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ membership: data })
}
