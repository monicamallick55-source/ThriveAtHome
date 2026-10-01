// Retell tool: request_callback — caller asks to be called back.
// Members: saves a callback_requests row; cron picks it up and places the outbound call.
// Anyone else (family, volunteer, staff, unknown): a navigator task with their number, role and message.
import { toolAdmin, resolveToolCaller, createToolTask, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const caller = await resolveToolCaller(args, ctx)
  const memberId = caller.memberId
  // Retell's standard names (requested_time, reason) and ours (preferred_time, notes) are both accepted
  const preferredTime = str(args.preferred_time) ?? str(args.requested_time) // ISO string or natural language like "3pm today"
  const notes = str(args.notes) ?? str(args.reason)

  if (!memberId) {
    const message = [notes, preferredTime ? `preferred time: ${preferredTime}` : null].filter(Boolean).join(' — ') || 'Asked for a callback'
    const { ok } = await createToolTask(caller, { taskType: 'callback_request', heading: 'Callback requested', message, callId: ctx.callId })
    if (!ok) return { status: 500, body: { error: 'Failed to save callback request' } }
    return {
      status: 200,
      body: {
        success: true,
        result: caller.phone
          ? `Thank you. I've passed your message to our care team, and someone will call you back at this number${preferredTime ? ` around ${preferredTime}` : ''}. Is there anything else before we hang up?`
          : `Thank you. I've passed your message to our care team so they can follow up with you.`,
      },
    }
  }

  const admin = toolAdmin()
  const { data: member, error: memberErr } = await admin
    .from('members')
    .select('id, preferred_name')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !member) return { status: 404, body: { error: 'Member not found' } }

  // ISO date in the future → use it; otherwise keep the phrase as a note
  let parsedTime: string | null = null
  let timeNote = notes ?? ''
  if (preferredTime) {
    const d = new Date(preferredTime)
    if (!isNaN(d.getTime()) && d > new Date()) {
      parsedTime = d.toISOString()
    } else {
      timeNote = preferredTime + (notes ? ` — ${notes}` : '')
    }
  }

  const { error: insertErr } = await admin.from('callback_requests').insert({
    member_id: memberId,
    requested_via: 'inbound_call',
    preferred_time: parsedTime,
    notes: timeNote || null,
    status: 'pending',
  })

  if (insertErr) {
    console.error('[Retell Tool] request-callback insert error:', insertErr)
    return { status: 500, body: { error: 'Failed to save callback request' } }
  }

  const timePhrase = parsedTime
    ? `at ${new Date(parsedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : preferredTime
      ? `around ${preferredTime}`
      : 'as soon as possible'

  return {
    status: 200,
    body: {
      success: true,
      result: `Perfect, I'll call you back ${timePhrase}, ${member.preferred_name}. You'll see my number come up on your phone. Is there anything else before we hang up?`,
    },
  }
}
