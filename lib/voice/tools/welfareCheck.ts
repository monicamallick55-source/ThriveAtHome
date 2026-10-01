// Retell tool: flag_welfare_concern.
// Args: { concern_type, description, severity? }
// Saves an alert (and an emergency_log row for emergencies) on the member. A family caller's
// concern is saved on the member they are family of; other non-members get a navigator task.
import { toolAdmin, resolveToolCaller, createToolTask, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

const SEVERITIES = new Set(['informational', 'concern', 'urgent', 'emergency'])

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const caller = await resolveToolCaller(args, ctx)
  const memberId = caller.memberId ?? caller.familyOfMemberId
  const concernType = str(args.concern_type)
  const description = str(args.description)
  const sevArg = str(args.severity)?.toLowerCase()
  const severity = sevArg && SEVERITIES.has(sevArg) ? sevArg : sevArg === 'high' || sevArg === 'critical' ? 'urgent' : 'concern'

  if (!concernType || !description) {
    return { status: 400, body: { error: 'concern_type and description are required' } }
  }

  const emergencyLine = `I'm alerting your care team right now. If this is a life-threatening emergency, please call 911 immediately. Stay on the line with me.`

  if (!memberId) {
    const { ok } = await createToolTask(caller, {
      taskType: 'welfare_concern',
      heading: `Welfare concern (${concernType}, ${severity}) reported on a call`,
      message: description,
      priority: severity === 'emergency' ? 'critical' : severity === 'urgent' ? 'high' : 'medium',
      callId: ctx.callId,
    })
    if (!ok) return { status: 500, body: { error: 'Failed to save welfare concern' } }
    return {
      status: 200,
      body: {
        success: true,
        result: severity === 'emergency' ? emergencyLine : `Thank you for telling me. I've passed that to our care team and someone will follow up.`,
      },
    }
  }

  const admin = toolAdmin()
  const { data: member, error: memberErr } = await admin
    .from('members')
    .select('id, full_name, preferred_name')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !member) return { status: 404, body: { error: 'Member not found' } }

  const alertType = concernType === 'fall' ? 'fall'
    : concernType === 'emergency' ? 'emergency'
    : concernType === 'medication' ? 'medication_miss'
    : 'crisis'
  const reporter = caller.memberId ? 'Member' : `${caller.role} caller ${caller.phone ?? ''}`.trim()

  const { error: alertErr } = await admin.from('alerts').insert({
    member_id: memberId,
    alert_type: alertType,
    severity,
    message: `${concernType} concern for ${member.preferred_name} raised on a call (${reporter}): "${description}"`,
    metadata: { concern_type: concernType, source: 'voice_call', flagged_during_call: true, caller_role: caller.role, retell_call_id: ctx.callId ?? null },
  })
  if (alertErr) {
    console.error('[Retell Tool] welfare-check alert insert error:', alertErr.message)
    return { status: 500, body: { error: 'Failed to save welfare concern' } }
  }

  if (severity === 'emergency') {
    const { data: callRow } = ctx.callId
      ? await admin.from('check_in_calls').select('id').eq('retell_call_id', ctx.callId).maybeSingle()
      : { data: null }
    const { error: emErr } = await admin.from('emergency_log').insert({
      member_id: memberId,
      call_id: callRow?.id ?? null,
      alert_type: alertType,
      triggered_phrase: `${concernType}: ${description}`,
    })
    if (emErr) console.error('[Retell Tool] welfare-check emergency_log insert error:', emErr.message)
  }

  const spokenResponse = severity === 'emergency'
    ? emergencyLine
    : `I've let your care team know. Someone will be in touch with you soon. Is there anything else I can do for you right now?`

  return { status: 200, body: { success: true, alert_created: true, result: spokenResponse } }
}
