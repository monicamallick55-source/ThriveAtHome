import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

function detectServiceType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('ride') || t.includes('transport') || t.includes('drive') || t.includes('car')) return 'transport'
  if (t.includes('grocery') || t.includes('food') || t.includes('shop')) return 'grocery'
  if (t.includes('meal') || t.includes('cook') || t.includes('dinner')) return 'meal_delivery'
  if (t.includes('clean') || t.includes('house') || t.includes('laundry')) return 'housekeeping'
  if (t.includes('medical') || t.includes('doctor') || t.includes('appointment')) return 'medical_transport'
  if (t.includes('companion') || t.includes('visit') || t.includes('talk')) return 'companionship'
  if (t.includes('tech') || t.includes('computer') || t.includes('phone')) return 'tech_help'
  return 'general'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const statusRaw = searchParams.get('status')
  const statusMap: Record<string, string> = { pending: 'requested', accepted: 'confirmed' }
  const status = statusRaw ? (statusMap[statusRaw] ?? statusRaw) : null
  const volunteerEligible = searchParams.get('volunteer_eligible')
  let query = supabase.from('service_bookings').select('id, service_type, status, notes, scheduled_for, created_at, member_id')
  if (status) query = query.eq('status', status)
  query = query.order('created_at', { ascending: false }).limit(20)
  const { data } = await query.catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data: member } = await supabase.from('members').select('id')
    .or(`supabase_auth_id.eq.${user.id},user_id.eq.${user.id}`).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  const service_type = body.service_type ?? (body.free_text ? detectServiceType(body.free_text) : 'general')
  const { data, error } = await supabase.from('service_bookings').insert({
    member_id: member.id,
    service_type,
    status: 'requested',
    notes: body.notes ?? body.free_text ?? null,
    scheduled_for: body.scheduled_for ?? null,
    created_at: new Date().toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('navigator_tasks').insert({
    task_type: `service_request`,
    description: body.notes ?? body.free_text ?? null,
    priority: 'medium',
    member_id: member.id,
    completed: false,
    created_at: new Date().toISOString(),
  }).catch(() => {})
  return NextResponse.json(data, { status: 201 })
}
