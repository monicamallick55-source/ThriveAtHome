// Interface for scheduling AI check-in calls with seniors.

export interface CallContext {
  preferredName: string
  interests: string[]
  priorCallSummaries: string[]
  preferredLanguage: string
  callType?: 'onboarding' | 'check_in' | 'callback'
}

export interface CallProvider {
  scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string>
}
