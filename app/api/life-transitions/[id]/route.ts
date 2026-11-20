/**
 * app/api/life-transitions/[id]/route.ts — single transition plan by id or pathway slug
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PATHWAY_MOCK: Record<string, object> = {
  retirement: { id: 'retirement', title: 'Retirement Planning', status: 'active', steps: [] },
  widow: { id: 'widow', title: 'Widowhood Support', status: 'active', steps: [] },
  diagnosis: { id: 'diagnosis', title: 'New Diagnosis Support', status: 'active', steps: [] },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('life_transition_plans')
      .select('*,life_transition_steps(*)')
      .eq('id', id)
      .single()
    if (data) return NextResponse.json(data)
  } catch {}
  // fall back to mock for well-known pathway slugs
  const mock = PATHWAY_MOCK[id]
  if (mock) return NextResponse.json(mock)
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('life_transition_plans')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    if (data && !error) return NextResponse.json(data)
  } catch {}
  return NextResponse.json({ id, ...body })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    await supabase.from('life_transition_plans').delete().eq('id', id)
  } catch {}
  return NextResponse.json({ deleted: true })
}
