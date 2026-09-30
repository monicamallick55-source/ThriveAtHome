// Interface for scheduling AI check-in calls with seniors.
import type { AgentName } from '../voice/agents'

export interface CallContext {
  preferredName: string
  interests: string[]
  priorCallSummaries: string[]
  preferredLanguage: string
  callType?: 'onboarding' | 'check_in' | 'callback' | 'celebration' | 'reminder'
  agent?: AgentName // defaults to 'aria'
}

export interface CallProvider {
  scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string>
}
