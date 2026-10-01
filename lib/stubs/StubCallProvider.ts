// Stub implementation — logs calls, no real scheduling. Replaced in M8 with RetellCallProvider.
import type { CallProvider, CallContext } from '../interfaces/CallProvider'
import { AGENTS } from '../voice/agents'

export class StubCallProvider implements CallProvider {
  async scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string> {
    const agent = ctx.agent ?? 'aria'
    const vars = ctx.dynamicVariables ? ` vars: ${Object.keys(ctx.dynamicVariables).join(',')}` : ''
    console.log(`[STUB][Call] ${agent} → ${phone.substring(0, 6)}xxx (${AGENTS[agent].envVar}, ${ctx.callType ?? 'check_in'}, member: ${memberId})${vars}`)
    return `stub-call-id-${Date.now()}`
  }
}
