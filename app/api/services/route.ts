import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
function detectServiceType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('ride') || t.includes('transport') || t.includes('drive')) return 'transport'
  if (t.includes('grocery') || t.includes('food') || t.includes('shop')) return 'grocery'
  if (t.includes('meal') || t.includes('cook')) return 'meal_delivery'
  if (t.includes('clean') || t.includes('house')) return 'housekeeping'
  if (t.includes('medical') || t.includes('doctor')) return 'medical_transport'
  if (t.includes('companion') || t.includes('visit')) return 'companionship'
  if (t.includes('tech') || t.includes('computer')) return 'tech_help'
  return 'general'
}
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ data: [] })
  const { data, error } = await supabase.from('service_bookings').select('id, service_type, status, notes, scheduled_for, created_at').eq('member_id', member.id).order('created_at', { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  const service_type = body.service_type ?? (body.free_text ? detectServiceType(body.free_text) : 'general')
  const { data, error } = await supabase.from('service_bookings').insert({ member_id: member.id, service_type, status: 'pending', notes: body.notes ?? body.free_text ?? null, scheduled_for: body.scheduled_for ?? null, created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('navigator_tasks').insert({ title: `Service request: ${service_type}`, description: body.notes ?? body.free_text ?? null, status: 'pending', priority: 'normal', member_id: member.id, created_by: user.id, assigned_to: user.id, created_at: new Date().toISOString() }).catch(() => {})
  return NextResponse.json(data, { status: 201 })
}
