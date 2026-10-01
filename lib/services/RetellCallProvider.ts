// Real Retell AI call provider — makes outbound calls via Retell API + Twilio numbers
import type { CallProvider, CallContext } from '../interfaces/CallProvider'
import { AGENTS, agentIdFor } from '../voice/agents'
import { envKey } from '../env'

export class RetellCallProvider implements CallProvider {
  private apiKey: string
  private fromNumber: string

  constructor() {
    this.apiKey = envKey('RETELL_API_KEY') ?? ''
    this.fromNumber = envKey('TWILIO_PHONE_NUMBER') ?? ''
  }

  async scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string> {
    const agentName = ctx.agent ?? 'aria'
    const agentId = agentIdFor(agentName)
    if (!agentId) throw new Error(`[RetellCallProvider] ${AGENTS[agentName].envVar} is not set`)

    const body = {
      from_number: this.fromNumber,
      to_number: phone,
      agent_id: agentId,
      // Custom variables first so they can never overwrite member_id / call_type / agent_name
      retell_llm_dynamic_variables: {
        ...ctx.dynamicVariables,
        member_id: memberId,
        preferred_name: ctx.preferredName,
        call_type: ctx.callType ?? 'check_in',
        interests: ctx.interests.join(', '),
        preferred_language: ctx.preferredLanguage,
        prior_call_summaries: ctx.priorCallSummaries.join('\n'),
      },
      metadata: {
        ...ctx.dynamicVariables,
        member_id: memberId,
        preferred_name: ctx.preferredName,
        interests: ctx.interests,
        preferred_language: ctx.preferredLanguage,
        prior_call_summaries: ctx.priorCallSummaries,
        call_type: ctx.callType ?? 'check_in',
        agent_name: agentName,
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
    console.log(`[RetellCallProvider] ${agentName} call scheduled for member ${memberId}: call_id=${data.call_id}`)
    return data.call_id
  }
}
// force redeploy Thu Sep 24 19:07:00 UTC 2026
