/**
 * app/api/check-in-calls/route.ts — Check-in Calls Log
 * TC-MED001
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('aria_calls')
    .select('id, created_at, duration_seconds, mood_score, energy_score, summary')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ calls: [] })
  return NextResponse.json({ calls: data ?? [] })
}
