// Retell tool: create_service_request.
// Uses autoScheduler to decide auto-confirm vs navigator review.
// Args: { service_type, description, preferred_date?, urgency? }
// Members: a service_bookings row plus a navigator task so a human follows up (alerts has no
// 'service_request' type). Non-member callers get a navigator task with their number and role.
import { toolAdmin, resolveToolCaller, createToolTask, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'
import { classify, buildTaskDescription, type ServiceType } from '@/lib/agents/autoScheduler'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const caller = await resolveToolCaller(args, ctx)
  const memberId = caller.memberId
  const serviceType = str(args.service_type)
  const subtype = str(args.subtype) ?? undefined
  const description = str(args.description)
  const preferredDate = str(args.preferred_date)
  const urgency = (str(args.urgency) ?? 'routine') as 'routine' | 'urgent'

  if (!serviceType || !description) {
    return { status: 400, body: { error: 'service_type and description are required' } }
  }

  // ── Non-member caller — always create task ───────────────────────────────
  if (!memberId) {
    const { ok } = await createToolTask(caller, {
      taskType: 'service_request',
      heading: `Service request (${serviceType}${preferredDate ? `, wanted ${preferredDate}` : ''}) from a call`,
      message: description,
      priority: urgency === 'urgent' ? 'high' : 'medium',
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

  // Check if this is the member's first booking of this type
  const { count: existingCount } = await admin
    .from('service_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('service_type', serviceType) as any as { count: number | null }

  const isFirstBooking = (existingCount ?? 0) === 0

  // ── Auto-schedule decision ────────────────────────────────────────────────
  const decision = classify({
    serviceType:   serviceType as ServiceType,
    subtype,
    urgency,
    isRecurring:   false,
    hasMatchedId:  false,   // voice calls don't pre-match a companion
    isFirstBooking,
    voiceSource:   true,
  })

  const parsed = preferredDate ? new Date(preferredDate) : null
  const requestedFor = parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : null

  const { data: booking, error: bookingErr } = await admin
    .from('service_bookings')
    .insert({
      member_id: memberId,
      service_type: serviceType,
      booking_details: { description, urgency, subtype: subtype ?? null, preferred_date: preferredDate ?? null, source: 'voice_call' },
      requested_for: requestedFor,
      status: decision.route === 'auto' ? 'confirmed' : 'requested',
      notes: `Requested during a call. Urgency: ${urgency}. ${description}. Auto-route: ${decision.route} — ${decision.reason}`,
    })
    .select('id')
    .maybeSingle()

  if (bookingErr || !booking) {
    console.error('[Retell Tool] service-request insert error:', bookingErr)
    return { status: 500, body: { error: 'Failed to create service request' } }
  }

  // ── If review needed, create navigator task ───────────────────────────────
  if (decision.route === 'review') {
    await createToolTask(caller, {
      taskType: 'service_request',
      heading: buildTaskDescription(
        { serviceType: serviceType as ServiceType, subtype, urgency, voiceSource: true },
        decision,
        booking.id,
        (member as any).preferred_name ?? (member as any).full_name ?? 'Member'
      ),
      message: description,
      priority: decision.priority ?? 'medium',
      callId: ctx.callId,
    })
  }

  // ── Response to Retell ────────────────────────────────────────────────────
  const memberResponse = decision.route === 'auto'
    ? `Great — your ${serviceType.replace(/_/g, ' ')} is confirmed. You'll receive a confirmation shortly. Is there anything else I can help you with?`
    : `I've submitted your ${serviceType.replace(/_/g, ' ')} request and your care team will follow up with you soon. Is there anything else I can help you with today?`

  return {
    status: 200,
    body: {
      success: true,
      booking_id: booking.id,
      auto_confirmed: decision.route === 'auto',
      result: memberResponse,
    },
  }
}
