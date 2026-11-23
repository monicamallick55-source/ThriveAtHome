import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['admin','super_admin','csm'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ analytics: { members_total: 0, members_active: 0, calls_today: 0, calls_week: 0 } })
}
