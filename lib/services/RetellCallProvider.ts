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
    const agentId = process.env.RETELL_AGENT_ID
    if (!agentId) throw new Error('[RetellCallProvider] RETELL_AGENT_ID not set')

    const body = {
      from_number: this.fromNumber,
      to_number: phone,
      agent_id: agentId,
      retell_llm_dynamic_variables: {
        preferred_name: ctx.preferredName,
        call_type: ctx.callType ?? 'check_in',
        interests: ctx.interests.join(', '),
        preferred_language: ctx.preferredLanguage,
        prior_call_summaries: ctx.priorCallSummaries.join('\n'),
      },
      metadata: {
        member_id: memberId,
        preferred_name: ctx.preferredName,
        interests: ctx.interests,
        preferred_language: ctx.preferredLanguage,
        prior_call_summaries: ctx.priorCallSummaries,
        call_type: ctx.callType ?? 'check_in',
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
}
// force redeploy Wed Sep 23 03:34:23 UTC 2026
