import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const { data } = await supabase
    .from('marketplace_providers')
    .select('id, name, category, rating, price_range, description')
    .eq(category ? 'category' : 'id', category ?? 'id')
    .limit(20)

  return NextResponse.json({ providers: data ?? [], total: data?.length ?? 0 })
}
