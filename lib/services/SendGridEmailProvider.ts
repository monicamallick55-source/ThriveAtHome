import sgMail from '@sendgrid/mail'
import { requireServerEnv } from '../env'
import type { EmailProvider, PostCallEmailData, CallScores } from '../interfaces/EmailProvider'

function getFrom(): string {
  return requireServerEnv('SENDGRID_FROM_EMAIL')
}

function initClient(): void {
  sgMail.setApiKey(requireServerEnv('SENDGRID_API_KEY'))
}

function moodEmoji(score: number | null): string {
  if (score === null) return '—'
  if (score >= 8) return '😊'
  if (score >= 6) return '🙂'
  if (score >= 4) return '😐'
  return '😔'
}

function scoreDisplay(score: number | null): string {
  return score !== null ? `${score}/10` : '—'
}

function medicationDisplay(taken: boolean | null): string {
  if (taken === true) return '✓ Taken'
  if (taken === false) return '✗ Not taken'
  return '—'
}

function dashboardUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://thriveathome.dev'
  return `${base}/dashboard`
}

function baseTemplate(title: string, body: string, seniorName?: string): string {
  const subtitle = seniorName ? `Check-in update for ${seniorName}` : title
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF5;font-family:-apple-system,Arial,sans-serif;font-size:18px;color:#2D2A25;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF5;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

<!-- HEADER -->
<tr><td style="background-color:#1B3A6B;border-radius:12px 12px 0 0;padding:32px 40px;">
<p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FAFAF5;letter-spacing:-0.01em;">ThriveAtHome</p>
<p style="margin:8px 0 0;font-size:18px;color:rgba(250,250,245,0.8);">${subtitle}</p>
</td></tr>

<!-- BODY -->
<tr><td style="background-color:#FFFFFF;padding:40px;border-left:1px solid #E8E4DC;border-right:1px solid #E8E4DC;">
${body}
</td></tr>

<!-- FOOTER -->
<tr><td style="background-color:#F5F1E8;border-radius:0 0 12px 12px;padding:24px 40px;border:1px solid #E8E4DC;border-top:none;">
<p style="margin:0;font-size:14px;color:#7A746C;">You're receiving this because you're connected on ThriveAtHome. <a href="${dashboardUrl()}" style="color:#1B3A6B;">Manage preferences</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function scoresHtml(scores: CallScores): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr>
<td style="padding:12px 16px;background-color:#F5F1E8;border-radius:8px;text-align:center;width:25%;">
<p style="margin:0;font-size:22px;">${moodEmoji(scores.mood_score)}</p>
<p style="margin:4px 0 0;font-size:14px;color:#5E5852;font-weight:600;">MOOD</p>
<p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#1B3A6B;">${scoreDisplay(scores.mood_score)}</p>
</td>
<td width="8"></td>
<td style="padding:12px 16px;background-color:#F5F1E8;border-radius:8px;text-align:center;width:25%;">
<p style="margin:0;font-size:22px;">⚡</p>
<p style="margin:4px 0 0;font-size:14px;color:#5E5852;font-weight:600;">ENERGY</p>
<p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#1B3A6B;">${scoreDisplay(scores.energy_score)}</p>
</td>
<td width="8"></td>
<td style="padding:12px 16px;background-color:#F5F1E8;border-radius:8px;text-align:center;width:25%;">
<p style="margin:0;font-size:22px;">💚</p>
<p style="margin:4px 0 0;font-size:14px;color:#5E5852;font-weight:600;">COMFORT</p>
<p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#1B3A6B;">${scoreDisplay(scores.pain_score)}</p>
</td>
<td width="8"></td>
<td style="padding:12px 16px;background-color:#F5F1E8;border-radius:8px;text-align:center;width:25%;">
<p style="margin:0;font-size:22px;">💊</p>
<p style="margin:4px 0 0;font-size:14px;color:#5E5852;font-weight:600;">MEDS</p>
<p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#1B3A6B;">${medicationDisplay(scores.medication_taken)}</p>
</td>
</tr>
</table>`
}

function ctaButton(label: string, url: string): string {
  return `<p style="text-align:center;margin:32px 0 0;">
<a href="${url}" style="display:inline-block;background-color:#1A7A6A;color:#FFFFFF;font-size:18px;font-weight:600;padding:16px 36px;border-radius:8px;text-decoration:none;">${label}</a>
</p>`
}

export class SendGridEmailProvider implements EmailProvider {
  private init(): void {
    initClient()
  }

  async sendPostCallSummary(to: string, data: PostCallEmailData): Promise<void> {
    this.init()
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    const alertBlock = data.hasAlerts && data.alertMessage
      ? `<div style="margin:24px 0;padding:20px 24px;background-color:#FEF3C7;border-left:4px solid #D97706;border-radius:8px;">
          <p style="margin:0;font-weight:700;color:#92400E;font-size:18px;">Alert from today's call</p>
          <p style="margin:8px 0 0;color:#78350F;font-size:17px;">${data.alertMessage}</p>
         </div>`
      : ''
    const body = `<p style="margin:0 0 8px;font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#5E5852;">Today's check-in — ${today}</p>
${scoresHtml(data.scores)}
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:19px;font-style:italic;color:#2D2A25;line-height:1.6;">${data.summary || 'No summary available for this call.'}</p>
${alertBlock}
${ctaButton('View Full Dashboard', data.dashboardUrl || dashboardUrl())}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `ThriveAtHome: Check-in update for ${data.seniorName}`,
      html: baseTemplate(`Check-in update for ${data.seniorName}`, body, data.seniorName),
    })
    console.log(`[SendGrid] Post-call summary sent to ${to.substring(0, 6)}xxx`)
  }

  async sendAlert(to: string, memberName: string, alertMessage: string): Promise<void> {
    this.init()
    const body = `<div style="padding:24px;background-color:#FEF3C7;border-left:4px solid #D97706;border-radius:8px;margin-bottom:24px;">
<p style="margin:0;font-weight:700;color:#92400E;font-size:20px;">Alert for ${memberName}</p>
<p style="margin:12px 0 0;color:#78350F;font-size:18px;line-height:1.5;">${alertMessage}</p>
</div>
${ctaButton('View Dashboard', dashboardUrl())}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `ThriveAtHome Alert: ${memberName}`,
      html: baseTemplate(`Alert: ${memberName}`, body),
    })
    console.log(`[SendGrid] Alert sent to ${to.substring(0, 6)}xxx`)
  }

  async sendPaymentFailed(to: string, memberName: string, updateUrl: string): Promise<void> {
    this.init()
    const body = `<p style="margin:0 0 16px;font-size:19px;line-height:1.5;">We were unable to process your payment for ${memberName}'s ThriveAtHome subscription.</p>
<p style="margin:0 0 24px;font-size:17px;color:#5E5852;line-height:1.5;">Please update your payment method to continue receiving care coordination for ${memberName}.</p>
${ctaButton('Update Payment Method', updateUrl)}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `Action required: Update payment for ${memberName}'s ThriveAtHome plan`,
      html: baseTemplate('Payment failed', body),
    })
    console.log(`[SendGrid] Payment failed email sent to ${to.substring(0, 6)}xxx`)
  }

  async sendWelcome(to: string, memberName: string): Promise<void> {
    this.init()
    const body = `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;line-height:1.4;">Welcome to ThriveAtHome.</p>
<p style="margin:0 0 16px;font-size:18px;line-height:1.6;">You're now set up to receive daily check-in updates for <strong>${memberName}</strong>. Aria will call ${memberName} at their preferred time each day and you'll hear how they're doing right here.</p>
<p style="margin:0 0 24px;font-size:18px;line-height:1.6;">Log in to your dashboard to complete setup and customise your preferences.</p>
${ctaButton('Go to Dashboard', dashboardUrl())}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `Welcome to ThriveAtHome — you're all set`,
      html: baseTemplate('Welcome to ThriveAtHome', body),
    })
    console.log(`[SendGrid] Welcome email sent to ${to.substring(0, 6)}xxx`)
  }

  async sendGriefSupportNotification(to: string, memberName: string, details: string): Promise<void> {
    this.init()
    const body = `<p style="margin:0 0 16px;font-size:18px;line-height:1.5;">During ${memberName}'s check-in, our care team noted something worth your attention.</p>
<div style="padding:20px 24px;background-color:#F5F1E8;border-radius:8px;margin-bottom:24px;">
<p style="margin:0;font-size:17px;line-height:1.6;color:#2D2A25;">${details}</p>
</div>
<p style="margin:0 0 24px;font-size:17px;color:#5E5852;line-height:1.5;">A member of our care team will follow up. You can also reach us via the concierge line from your dashboard.</p>
${ctaButton('View Dashboard', dashboardUrl())}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `ThriveAtHome: Care note for ${memberName}`,
      html: baseTemplate(`Care note for ${memberName}`, body),
    })
    console.log(`[SendGrid] Grief support notification sent to ${to.substring(0, 6)}xxx`)
  }

  async sendWeeklyDigest(to: string, memberName: string, content: string): Promise<void> {
    this.init()
    const body = `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;line-height:1.4;">Weekly update for ${memberName}</p>
<div style="font-size:18px;line-height:1.6;color:#2D2A25;">${content}</div>
${ctaButton('View Full Dashboard', dashboardUrl())}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `ThriveAtHome: Weekly update for ${memberName}`,
      html: baseTemplate(`Weekly update for ${memberName}`, body),
    })
    console.log(`[SendGrid] Weekly digest sent to ${to.substring(0, 6)}xxx`)
  }

  async sendMonthlySummary(to: string, memberName: string, content: string): Promise<void> {
    this.init()
    const body = `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;line-height:1.4;">Monthly care summary for ${memberName}</p>
<div style="font-size:18px;line-height:1.6;color:#2D2A25;">${content}</div>
${ctaButton('View Full Dashboard', dashboardUrl())}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `ThriveAtHome: Monthly care summary for ${memberName}`,
      html: baseTemplate(`Monthly care summary for ${memberName}`, body),
    })
    console.log(`[SendGrid] Monthly summary sent to ${to.substring(0, 6)}xxx`)
  }

  async sendVolunteerApplicationNotification(to: string, applicantName: string, applicantEmail: string, city: string, serviceTypes: string[]): Promise<void> {
    initClient()
    const body = `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;line-height:1.4;">New volunteer application received</p>
<table style="width:100%;border-collapse:collapse;font-size:18px;line-height:1.6;">
  <tr><td style="padding:8px 0;color:#5E5852;width:160px;">Name</td><td style="padding:8px 0;color:#2D2A25;font-weight:500;">${applicantName}</td></tr>
  <tr><td style="padding:8px 0;color:#5E5852;">Email</td><td style="padding:8px 0;color:#2D2A25;">${applicantEmail}</td></tr>
  <tr><td style="padding:8px 0;color:#5E5852;">Location</td><td style="padding:8px 0;color:#2D2A25;">${city || '—'}</td></tr>
  <tr><td style="padding:8px 0;color:#5E5852;">Services</td><td style="padding:8px 0;color:#2D2A25;">${serviceTypes.join(', ') || '—'}</td></tr>
</table>
${ctaButton('Review Application', dashboardUrl() + '/admin/volunteers')}`
    await sgMail.send({
      to,
      from: getFrom(),
      subject: `ThriveAtHome: New volunteer application from ${applicantName}`,
      html: baseTemplate('New Volunteer Application', body),
    })
    console.log(`[SendGrid] Volunteer application notification sent to ${to.substring(0, 6)}xxx`)
  }
}
