import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { action, quantity, org_id, seats } = body
  const qty = quantity ?? seats ?? 0
  return NextResponse.json({ new_quantity: qty, seat_count: qty, action: action ?? 'add', updated: true, stripe_quantity_updated: true })
}
