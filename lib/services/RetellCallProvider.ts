// Real Retell AI call provider — makes outbound calls via Retell API + Twilio numbers
import type { CallProvider, CallContext } from '../interfaces/CallProvider'

export class RetellCallProvider implements CallProvider {
  private apiKey: string
  private fromNumber: string

  constructor() {
    this.apiKey = process.env.RETELL_API_KEY!
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER!
  }

  async scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string> {
    // Select agent based on call type
    const agentId = this.getAgentId(ctx.callType ?? 'aria')

    const body = {
      from_number: this.fromNumber,
      to_number: phone,
      agent_id: agentId,
      metadata: {
        member_id: memberId,
        preferred_name: ctx.preferredName ?? '',
        call_type: ctx.callType ?? 'aria',
        topics_of_interest: ctx.topicsOfInterest ?? [],
        upcoming_reminders: ctx.upcomingReminders ?? [],
        grief_support_active: ctx.griefSupportActive ?? false,
      },
    }

    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`[RetellCallProvider] API error ${response.status}: ${error}`)
    }

    const data = await response.json()
    console.log(`[RetellCallProvider] Call scheduled for member ${memberId}: call_id=${data.call_id}`)
    return data.call_id
  }

  private getAgentId(callType: string): string {
    const agents: Record<string, string | undefined> = {
      aria:        process.env.RETELL_AGENT_ID,
      rosa:        process.env.RETELL_ROSA_AGENT_ID,
      joy:         process.env.RETELL_JOY_AGENT_ID,
      grace:       process.env.RETELL_GRACE_AGENT_ID,
      hope:        process.env.RETELL_HOPE_AGENT_ID,
      claire:      process.env.RETELL_CLAIRE_AGENT_ID,
      sam:         process.env.RETELL_SAM_AGENT_ID,
      morgan:      process.env.RETELL_MORGAN_AGENT_ID,
      nova:        process.env.RETELL_NOVA_AGENT_ID,
      alex:        process.env.RETELL_ALEX_AGENT_ID,
      quinn:       process.env.RETELL_QUINN_AGENT_ID,
      jordan:      process.env.RETELL_JORDAN_AGENT_ID,
    }
    const agentId = agents[callType] ?? process.env.RETELL_AGENT_ID
    if (!agentId) throw new Error(`[RetellCallProvider] No agent ID for call type: ${callType}`)
    return agentId
  }
}
