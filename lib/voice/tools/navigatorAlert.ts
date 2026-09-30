// Retell tool: create_navigator_alert.
// Args: { alert_type: string, message: string, priority?: string }
import { toolAdmin, memberIdFrom, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const memberId = memberIdFrom(args, ctx)
  const message = str(args.message)
  const alertType = str(args.alert_type)
  const priority = str(args.priority)

  if (!memberId || !message) {
    return { status: 200, body: { result: 'Noted.' } }
  }

  const { error } = await toolAdmin().from('navigator_alerts').insert({
    member_id: memberId,
    alert_type: alertType ?? 'general',
    message,
    priority: priority ?? 'medium',
    source: 'aria_call',
    acknowledged: false,
  })

  if (error) {
    console.error('[navigator-alert] insert failed:', error)
    return { status: 200, body: { result: 'Noted — your care team will follow up.' } }
  }

  console.log(`[navigator-alert] member=${memberId} type=${alertType} priority=${priority}`)
  return { status: 200, body: { result: 'I\'ve let your care team know. Someone will be in touch with you soon.' } }
}
