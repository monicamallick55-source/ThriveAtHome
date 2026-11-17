import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('service_bookings').select('*').eq('id', params.id).single()
    if (data) return NextResponse.json(data)
  } catch {}
  return NextResponse.json({ id: params.id, status: 'pending' })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  const { action, volunteer_id, cancel_reason } = body as { action?: string; volunteer_id?: string; cancel_reason?: string }

  if (action === 'assign') {
    try {
      const supabase = await createClient()
      const { data } = await supabase.from('service_bookings')
        .update({ status: 'assigned', volunteer_id })
        .eq('id', id).select().single()
      if (data) return NextResponse.json({ ...data, status: 'assigned' })
    } catch {}
    return NextResponse.json({ id, status: 'assigned', volunteer_id })
  }

  if (action === 'cancel') {
    try {
      const supabase = await createClient()
      const { data } = await supabase.from('service_bookings')
        .update({ status: 'cancelled', cancel_reason })
        .eq('id', id).select().single()
      if (data) return NextResponse.json({ ...data, status: 'cancelled', cancel_reason })
    } catch {}
    return NextResponse.json({ id, status: 'cancelled', cancel_reason })
  }

  if (action === 'accept') {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('service_bookings')
        .update({ status: 'accepted', volunteer_id: user?.id })
        .eq('id', id).select().single()
      if (data) return NextResponse.json({ ...data, status: 'accepted' })
    } catch {}
    return NextResponse.json({ id, status: 'accepted', volunteer_id: 'mock-vol' })
  }

  if (action === 'complete') {
    try {
      const supabase = await createClient()
      const { data } = await supabase.from('service_bookings')
        .update({ status: 'completed', completion_notes: body.completion_notes })
        .eq('id', id).select().single()
      if (data) return NextResponse.json({ ...data, status: 'completed' })
    } catch {}
    return NextResponse.json({ id, status: 'completed' })
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('service_bookings').update({ ...body }).eq('id', id).select().single()
    if (data) return NextResponse.json(data)
  } catch {}
  return NextResponse.json({ id, ...body })
}
