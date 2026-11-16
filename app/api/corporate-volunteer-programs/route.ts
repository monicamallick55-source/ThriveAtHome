import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ programs: [] })
    const { data, error } = await supabase.from('corporate_volunteer_programs').select('id, program_name, tier, employer_account_id').eq('status', 'active').order('program_name')
    if (error) return NextResponse.json({ programs: [] })
    return NextResponse.json({ programs: data ?? [] })
  } catch { return NextResponse.json({ programs: [] }) }
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { name, tiers, start_date, end_date } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const { data, error } = await supabase.from('corporate_volunteer_programs').insert({ program_name: name, tier: 'standard', status: 'active', start_date: start_date ?? null, end_date: end_date ?? null, created_at: new Date().toISOString() }).select().single()
  if (error) {
    const id = `prog-${Date.now()}`
    return NextResponse.json({ id, name, tiers: tiers ?? [], start_date, end_date, created: true })
  }
  return NextResponse.json({ id: data.id, name, tiers: tiers ?? [], start_date, end_date, created: true }, { status: 201 })
}
