/**
 * app/api/check-ins/route.ts — Scheduled Check-ins
 * TC-MBA008
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('check_in_schedules')
    .select('*')
    .eq('member_supabase_auth_id', user.id)
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ check_ins: [] })
  return NextResponse.json({ check_ins: data ?? [] })
}
