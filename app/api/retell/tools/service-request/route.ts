import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      member_id,
      service_type,
      description,
      preferred_date,
      urgency = 'routine',
    } = body.args ?? body

    if (!member_id || !service_type || !description) {
      return NextResponse.json(
        { error: 'member_id, service_type, and description are required' },
        { status: 400 }
      )
    }

    const { data: member, error: memberErr } = await admin
      .from('members')
      .select('id, full_name, preferred_name, plan_tier')
      .eq('id', member_id)
      .single()

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const { data: booking, error: bookingErr } = await (admin.from as any)('service_bookings').insert({
  member_id,
  service_type,
  booking_details: {
    description,
    urgency,
    source: 'aria_call',
  },
  requested_for: preferred_date ?? null,
  status: 'requested',
  notes: `Created by Aria during call. Urgency: ${urgency}. ${description}`,
}).select('id').single()

    if (bookingErr) {
      console.error('[Retell Tool] service-request insert error:', bookingErr)
      return NextResponse.json(
        { error: 'Failed to create service request' },
        { status: 500 }
      )
    }

    await admin.from('alerts').insert({
      member_id,
      alert_type: 'service_request',
      severity: urgency === 'urgent' ? 'urgent' : 'informational',
      message: `${member.preferred_name} requested ${service_type} during Aria call: "${description}"`,
      metadata: {
        service_booking_id: booking.id,
        service_type,
        urgency,
        source: 'aria_call',
      },
    })

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      result: `I've submitted your ${service_type} request and your care team will follow up soon. Is there anything else I can help you with today?`,
    })
  } catch (error) {
    console.error('[Retell Tool] service-request error:', error)
    return NextResponse.json(
      { error: 'Service request tool failed' },
      { status: 500 }
    )
  }
}
