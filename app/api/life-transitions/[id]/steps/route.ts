import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data } = await supabase.from('transition_steps').select('*')
    .eq('plan_id', id).order('order', { ascending: true }).limit(20)
  if (data && data.length > 0) return NextResponse.json(data)
  // Mock fallback
  return NextResponse.json([{ id: 'step-mock-001', plan_id: id, title: 'First Step', status: 'pending', order: 1 }])
}
