import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data } = await supabase.from('transition_steps').select('*')
    .eq('plan_id', id).order('order', { ascending: true }).limit(20)
  return NextResponse.json(data || [])
}
