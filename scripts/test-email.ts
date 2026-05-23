// npx tsx scripts/test-email.ts
// Sends test emails to your own address.
// Requires: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, NEXT_PUBLIC_APP_URL (optional)
import 'dotenv/config'
import { SendGridEmailProvider } from '../lib/services/SendGridEmailProvider'

const to = process.env.SENDGRID_FROM_EMAIL
if (!to) {
  console.error('ERROR: SENDGRID_FROM_EMAIL not set in .env.local (we send test emails to the FROM address)')
  process.exit(1)
}

async function main() {
  const email = new SendGridEmailProvider()

  console.log(`Sending post-call summary email to ${to}...`)
  await email.sendPostCallSummary(to!, {
    seniorName: 'Margaret Chen',
    summary: 'Margaret had a warm, talkative morning. She mentioned she slept well and enjoyed her breakfast. She expressed some sadness about missing her book club last week but was looking forward to her grandchildren visiting.',
    scores: {
      mood_score: 7,
      energy_score: 6,
      pain_score: 8,
      medication_taken: true,
      alert_flags: [],
    },
    hasAlerts: false,
    dashboardUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/dashboard',
  })
  console.log('Post-call email sent.')

  console.log('Sending alert email...')
  await email.sendAlert(to!, 'Margaret Chen', 'Margaret mentioned she slipped on the kitchen floor this morning. She said she was not hurt, but the care team has been notified.')
  console.log('Alert email sent.')

  console.log('Sending welcome email...')
  await email.sendWelcome(to!, 'Margaret Chen')
  console.log('Welcome email sent.')

  console.log('✅ All 3 test emails sent. Check your inbox.')
}

main().catch((e) => {
  console.error('ERROR:', e)
  process.exit(1)
})
