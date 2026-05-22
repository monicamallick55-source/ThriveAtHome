// Placeholder — real implementation added in M8 (Phase 17)
import type { CallProvider, CallContext } from '../interfaces/CallProvider'

export class RetellCallProvider implements CallProvider {
  async scheduleCall(_memberId: string, _phone: string, _ctx: CallContext): Promise<string> {
    throw new Error('[RetellCallProvider] Not yet implemented — add in M8')
  }
}
