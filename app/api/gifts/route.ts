import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

const MOCK_GIFTS = [
  { id: '00000000-0000-0000-0000-000000000011', name: 'Flower Bouquet', price_cents: 3500, status: 'active', category: 'flowers' },
  { id: '00000000-0000-0000-0000-000000000012', name: 'Gift Basket', price_cents: 5000, status: 'active', category: 'food' },
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const { data } = await supabase.from('gift_catalog').select('*').eq('status', 'active').order('name').limit(50)
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK_GIFTS)
}
