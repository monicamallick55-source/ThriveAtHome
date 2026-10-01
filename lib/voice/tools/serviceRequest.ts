// Retell tool: create_service_request.
// Args: { service_type, description, preferred_date?, urgency? }
// Members: a service_bookings row plus a navigator task so a human follows up (alerts has no
// 'service_request' type). Non-member callers get a navigator task with their number and role.
import { toolAdmin, resolveToolCaller, createToolTask, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const caller = await resolveToolCaller(args, ctx)
  const memberId = caller.memberId
  const serviceType = str(args.service_type)
  const description = str(args.description)
  const preferredDate = str(args.preferred_date)
  const urgency = str(args.urgency) ?? 'routine'
  const priority = urgency === 'urgent' ? 'high' : 'medium'

  if (!serviceType || !description) {
    return { status: 400, body: { error: 'service_type and description are required' } }
  }

  if (!memberId) {
    const { ok } = await createToolTask(caller, {
      taskType: 'service_request',
      heading: `Service request (${serviceType}${preferredDate ? `, wanted ${preferredDate}` : ''}) from a call`,
      message: description,
      priority,
      callId: ctx.callId,
    })
    if (!ok) return { status: 500, body: { error: 'Failed to create service request' } }
    return { status: 200, body: { success: true, result: `Thank you. I've passed your ${serviceType} request to our care team and someone will follow up with you.` } }
  }

  const admin = toolAdmin()
  const { data: member, error: memberErr } = await admin
    .from('members')
    .select('id, full_name, preferred_name, plan_tier')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !member) return { status: 404, body: { error: 'Member not found' } }

  // requested_for is a timestamp — keep natural-language dates ("next Tuesday") in the details instead
  const parsed = preferredDate ? new Date(preferredDate) : null
  const requestedFor = parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : null

  const { data: booking, error: bookingErr } = await admin
    .from('service_bookings')
    .insert({
      member_id: memberId,
      service_type: serviceType,
      booking_details: { description, urgency, preferred_date: preferredDate ?? null, source: 'voice_call' },
      requested_for: requestedFor,
      status: 'requested',
      notes: `Requested during a call. Urgency: ${urgency}. ${description}`,
    })
    .select('id')
    .maybeSingle()

  if (bookingErr || !booking) {
    console.error('[Retell Tool] service-request insert error:', bookingErr)
    return { status: 500, body: { error: 'Failed to create service request' } }
  }

  await createToolTask(caller, {
    taskType: 'service_request',
    heading: `${member.preferred_name} requested ${serviceType} (booking ${booking.id})`,
    message: description,
    priority,
    callId: ctx.callId,
  })

  return {
    status: 200,
    body: {
      success: true,
      booking_id: booking.id,
      result: `I've submitted your ${serviceType} request and your care team will follow up soon. Is there anything else I can help you with today?`,
    },
  }
}
