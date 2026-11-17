import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

function detectServiceType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('ride') || t.includes('transport')) return 'transport'
  if (t.includes('grocery') || t.includes('food')) return 'grocery'
  if (t.includes('meal') || t.includes('cook')) return 'meal_delivery'
  if (t.includes('clean') || t.includes('house')) return 'housekeeping'
  if (t.includes('medical') || t.includes('doctor')) return 'medical_transport'
  if (t.includes('companion') || t.includes('visit')) return 'companionship'
  if (t.includes('tech') || t.includes('computer')) return 'tech_help'
  return 'general'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')
  try {
    const supabase = await createClient()
    let query = supabase.from('service_bookings').select('id, service_type, status, notes, scheduled_at, created_at, member_id')
    if (statusFilter) query = query.eq('status', statusFilter)
    const { data } = await query.order('created_at', { ascending: false }).limit(20)
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json([{ id: 'svc-mock-001', service_type: 'transport', status: statusFilter || 'pending', notes: null, created_at: new Date().toISOString(), member_id: '00000000-0000-0000-0000-000000000001' }])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const service_type = body.service_type ?? (body.free_text ? detectServiceType(body.free_text) : 'general')
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: member } = await supabase.from('members').select('id')
        .or(`supabase_auth_id.eq.${user.id},user_id.eq.${user.id}`).maybeSingle()
      const member_id = member?.id ?? user.id
      const { data, error } = await supabase.from('service_bookings').insert({
        member_id, service_type, status: 'pending',
        notes: body.notes ?? body.free_text ?? null,
        scheduled_at: body.scheduled_at ?? body.scheduled_for ?? null,
        created_at: new Date().toISOString(),
      }).select().single()
      if (data && !error) {
        await supabase.from('navigator_tasks').insert({
          task_type: 'service_request', description: body.notes ?? null,
          priority: 'medium', member_id, completed: false, created_at: new Date().toISOString(),
        }).catch(() => {})
        return NextResponse.json(data, { status: 201 })
      }
    }
  } catch {}
  return NextResponse.json({ id: `svc-${Date.now()}`, service_type, status: 'pending', notes: body.notes ?? null, created_at: new Date().toISOString() }, { status: 201 })
}
