// Retell tool: flag_welfare_concern.
// Args: { concern_type, description, severity? }
import { toolAdmin, memberIdFrom, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const memberId = memberIdFrom(args, ctx)
  const concernType = str(args.concern_type)
  const description = str(args.description)
  const severity = str(args.severity) ?? 'concern'

  if (!memberId || !concernType || !description) {
    return { status: 400, body: { error: 'member_id, concern_type, and description are required' } }
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

  const { error: alertErr } = await admin.from('alerts').insert({
    member_id: memberId,
    alert_type: alertType,
    severity,
    message: `Aria flagged ${concernType} concern for ${member.preferred_name}: "${description}"`,
    metadata: { concern_type: concernType, source: 'aria_call', flagged_during_call: true },
  })
  if (alertErr) console.error('[Retell Tool] welfare-check alert insert error:', alertErr.message)

  if (severity === 'emergency') {
    const { error: emErr } = await admin.from('emergency_log').insert({
      member_id: memberId,
      trigger: 'aria_call',
      description: `${concernType}: ${description}`,
      severity: 'emergency',
    })
    if (emErr) console.error('[Retell Tool] welfare-check emergency_log insert error:', emErr.message)
  }

  const spokenResponse = severity === 'emergency'
    ? `I'm alerting your care team right now. If this is a life-threatening emergency, please call 911 immediately. Stay on the line with me.`
    : `I've let your care team know. Someone will be in touch with you soon. Is there anything else I can do for you right now?`

  return { status: 200, body: { success: true, alert_created: true, result: spokenResponse } }
}
