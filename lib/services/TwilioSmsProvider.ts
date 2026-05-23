import twilio from 'twilio'
import { requireServerEnv } from '../env'
import type { SmsProvider } from '../interfaces/SmsProvider'

export class TwilioSmsProvider implements SmsProvider {
  private getClient(): twilio.Twilio {
    return twilio(
      requireServerEnv('TWILIO_ACCOUNT_SID'),
      requireServerEnv('TWILIO_AUTH_TOKEN')
    )
  }

  async send(to: string, body: string): Promise<void> {
    try {
      await this.getClient().messages.create({
        body,
        from: requireServerEnv('TWILIO_PHONE_NUMBER'),
        to,
      })
      console.log(`[TwilioSMS] Sent to ${to.substring(0, 6)}xxx`)
    } catch (e) {
      console.error('[TwilioSMS] send failed:', e)
      throw new Error(`[TwilioSMS] Failed to send: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async sendUrgent(to: string, body: string): Promise<void> {
    await this.send(to, `🚨 URGENT — ${body}`)
  }
}
