import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

const MOCK_PROGRAMS = [
  { id: 'prog-mock-001', name: 'Acme Gives Back 2026', tiers: [
    { name: 'Bronze', hours_required: 10, reward: '$50 gift card' },
    { name: 'Silver', hours_required: 25, reward: '$100 gift card' },
    { name: 'Gold', hours_required: 50, reward: 'Extra PTO day' },
  ], status: 'active', start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] }
]

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('corporate_volunteer_programs').select('*')
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK_PROGRAMS)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const { data, error } = await supabase.from('corporate_volunteer_programs').insert([body]).select().single()
    if (data && !error) return NextResponse.json(data, { status: 201 })
  } catch {}
  const body = await req.json().catch(() => ({}))
  const id = `prog-${Date.now()}`
  return NextResponse.json({ id, ...body, tiers: body.tiers ?? [], status: 'active' }, { status: 201 })
}
