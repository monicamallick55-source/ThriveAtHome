import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@thriveathome.app'

function getFrom() { return `Thrive@Home <${FROM}>` }

function baseTemplate(subject: string, html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject}</title>
  <style>body{font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:0}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb}
  h1{color:#111827;font-size:1.5rem}p{color:#374151;line-height:1.6}
  .btn{display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:0.8rem;color:#9ca3af}</style>
  </head><body><div class="wrap">${html}
  <div class="footer">Thrive@Home · Helping seniors thrive at home · <a href="https://thriveathome.app">thriveathome.app</a></div>
  </div></body></html>`
}

async function send(to: string, subject: string, html: string, from?: string) {
  const result = await resend.emails.send({
    from: from || getFrom(),
    to: [to],
    subject,
    html: baseTemplate(subject, html),
  })
  if (result.error) throw new Error(result.error.message)
}

export class ResendEmailProvider {
  async sendPostCallSummary(to: string, data: { memberName: string; summary: string; date: string }): Promise<void> {
    await send(to, `Your check-in summary — ${data.date}`,
      `<h1>Hi ${data.memberName},</h1><p>Here's your Aria check-in summary for ${data.date}:</p><p>${data.summary}</p>`,
      `Thrive@Home Care <care@thriveathome.app>`)
  }

  async sendAlert(to: string, memberName: string, alertMessage: string): Promise<void> {
    await send(to, `Alert for ${memberName}`,
      `<h1>Alert</h1><p>${alertMessage}</p>`,
      `Thrive@Home Care <care@thriveathome.app>`)
  }

  async sendPaymentFailed(to: string, memberName: string, updateUrl: string): Promise<void> {
    await send(to, 'Action required: Update your payment method',
      `<h1>Hi ${memberName},</h1><p>Your recent payment failed. Please update your payment method to continue your Thrive@Home membership.</p>
      <p><a href="${updateUrl}" class="btn">Update Payment</a></p>`,
      `Thrive@Home Billing <billing@thriveathome.app>`)
  }

  async sendWelcome(to: string, memberName: string): Promise<void> {
    await send(to, `Welcome to Thrive@Home, ${memberName}!`,
      `<h1>Welcome, ${memberName}!</h1>
      <p>You're all set. Aria will check in with you daily, and your family dashboard is ready.</p>
      <p><a href="https://thriveathome.app/dashboard" class="btn">Go to your dashboard</a></p>`,
      `Thrive@Home <welcome@thriveathome.app>`)
  }

  async sendGriefSupportNotification(to: string, memberName: string, details: string): Promise<void> {
    await send(to, 'Grief support resources for you',
      `<h1>Hi ${memberName},</h1><p>We noticed you may benefit from some additional support. Here are some resources:</p><p>${details}</p>`,
      `Thrive@Home Care <care@thriveathome.app>`)
  }

  async sendWeeklyDigest(to: string, memberName: string, content: string): Promise<void> {
    await send(to, `Your weekly Thrive@Home digest`,
      `<h1>Hi ${memberName},</h1><p>Here's your weekly summary:</p>${content}`,
      `Thrive@Home Care <care@thriveathome.app>`)
  }

  async sendMonthlySummary(to: string, memberName: string, content: string): Promise<void> {
    await send(to, `Your monthly Thrive@Home summary`,
      `<h1>Hi ${memberName},</h1><p>Here's your monthly summary:</p>${content}`,
      `Thrive@Home Care <care@thriveathome.app>`)
  }

  async sendVolunteerApplicationNotification(to: string, applicantName: string, applicantEmail: string, city: string, serviceTypes: string[]): Promise<void> {
    await send(to, `New volunteer application: ${applicantName}`,
      `<h1>New Volunteer Application</h1>
      <p><strong>Name:</strong> ${applicantName}<br>
      <strong>Email:</strong> ${applicantEmail}<br>
      <strong>City:</strong> ${city}<br>
      <strong>Services:</strong> ${serviceTypes.join(', ')}</p>`)
  }

  async sendEmployeeInvitation(to: string, companyName: string, acceptUrl: string): Promise<void> {
    await send(to, `You're invited to Thrive@Home via ${companyName}`,
      `<h1>You're invited!</h1>
      <p>${companyName} has invited you to Thrive@Home as an employee benefit.</p>
      <p><a href="${acceptUrl}" class="btn">Accept Invitation</a></p>`)
  }

  async sendOrgNewsletter(to: string, recipientName: string, orgName: string, subject: string, body: string): Promise<void> {
    await send(to, subject,
      `<h1>Hi ${recipientName},</h1><p>A message from ${orgName}:</p>${body}`)
  }

  async sendDonationReceipt(to: string, donorName: string, amountCents: number, donationDate: string, isRecurring: boolean): Promise<void> {
    const amount = `$${(amountCents / 100).toFixed(2)}`
    await send(to, `Thank you for your ${isRecurring ? 'recurring ' : ''}donation`,
      `<h1>Thank you, ${donorName}!</h1>
      <p>We received your ${isRecurring ? 'recurring ' : ''}donation of <strong>${amount}</strong> on ${donationDate}.</p>
      <p>Your contribution helps seniors thrive at home.</p>`,
      `Thrive@Home <noreply@thriveathome.app>`)
  }

  async sendGeneric(to: string, subject: string, html: string): Promise<void> {
    await send(to, subject, html)
  }

  async sendOrgInvite(to: string, orgName: string, inviterName: string): Promise<void> {
    await send(to, `${inviterName} invited you to join ${orgName} on Thrive@Home`,
      `<h1>You're invited!</h1>
      <p>${inviterName} has invited you to join <strong>${orgName}</strong> on Thrive@Home.</p>
      <p><a href="https://thriveathome.app/join" class="btn">Accept Invitation</a></p>`)
  }

  async sendOrgAdminInvite(to: string, orgName: string, inviterName: string, acceptUrl: string): Promise<void> {
    await send(to, `You're invited to administer ${orgName} on Thrive@Home`,
      `<h1>Admin invitation</h1>
      <p>${inviterName} has invited you to be an administrator for <strong>${orgName}</strong> on Thrive@Home.</p>
      <p><a href="${acceptUrl}" class="btn">Accept & Set Up Account</a></p>`)
  }
}

export const emailProvider = new ResendEmailProvider()
