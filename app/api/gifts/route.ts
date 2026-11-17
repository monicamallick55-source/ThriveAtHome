import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOCK_DATA = [{ id: "gift-mock-001", name: "Flower Bouquet", price_cents: 4500, category: "flowers" }, { id: "gift-mock-002", name: "Book Bundle", price_cents: 2500, category: "books" }]

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.from('gifts').select('id, gift_type, gift_description, amount_cents, status, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(50).catch(() => ({ data: null }))
  if (data && data.length > 0) return NextResponse.json(data)
  return NextResponse.json(MOCK_DATA)
}
