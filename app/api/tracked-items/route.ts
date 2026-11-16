import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let q = supabase.from('tracked_items').select('*').order('created_at', { ascending: false }).limit(50)
  if (status) q = q.eq('status', status)
  const { data } = await q
  return NextResponse.json(data || [])
}
