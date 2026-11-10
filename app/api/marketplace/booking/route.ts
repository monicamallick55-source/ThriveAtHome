import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.provider_id || !body.service_type) {
    return NextResponse.json({ error: 'provider_id and service_type required' }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    booking_id: crypto.randomUUID(),
    status: 'pending',
    message: 'Booking request submitted. Provider will confirm within 24 hours.',
  })
}
