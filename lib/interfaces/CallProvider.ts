// Interface for scheduling AI check-in calls with seniors.
import type { AgentName } from '../voice/agents'

export interface CallContext {
  preferredName: string
  interests: string[]
  priorCallSummaries: string[]
  preferredLanguage: string
  callType?: 'onboarding' | 'check_in' | 'callback' | 'celebration' | 'reminder'
  agent?: AgentName // defaults to 'aria'
  /** Extra Retell dynamic variables for the agent's prompt (e.g. celebration_type, item_name) */
  dynamicVariables?: Record<string, string>
}

export interface CallProvider {
  scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string>
}
