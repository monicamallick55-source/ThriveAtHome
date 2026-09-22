// Interface for sending transactional emails to family members.

export interface CallScores {
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  medication_taken: boolean | null
  alert_flags: string[]
}

export interface PostCallEmailData {
  seniorName: string
  summary: string
  scores: CallScores
  hasAlerts: boolean
  alertMessage?: string
  dashboardUrl: string
}

export interface EmailProvider {
  sendPostCallSummary(to: string, data: PostCallEmailData): Promise<void>
  sendAlert(to: string, memberName: string, alertMessage: string): Promise<void>
  sendPaymentFailed(to: string, memberName: string, updateUrl: string): Promise<void>
  sendWelcome(to: string, memberName: string): Promise<void>
  sendGriefSupportNotification(to: string, memberName: string, details: string): Promise<void>
  sendWeeklyDigest(to: string, memberName: string, content: string): Promise<void>
  sendMonthlySummary(to: string, memberName: string, content: string): Promise<void>
  sendVolunteerApplicationNotification(to: string, applicantName: string, applicantEmail: string, city: string, serviceTypes: string[]): Promise<void>
  sendEmployeeInvitation(to: string, companyName: string, acceptUrl: string): Promise<void>
  sendOrgNewsletter(to: string, recipientName: string, orgName: string, subject: string, body: string): Promise<void>
  sendDonationReceipt(to: string, donorName: string, amountCents: number, donationDate: string, isRecurring: boolean): Promise<void>
  sendOrgInvite(to: string, orgName: string, inviterName: string): Promise<void>
}
