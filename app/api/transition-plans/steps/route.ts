/**
 * app/api/transition-plans/steps/route.ts — G5.5
 * GET  /api/transition-plans/steps?plan_id=UUID
 * POST /api/transition-plans/steps         (navigator creates steps)
 * PATCH /api/transition-plans/steps?id=UUID (update status)
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const FACILITY_MOVE_TEMPLATE = [
  { week: 1, title: 'Facility research', description: 'Research 3–5 facilities matching care needs and location preferences. Gather brochures and rating information.' },
  { week: 1, title: 'Benefits screening', description: 'Review Medi-Cal/Medicare coverage, long-term care insurance, and VA benefits if applicable.' },
  { week: 2, title: 'Schedule facility visits', description: 'Arrange tours of top-choice facilities. Coordinate transport for member and family.' },
  { week: 2, title: 'Review paperwork checklist', description: 'Identify all required documents: medical records, insurance cards, ID, legal documents (POA, advance directive).' },
  { week: 3, title: 'Make facility decision', description: 'Confirm choice with member and family. Submit application and deposit.' },
  { week: 3, title: 'Notify current housing', description: 'Give notice to current landlord or home care agency. Confirm move-out date.' },
  { week: 4, title: 'Family coordination meeting', description: 'Confirm who is helping on moving day. Assign roles: packing, transport, set-up.' },
  { week: 4, title: 'Sort belongings', description: 'Help member decide what to keep, store, donate, or pass to family. Sensitive items to safe keeping.' },
  { week: 5, title: 'Moving day plan', description: 'Confirm moving company or volunteer helpers. Create a room-by-room checklist for the new space.' },
  { week: 5, title: 'Update addresses and services', description: 'Update: Medicare/Medi-Cal, Social Security, bank, prescriptions, care team, Thrive@Home.' },
  { week: 6, title: 'Post-move check-in (Day 3)', description: 'Grace call to check in on how the member is settling in.' },
  { week: 6, title: 'Post-move check-in (Day 14)', description: 'Navigator call: how are they adjusting? Any concerns or unmet needs?' },
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const planId = new URL(req.url).searchParams.get('plan_id')
    if (!planId) return NextResponse.json({ error: 'plan_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('transition_plan_steps')
      .select('*')
      .eq('plan_id', planId)
      .order('week_number').order('created_at')

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
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
    const { plan_id, use_facility_move_template, steps } = body

    if (!plan_id) return NextResponse.json({ error: 'plan_id required' }, { status: 400 })

    const toInsert = use_facility_move_template
      ? FACILITY_MOVE_TEMPLATE.map(s => ({
          plan_id,
          week_number: s.week,
          step_title: s.title,
          step_description: s.description,
          status: 'pending',
        }))
      : (steps ?? []).map((s: any) => ({ plan_id, ...s, status: s.status ?? 'pending' }))

    const { data, error } = await supabase
      .from('transition_plan_steps')
      .insert(toInsert)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await req.json()
    const update: any = { updated_at: new Date().toISOString() }
    if (body.status) update.status = body.status
    if (body.status === 'done') update.completed_at = new Date().toISOString()
    if (body.due_date) update.due_date = body.due_date

    const { data, error } = await supabase
      .from('transition_plan_steps')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
