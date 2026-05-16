// Stub implementation — logs calls, no real scheduling. Replaced in M8 with RetellCallProvider.
import type { CallProvider, CallContext } from '../interfaces/CallProvider'

export class StubCallProvider implements CallProvider {
  async scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string> {
    console.log(`[STUB][Call] Would schedule call for ${ctx.preferredName} (member: ${memberId}) at ${phone.substring(0, 6)}xxx`)
    return `stub-call-id-${Date.now()}`
  }
}
