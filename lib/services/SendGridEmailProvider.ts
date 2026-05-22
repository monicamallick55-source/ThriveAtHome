// Placeholder — real implementation added in M10 (Phase 22)
import type { EmailProvider, PostCallEmailData } from '../interfaces/EmailProvider'

export class SendGridEmailProvider implements EmailProvider {
  async sendPostCallSummary(_to: string, _data: PostCallEmailData): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
  async sendAlert(_to: string, _memberName: string, _alertMessage: string): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
  async sendPaymentFailed(_to: string, _memberName: string, _updateUrl: string): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
  async sendWelcome(_to: string, _memberName: string): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
  async sendGriefSupportNotification(_to: string, _memberName: string, _details: string): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
  async sendWeeklyDigest(_to: string, _memberName: string, _content: string): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
  async sendMonthlySummary(_to: string, _memberName: string, _content: string): Promise<void> {
    throw new Error('[SendGridEmailProvider] Not yet implemented — add in M10')
  }
}
