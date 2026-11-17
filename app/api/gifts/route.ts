import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('gifts').select('id, gift_type, gift_description, amount_cents, status, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(50).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
