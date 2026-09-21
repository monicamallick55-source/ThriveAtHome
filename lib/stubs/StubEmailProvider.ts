// Stub implementation — logs emails, no real sending. Replaced in M10 with SendGridEmailProvider.
import type { EmailProvider, PostCallEmailData } from '../interfaces/EmailProvider'

export class StubEmailProvider implements EmailProvider {
  async sendPostCallSummary(to: string, data: PostCallEmailData): Promise<void> {
    console.log(`[STUB][Email] Post-call summary for ${data.seniorName} → ${to}`)
  }
  async sendAlert(to: string, memberName: string, alertMessage: string): Promise<void> {
    console.log(`[STUB][Email] Alert for ${memberName} → ${to}: ${alertMessage.substring(0, 80)}`)
  }
  async sendPaymentFailed(to: string, memberName: string, _updateUrl: string): Promise<void> {
    console.log(`[STUB][Email] Payment failed for ${memberName} → ${to}`)
  }
  async sendWelcome(to: string, memberName: string): Promise<void> {
    console.log(`[STUB][Email] Welcome for ${memberName} → ${to}`)
  }
  async sendGriefSupportNotification(to: string, memberName: string, details: string): Promise<void> {
    console.log(`[STUB][Email] Grief support for ${memberName} → ${to}: ${details.substring(0, 80)}`)
  }
  async sendWeeklyDigest(to: string, memberName: string, _content: string): Promise<void> {
    console.log(`[STUB][Email] Weekly digest for ${memberName} → ${to}`)
  }
  async sendMonthlySummary(to: string, memberName: string, _content: string): Promise<void> {
    console.log(`[STUB][Email] Monthly summary for ${memberName} → ${to}`)
  }
  async sendVolunteerApplicationNotification(to: string, applicantName: string, applicantEmail: string, city: string, serviceTypes: string[]): Promise<void> {
    console.log(`[STUB][EMAIL] Would send volunteer application notification to ${to}: ${applicantName} (${applicantEmail}) from ${city} — services: ${serviceTypes.join(', ')}`)
  }
  async sendEmployeeInvitation(to: string, companyName: string, acceptUrl: string): Promise<void> {
    console.log(`[STUB][Email] Employee invitation → ${to} from ${companyName}: ${acceptUrl}`)
  }
  async sendOrgNewsletter(to: string, recipientName: string, orgName: string, subject: string, body: string): Promise<void> {
    console.log(`[STUB][Email] Org newsletter "${subject}" from ${orgName} → ${recipientName} <${to}>: ${body.substring(0, 80)}...`)
  }
  async sendDonationReceipt(to: string, donorName: string, amountCents: number, donationDate: string, isRecurring: boolean): Promise<void> {
    console.log(`[STUB][Email] Tax receipt (PDF) for $${(amountCents / 100).toFixed(2)}${isRecurring ? '/mo' : ''} gift from ${donorName} on ${donationDate} → ${to}`)
  }
}
