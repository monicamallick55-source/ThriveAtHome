import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { org_id, seats } = body
  if (!org_id || !seats) return NextResponse.json({ error: 'org_id and seats required' }, { status: 400 })
  const { data, error } = await supabase.from('organizations').update({ seat_count: seats, updated_at: new Date().toISOString() }).eq('id', org_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ org_id, seats, updated: true, stripe_quantity_updated: true })
}
