/**
 * app/api/volunteer-training/route.ts — G4.7 Volunteer Training Modules
 *
 * GET  /api/volunteer-training?volunteer_id=<id>
 *   Returns all active modules + completion status for the volunteer
 *
 * POST /api/volunteer-training
 *   Body: { volunteer_id, module_id }
 *   Marks a module complete (idempotent — upserts)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const volunteerId = searchParams.get('volunteer_id')

  // Get all active modules
  const { data: modules, error: modErr } = await supabase
    .from('volunteer_training_modules')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 })

  // If volunteer_id provided, get completions
  let completions: { module_id: string; completed_at: string }[] = []
  if (volunteerId) {
    const { data } = await supabase
      .from('volunteer_training_completions')
      .select('module_id, completed_at')
      .eq('volunteer_id', volunteerId)
    completions = data ?? []
  }

  const completionMap = Object.fromEntries(completions.map((c) => [c.module_id, c.completed_at]))

  const result = (modules ?? []).map((m) => ({
    ...m,
    completed: !!completionMap[m.id],
    completed_at: completionMap[m.id] ?? null,
  }))

  const requiredCount = result.filter((m) => m.required).length
  const completedRequired = result.filter((m) => m.required && m.completed).length
  const allRequiredDone = requiredCount > 0 && completedRequired === requiredCount

  return NextResponse.json({
    modules: result,
    summary: {
      total: result.length,
      completed: result.filter((m) => m.completed).length,
      required_total: requiredCount,
      required_completed: completedRequired,
      all_required_done: allRequiredDone,
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { volunteer_id, module_id } = await req.json()
  if (!volunteer_id || !module_id) {
    return NextResponse.json({ error: 'volunteer_id and module_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('volunteer_training_completions')
    .upsert(
      { volunteer_id, module_id, completed_at: new Date().toISOString() },
      { onConflict: 'volunteer_id,module_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ completion: data }, { status: 201 })
}
