// lib/email/templates.ts
// SendGrid email templates — all HTML email bodies for ThriveAtHome

export type EmailTemplate = {
  subject: string
  html: string
  text: string
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;color:#1a1a1a}
  .outer{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:#fff;border-radius:12px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .logo{font-family:system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;color:#2d6a4f;text-transform:uppercase;margin-bottom:32px}
  h1{font-family:system-ui,sans-serif;font-size:24px;font-weight:800;color:#111;margin:0 0 16px}
  p{font-size:16px;line-height:1.7;margin:0 0 16px;color:#333}
  .cta{display:inline-block;margin:24px 0 0;background:#2d6a4f;color:#fff!important;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none}
  .divider{border:none;border-top:1px solid #eee;margin:32px 0}
  .small{font-size:13px;color:#888;font-family:system-ui,sans-serif;line-height:1.6}
  .highlight{background:#f0faf5;border-left:3px solid #2d6a4f;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0}
  .highlight p{margin:0;font-size:15px}
  .alert{background:#fff8f0;border-left:3px solid #e07b00;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0}
  .alert p{margin:0;font-size:15px}
  .stat-row{display:flex;gap:16px;margin:24px 0}
  .stat{flex:1;text-align:center;padding:16px;background:#f9f9f7;border-radius:8px}
  .stat-num{font-family:system-ui,sans-serif;font-size:28px;font-weight:800;color:#2d6a4f}
  .stat-label{font-family:system-ui,sans-serif;font-size:12px;color:#888;margin-top:4px}
  footer{margin-top:24px;padding:0 8px}
</style>
</head>
<body>
<div class="outer">
  <div class="card">
    <div class="logo">🌿 ThriveAtHome</div>
    ${body}
  </div>
  <footer>
    <p class="small">
      ThriveAtHome, Inc. · San Francisco, CA<br>
      You're receiving this because you have an active ThriveAtHome account.<br>
      <a href="{{unsubscribe_url}}" style="color:#888">Unsubscribe</a> ·
      <a href="https://thriveathome.com/privacy" style="color:#888">Privacy Policy</a>
    </p>
  </footer>
</div>
</body>
</html>`
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export function welcomeEmail(params: {
  firstName: string
  plan: 'basics' | 'complete'
  ariaCaller?: string
}): EmailTemplate {
  const planLabel = params.plan === 'complete' ? 'ThriveAtHome Complete' : 'ThriveAtHome Basics'
  const ariaName = params.ariaCaller || 'Aria'

  const html = wrap('Welcome to ThriveAtHome', `
    <h1>Welcome, ${params.firstName}! 🎉</h1>
    <p>You're now part of the ThriveAtHome community — and we couldn't be happier to have you.</p>
    <p>Your <strong>${planLabel}</strong> membership is active. Here's what happens next:</p>
    <div class="highlight">
      <p>📞 <strong>${ariaName} will call you soon</strong> to introduce herself and set up your wellness check-in schedule. She'll follow your lead on timing and topics.</p>
    </div>
    <p>In the meantime, here's what you can explore in your dashboard:</p>
    <ul style="padding-left:20px;line-height:2">
      <li>Complete your <strong>wellness profile</strong> so ${ariaName} can personalize your check-ins</li>
      <li>Invite <strong>family members</strong> to your Family Portal</li>
      <li>Browse <strong>local volunteers</strong> ready to help with rides, errands, or companionship</li>
      ${params.plan === 'complete' ? '<li>Schedule your first call with your <strong>Care Navigator</strong></li>' : ''}
    </ul>
    <a href="https://thriveathome.com/dashboard" class="cta">Go to My Dashboard →</a>
    <hr class="divider">
    <p class="small">Questions? Reply to this email or reach us at hello@thriveathome.com. We're here for you.</p>
  `)

  const text = `Welcome to ThriveAtHome, ${params.firstName}!

Your ${planLabel} membership is active.

${ariaName} will call you soon to introduce herself and set up your wellness check-in schedule.

Get started at: https://thriveathome.com/dashboard

Questions? Email hello@thriveathome.com`

  return { subject: `Welcome to ThriveAtHome, ${params.firstName}! 🌿`, html, text }
}

// ─── Weekly Summary Email ─────────────────────────────────────────────────────

export function weeklySummaryEmail(params: {
  firstName: string
  checkInsCompleted: number
  checkInsMissed: number
  wellnessScore: number // 1-10
  weekOf: string // e.g. "Oct 27 – Nov 2"
  highlights: string[]
  upcomingEvents?: string[]
  familyRecipient?: boolean
  memberName?: string
}): EmailTemplate {
  const recipient = params.familyRecipient ? params.memberName || 'your loved one' : 'you'
  const recipientPossessive = params.familyRecipient ? `${params.memberName || 'your loved one'}'s` : 'your'

  const highlightItems = params.highlights
    .map(h => `<li style="margin-bottom:8px">${h}</li>`)
    .join('')

  const upcomingItems = params.upcomingEvents?.length
    ? `<p><strong>Coming up this week:</strong></p><ul style="padding-left:20px;line-height:2">${params.upcomingEvents.map(e => `<li>${e}</li>`).join('')}</ul>`
    : ''

  const scoreColor = params.wellnessScore >= 7 ? '#2d6a4f' : params.wellnessScore >= 5 ? '#e07b00' : '#c0392b'

  const html = wrap(`Weekly Wellness Summary – ${params.weekOf}`, `
    <h1>${recipientPossessive.charAt(0).toUpperCase() + recipientPossessive.slice(1)} Week in Review</h1>
    <p style="color:#888;font-family:system-ui,sans-serif;font-size:14px;margin-bottom:24px">${params.weekOf}</p>

    <div class="stat-row">
      <div class="stat">
        <div class="stat-num" style="color:${scoreColor}">${params.wellnessScore}/10</div>
        <div class="stat-label">Wellness Score</div>
      </div>
      <div class="stat">
        <div class="stat-num">${params.checkInsCompleted}</div>
        <div class="stat-label">Check-ins Completed</div>
      </div>
      <div class="stat">
        <div class="stat-num" style="color:${params.checkInsMissed > 0 ? '#e07b00' : '#2d6a4f'}">${params.checkInsMissed}</div>
        <div class="stat-label">Missed Check-ins</div>
      </div>
    </div>

    ${params.highlights.length > 0 ? `
    <p><strong>Highlights from ${recipient === 'you' ? 'your' : recipient + "'s"} week:</strong></p>
    <ul style="padding-left:20px;line-height:2">
      ${highlightItems}
    </ul>` : ''}

    ${upcomingItems}

    ${params.checkInsMissed > 2 ? `
    <div class="alert">
      <p>⚠️ ${params.checkInsMissed} check-ins were missed this week. ${params.familyRecipient ? 'You may want to reach out.' : 'We missed you! Reply to this email or call us if you need anything.'}</p>
    </div>` : ''}

    <a href="https://thriveathome.com/dashboard" class="cta">View Full Report →</a>
  `)

  const text = `${recipientPossessive.charAt(0).toUpperCase() + recipientPossessive.slice(1)} Week in Review — ${params.weekOf}

Wellness Score: ${params.wellnessScore}/10
Check-ins Completed: ${params.checkInsCompleted}
Missed: ${params.checkInsMissed}

${params.highlights.length > 0 ? 'Highlights:\n' + params.highlights.map(h => `• ${h}`).join('\n') : ''}

View your dashboard: https://thriveathome.com/dashboard`

  return {
    subject: `${params.familyRecipient ? params.memberName + "'s" : 'Your'} Weekly Wellness Summary – ${params.weekOf}`,
    html,
    text,
  }
}

// ─── Fraud Alert Email ────────────────────────────────────────────────────────

export function fraudAlertEmail(params: {
  firstName: string
  alertType: 'phone_scam' | 'gift_card' | 'lottery' | 'romance' | 'impersonation' | 'other'
  detectedDuring: string // e.g. "your check-in call with Aria on Nov 3"
  riskLevel: 'low' | 'medium' | 'high'
  details: string
  recommendedAction: string
  familyEmail?: string
  caseId: string
}): EmailTemplate {
  const alertLabels: Record<string, string> = {
    phone_scam: 'Potential Phone Scam',
    gift_card: 'Gift Card Scam Warning',
    lottery: 'Lottery/Prize Scam Warning',
    romance: 'Romance Scam Warning',
    impersonation: 'Government Impersonation Warning',
    other: 'Suspicious Activity Detected',
  }

  const riskColors: Record<string, string> = {
    low: '#2d6a4f',
    medium: '#e07b00',
    high: '#c0392b',
  }

  const riskLabel = params.riskLevel.charAt(0).toUpperCase() + params.riskLevel.slice(1)

  const html = wrap(`Fraud Alert: ${alertLabels[params.alertType]}`, `
    <h1>⚠️ Fraud Alert</h1>
    <p>Hi ${params.firstName}, our fraud detection system flagged a concern during ${params.detectedDuring}.</p>

    <div style="background:#fff5f5;border:1px solid #fcc;border-radius:8px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px"><strong>Alert Type:</strong> ${alertLabels[params.alertType]}</p>
      <p style="margin:0 0 8px"><strong>Risk Level:</strong> <span style="color:${riskColors[params.riskLevel]};font-weight:700">${riskLabel}</span></p>
      <p style="margin:0 0 8px"><strong>Case ID:</strong> ${params.caseId}</p>
      <p style="margin:0"><strong>Details:</strong> ${params.details}</p>
    </div>

    <p><strong>What we recommend:</strong></p>
    <div class="highlight">
      <p>${params.recommendedAction}</p>
    </div>

    <p><strong>Important reminders:</strong></p>
    <ul style="padding-left:20px;line-height:2">
      <li>Government agencies (IRS, Social Security, Medicare) <strong>never call to demand immediate payment</strong>.</li>
      <li>Legitimate companies <strong>never ask you to pay with gift cards</strong>.</li>
      <li>If you feel pressured, <strong>hang up and call us</strong> at 1-800-THRIVE1.</li>
      <li>You can report suspected fraud to the FTC at ReportFraud.ftc.gov.</li>
    </ul>

    <a href="https://thriveathome.com/dashboard/safety" class="cta">Review Safety Center →</a>
    <hr class="divider">
    <p class="small">
      Your Care Navigator has been notified and will follow up with you.
      ${params.familyEmail ? `A copy of this alert has also been sent to your designated family contact.` : ''}
      Case ID: ${params.caseId}
    </p>
  `)

  const text = `FRAUD ALERT — ${alertLabels[params.alertType]}

Hi ${params.firstName},

Our fraud detection flagged a concern during ${params.detectedDuring}.

Alert Type: ${alertLabels[params.alertType]}
Risk Level: ${riskLabel}
Case ID: ${params.caseId}
Details: ${params.details}

Recommended Action: ${params.recommendedAction}

Remember: Government agencies never demand immediate payment by phone. Legitimate companies never ask for gift cards.

If you feel pressured, call us: 1-800-THRIVE1

Review your Safety Center: https://thriveathome.com/dashboard/safety`

  return {
    subject: `⚠️ Fraud Alert: ${alertLabels[params.alertType]} Detected`,
    html,
    text,
  }
}

// ─── Gift Notification Email ──────────────────────────────────────────────────

export function giftNotificationEmail(params: {
  recipientName: string
  senderName: string
  giftType: 'subscription' | 'upgrade' | 'gift_card' | 'care_package'
  giftDescription: string
  message?: string
  redeemUrl?: string
  occasion?: string
}): EmailTemplate {
  const giftLabels: Record<string, string> = {
    subscription: 'ThriveAtHome Membership',
    upgrade: 'Plan Upgrade',
    gift_card: 'Gift Card',
    care_package: 'Care Package',
  }

  const html = wrap(`You received a gift from ${params.senderName}`, `
    <h1>You have a gift! 🎁</h1>
    <p>Hi ${params.recipientName},</p>
    <p><strong>${params.senderName}</strong> sent you a gift${params.occasion ? ` for ${params.occasion}` : ''}:</p>

    <div style="text-align:center;padding:32px;background:linear-gradient(135deg,#f0faf5,#e8f5ee);border-radius:12px;margin:24px 0">
      <div style="font-size:48px;margin-bottom:12px">🌿</div>
      <div style="font-family:system-ui,sans-serif;font-size:20px;font-weight:800;color:#2d6a4f;margin-bottom:8px">${giftLabels[params.giftType]}</div>
      <div style="font-size:16px;color:#333">${params.giftDescription}</div>
    </div>

    ${params.message ? `
    <div class="highlight">
      <p style="font-style:italic">"${params.message}"</p>
      <p style="margin:8px 0 0;font-size:14px;color:#555">— ${params.senderName}</p>
    </div>` : ''}

    ${params.redeemUrl ? `<a href="${params.redeemUrl}" class="cta">Redeem Your Gift →</a>` : `<a href="https://thriveathome.com/dashboard" class="cta">Go to My Dashboard →</a>`}

    <hr class="divider">
    <p class="small">This gift was sent through ThriveAtHome. If you have questions, contact us at hello@thriveathome.com.</p>
  `)

  const text = `You have a gift from ${params.senderName}!

Hi ${params.recipientName},

${params.senderName} sent you a ${giftLabels[params.giftType]}${params.occasion ? ` for ${params.occasion}` : ''}.

Gift: ${params.giftDescription}

${params.message ? `Their message: "${params.message}"` : ''}

${params.redeemUrl ? `Redeem your gift: ${params.redeemUrl}` : 'Visit your dashboard: https://thriveathome.com/dashboard'}`

  return {
    subject: `🎁 ${params.senderName} sent you a gift${params.occasion ? ` for ${params.occasion}` : ''}!`,
    html,
    text,
  }
}

// ─── SendGrid helper ──────────────────────────────────────────────────────────

export async function sendEmail(params: {
  to: string
  toName?: string
  template: EmailTemplate
}): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@thriveathome.com'
  const fromName = process.env.SENDGRID_FROM_NAME || 'ThriveAtHome'

  if (!apiKey) {
    console.error('[sendEmail] SENDGRID_API_KEY not set')
    return
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: params.to, name: params.toName }],
          subject: params.template.subject,
        },
      ],
      from: { email: fromEmail, name: fromName },
      content: [
        { type: 'text/plain', value: params.template.text },
        { type: 'text/html', value: params.template.html },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[sendEmail] SendGrid error:', res.status, body)
    throw new Error(`SendGrid error ${res.status}`)
  }
}
