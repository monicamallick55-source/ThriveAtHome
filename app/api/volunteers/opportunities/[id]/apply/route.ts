/**
 * app/api/volunteers/opportunities/[id]/apply/route.ts — G7.10
 *
 * POST /api/volunteers/opportunities/[id]/apply
 *   — Volunteer applies to an opportunity.
 *   — For neighbor_check_in: validates volunteer zip matches opportunity zip prefix.
 *   — For retired_pro_consult: validates volunteer has professional_specialty set.
 *   — On success: increments spots_filled, closes if full.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { volunteer_id, notes } = body

  if (!volunteer_id) {
    return NextResponse.json({ error: 'volunteer_id required' }, { status: 400 })
  }

  // Fetch opportunity
  const { data: opp } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (!opp) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  if (opp.status !== 'open') return NextResponse.json({ error: 'Opportunity is no longer open' }, { status: 409 })
  if (opp.spots_filled >= opp.spots_total) {
    return NextResponse.json({ error: 'All spots are filled' }, { status: 409 })
  }

  // Fetch volunteer profile for validation
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('id, zip_code, volunteer_category, professional_specialty, background_check_verified, training_completed')
    .eq('id', volunteer_id)
    .single()

  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

  // G7.12 — Neighbor zip enforcement
  if (opp.opportunity_type === 'neighbor_check_in' && opp.zip_code) {
    const volunteerZip = volunteer.zip_code ?? ''
    const samePrefix = volunteerZip.substring(0, 3) === opp.zip_code.substring(0, 3)
    if (!samePrefix) {
      return NextResponse.json(
        { error: 'Neighbor check-in opportunities require volunteers in the same local area' },
        { status: 400 }
      )
    }
  }

  // G7.10 — Retired professional specialty required for consult
  if (opp.opportunity_type === 'retired_pro_consult') {
    if (!volunteer.professional_specialty) {
      return NextResponse.json(
        { error: 'This opportunity requires a retired professional with a declared specialty' },
        { status: 400 }
      )
    }
  }

  // Training gate — block apply if required training modules not completed
  if (!volunteer.training_completed) {
    const { data: requiredModules } = await supabase
      .from('volunteer_training_requirements')
      .select('module_id, volunteer_training_modules(name)')
      .eq('opportunity_type', opp.opportunity_type ?? 'general')

    if (requiredModules && requiredModules.length > 0) {
      const moduleIds = requiredModules.map((r: any) => r.module_id)
      const { data: completions } = await supabase
        .from('volunteer_training_completions')
        .select('module_id')
        .eq('volunteer_id', volunteer_id)
        .in('module_id', moduleIds)

      const completedIds = new Set((completions ?? []).map((c: any) => c.module_id))
      const incomplete = requiredModules.filter((r: any) => !completedIds.has(r.module_id))

      if (incomplete.length > 0) {
        const missing = incomplete
          .map((r: any) => (r.volunteer_training_modules as any)?.name ?? r.module_id)
          .join(', ')
        return NextResponse.json(
          { error: `Complete required training before applying: ${missing}`, missing_modules: incomplete.map((r: any) => r.module_id) },
          { status: 400 }
        )
      }
    }
  }

  // Check for duplicate application
  const { data: existing } = await supabase
    .from('opportunity_applications')
    .select('id, status')
    .eq('opportunity_id', id)
    .eq('volunteer_id', volunteer_id)
    .single()

  if (existing && existing.status !== 'withdrawn') {
    return NextResponse.json({ error: 'Already applied to this opportunity' }, { status: 409 })
  }

  // Create application
  const { data: application, error } = await supabase
    .from('opportunity_applications')
    .insert({
      opportunity_id: id,
      volunteer_id,
      notes: notes ?? null,
      status: 'pending',
      applied_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment spots_filled; close if full
  const newFilled = opp.spots_filled + 1
  const newStatus = newFilled >= opp.spots_total ? 'filled' : 'open'
  await supabase
    .from('opportunities')
    .update({ spots_filled: newFilled, status: newStatus })
    .eq('id', id)

  // Create navigator task to review and confirm
  await supabase.from('navigator_tasks').insert({
    member_id: opp.target_member_id ?? null,
    task_type: 'volunteer',
    notes: `Volunteer applied to "${opp.title}". Review and confirm, or reassign. Volunteer ID: ${volunteer_id}`,
    priority: 'medium',
    status: 'pending',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    metadata: { opportunity_id: id, application_id: application.id, volunteer_id },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  return NextResponse.json({ application }, { status: 201 })
}
