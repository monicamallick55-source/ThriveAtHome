// Stub implementation — logs messages, no real SMS. Replaced in M10 with TwilioSmsProvider.
import type { SmsProvider } from '../interfaces/SmsProvider'

export class StubSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS] Would send to ${to.substring(0, 6)}xxx: "${body.substring(0, 100)}..."`)
  }
  async sendUrgent(to: string, body: string): Promise<void> {
    console.log(`[STUB][SMS][URGENT] Would send to ${to.substring(0, 6)}xxx: "${body.substring(0, 100)}..."`)
  }
}
