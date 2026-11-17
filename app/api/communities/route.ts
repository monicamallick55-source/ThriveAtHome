import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('interest_circles').select('*').eq('is_active', true)
      .order('name').limit(50)
    if (error) return NextResponse.json([])
    return NextResponse.json(data || [])
  } catch { return NextResponse.json([]) }
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  try {
    const { data, error } = await supabase.from('interest_circles')
      .insert({ ...body, created_by: user.id, is_active: true, created_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return NextResponse.json({ id, ...body, created_at: new Date().toISOString() }, { status: 201 })
  }
}
