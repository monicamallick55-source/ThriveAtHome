// Placeholder — real implementation added in M10 (Phase 21)
import type { SmsProvider } from '../interfaces/SmsProvider'

export class TwilioSmsProvider implements SmsProvider {
  async send(_to: string, _body: string): Promise<void> {
    throw new Error('[TwilioSmsProvider] Not yet implemented — add in M10')
  }
  async sendUrgent(_to: string, _body: string): Promise<void> {
    throw new Error('[TwilioSmsProvider] Not yet implemented — add in M10')
  }
}
