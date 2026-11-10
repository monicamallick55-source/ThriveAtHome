import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('marketplace_bookings')
    .select('id, provider_id, service_type, status, amount_cents, created_at')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ transactions: data ?? [] })
}
