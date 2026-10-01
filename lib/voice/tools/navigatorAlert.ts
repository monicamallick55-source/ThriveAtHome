// Retell tool: create_navigator_alert.
// Args: { alert_type: string, message: string, priority?: string }
// Saved as a navigator_tasks row (there is no navigator_alerts table). Non-member callers
// (family, volunteer, staff, unknown) get a task with their number, role and message.
import { resolveToolCaller, createToolTask, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const caller = await resolveToolCaller(args, ctx)
  const message = str(args.message)
  const alertType = str(args.alert_type) ?? 'general'
  const priority = str(args.priority)

  if (!message) return { status: 200, body: { result: 'Noted.' } }

  const { ok } = await createToolTask(caller, {
    taskType: 'navigator_alert',
    heading: `Navigator alert (${alertType}) raised on a call`,
    message,
    priority,
    callId: ctx.callId,
  })
  if (!ok) return { status: 200, body: { result: 'Noted — our care team will follow up.' } }

  console.log(`[navigator-alert] role=${caller.role} member=${caller.memberId ?? '-'} type=${alertType} priority=${priority ?? 'medium'}`)
  return {
    status: 200,
    body: {
      result: caller.memberId
        ? 'I\'ve let your care team know. Someone will be in touch with you soon.'
        : 'Thank you. I\'ve passed that to our care team and someone will follow up with you.',
    },
  }
}
