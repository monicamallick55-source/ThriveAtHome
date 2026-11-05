/**
 * app/api/navigator/schedule/route.ts — Navigator Schedule / Availability
 * TC-PE007
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('navigator_availability')
    .select('*')
    .eq('available', true)
    .order('slot_start', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ slots: [] })
  return NextResponse.json({ slots: data ?? [] })
}
