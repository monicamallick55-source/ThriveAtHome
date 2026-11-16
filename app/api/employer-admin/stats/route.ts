import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { count: member_count } = await supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active')
  return NextResponse.json({ member_count: member_count ?? 0, active_this_week: 0, check_ins_completed: 0, services_requested: 0 })
}
