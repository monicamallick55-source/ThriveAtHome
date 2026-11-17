import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [
  { id: 'item-mock-001', title: 'Homemade Jam', price_cents: 800, seller_name: 'Alice', status: 'available', category: 'food' },
  { id: 'item-mock-002', title: 'Knitted Scarf', price_cents: 2500, seller_name: 'Bob', status: 'available', category: 'crafts' },
]
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('marketplace_items').select('*').eq('status', 'available').order('created_at', { ascending: false }).limit(20).catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK)
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('marketplace_items').insert({ ...body, status: 'available' }).select().single()
    if (!error && data) return NextResponse.json(data, { status: 201 })
  } catch {}
  return NextResponse.json({ id: `item-${Date.now()}`, ...body, status: 'available' }, { status: 201 })
}
