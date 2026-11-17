import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

const VALID_PATHWAYS = ['late_life_divorce', 'dementia_mci', 'adult_child_moving', 'housing_insecurity']

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.from('transition_plans').select('*')
    .order('created_at', { ascending: false }).limit(50)
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const { steps: _steps, ...planBody } = body
  if (planBody.pathway && !VALID_PATHWAYS.includes(planBody.pathway)) {
    planBody.pathway = 'housing_insecurity'
  }
  if (!planBody.pathway) planBody.pathway = 'housing_insecurity'
  const { data } = await supabase.from('transition_plans').insert({
    ...planBody, status: 'active', family_can_see: false
  }).select().single()
  if (data && _steps?.length) {
    await supabase.from('transition_steps').insert(
      _steps.map((s: { title: string; order: number }) => ({
        plan_id: data.id, title: s.title, order: s.order,
        status: 'pending', created_at: new Date().toISOString()
      }))
    )
  }
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return NextResponse.json(data || { id, ...planBody, status: 'active' }, { status: 201 })
}
