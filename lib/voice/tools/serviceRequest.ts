// Retell tool: create_service_request.
// Args: { service_type, description, preferred_date?, urgency? }
import { toolAdmin, memberIdFrom, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const memberId = memberIdFrom(args, ctx)
  const serviceType = str(args.service_type)
  const description = str(args.description)
  const preferredDate = str(args.preferred_date)
  const urgency = str(args.urgency) ?? 'routine'

  if (!memberId || !serviceType || !description) {
    return { status: 400, body: { error: 'member_id, service_type, and description are required' } }
  }

  const admin = toolAdmin()
  const { data: member, error: memberErr } = await admin
    .from('members')
    .select('id, full_name, preferred_name, plan_tier')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !member) return { status: 404, body: { error: 'Member not found' } }

  const { data: booking, error: bookingErr } = await admin
    .from('service_bookings')
    .insert({
      member_id: memberId,
      service_type: serviceType,
      booking_details: { description, urgency, source: 'aria_call' },
      requested_for: preferredDate ?? null,
      status: 'requested',
      notes: `Created by Aria during call. Urgency: ${urgency}. ${description}`,
    })
    .select('id')
    .maybeSingle()

  if (bookingErr || !booking) {
    console.error('[Retell Tool] service-request insert error:', bookingErr)
    return { status: 500, body: { error: 'Failed to create service request' } }
  }

  const { error: alertErr } = await admin.from('alerts').insert({
    member_id: memberId,
    alert_type: 'service_request',
    severity: urgency === 'urgent' ? 'urgent' : 'informational',
    message: `${member.preferred_name} requested ${serviceType} during Aria call: "${description}"`,
    metadata: { service_booking_id: booking.id, service_type: serviceType, urgency, source: 'aria_call' },
  })
  if (alertErr) console.error('[Retell Tool] service-request alert insert error:', alertErr.message)

  return {
    status: 200,
    body: {
      success: true,
      booking_id: booking.id,
      result: `I've submitted your ${serviceType} request and your care team will follow up soon. Is there anything else I can help you with today?`,
    },
  }
}
