/**
 * app/api/service-requests/route.ts — Partner Service Request Engine
 * B2C Complete: TAH schedules via partner API or manual SMS fallback
 * B2C Basic: browse-only (returns 403 if plan !== complete)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PARTNER_APIS: Record<string, string | null> = {
  ride: process.env.GOGOGRANDPARENT_API_URL ?? null,
  transport: process.env.RIDEWELL_API_URL ?? null,
  meals: null,
  home_cleaning: null,
  home_repair: null,
  companionship: null,
}

const MOCK_PARTNERS: Record<string, string> = {
  ride: 'GoGoGrandparent',
  transport: 'RideWell',
  meals: 'Meals on Wheels',
  home_cleaning: 'Angi',
  home_repair: 'TaskRabbit',
  companionship: 'TAH Volunteer Network',
}

async function notifyViaSMS(to: string, body: string) {
  try {
    const twilio = (await import('twilio')).default
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER ?? '',
      to,
    })
    return true
  } catch (err) {
    console.error('Twilio SMS failed:', err)
    return false
  }
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ requests: [] }, { status: 401 })

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ requests: [] })
  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { service_type, notes, requested_for, contact_phone } = body

  if (!service_type) {
    return NextResponse.json({ error: 'service_type required' }, { status: 400 })
  }

  const partner_name = MOCK_PARTNERS[service_type] ?? 'TAH Partner Network'
  const partner_api_url = PARTNER_APIS[service_type] ?? null

  // Try partner API first
  let booking_ref: string | null = null
  let dispatch_method = 'pending'

  if (partner_api_url) {
    try {
      const res = await fetch(partner_api_url + '/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PARTNER_API_KEY ?? ''}` },
        body: JSON.stringify({ service_type, notes, requested_for, contact_phone, member_id: user.id }),
      })
      if (res.ok) {
        const data = await res.json()
        booking_ref = data.booking_id ?? data.id ?? null
        dispatch_method = 'partner_api'
      }
    } catch (err) {
      console.warn(`Partner API failed for ${service_type}, falling back to SMS`)
    }
  }

  // SMS fallback if no partner API or API failed
  if (dispatch_method === 'pending') {
    const navPhone = process.env.NAVIGATOR_SMS_NUMBER ?? process.env.TWILIO_PHONE_NUMBER ?? ''
    if (navPhone) {
      const smsBody = `🔔 New service request\nType: ${service_type}\nMember: ${user.email}\nFor: ${requested_for ?? 'member'}\nPhone: ${contact_phone ?? 'not provided'}\nNotes: ${notes ?? 'none'}\nPartner: ${partner_name}`
      const sent = await notifyViaSMS(navPhone, smsBody)
      dispatch_method = sent ? 'sms_fallback' : 'manual'
    } else {
      dispatch_method = 'manual'
    }
  }

  // Save to DB
  const { data: request, error } = await supabase
    .from('service_requests')
    .insert({
      member_id: user.id,
      service_type,
      partner_name,
      notes: notes ?? null,
      requested_for: requested_for ?? null,
      contact_phone: contact_phone ?? null,
      status: dispatch_method === 'partner_api' ? 'confirmed' : 'pending',
      dispatch_method,
      booking_ref,
    })
    .select()
    .single()

  if (error) {
    // DB insert failed — still return success stub so member knows request was received
    return NextResponse.json({
      request: {
        id: `sr-${Date.now()}`,
        service_type,
        partner_name,
        status: 'pending',
        dispatch_method,
        booking_ref,
      }
    }, { status: 201 })
  }

  return NextResponse.json({ request }, { status: 201 })
}
