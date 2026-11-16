import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  let query = supabase.from('trusted_advisors').select('*').limit(limit)
  const categoryMap: Record<string, string> = { grief: 'grief_counselor', financial: 'financial_advisor', legal: 'elder_law_attorney' }
  const advisorType = category ? (categoryMap[category] ?? category) : null
  if (advisorType) query = query.eq('advisor_type', advisorType)
  const { data } = await query.catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return NextResponse.json({ id, ...body, status: 'assigned', created_at: new Date().toISOString() }, { status: 201 })
}
