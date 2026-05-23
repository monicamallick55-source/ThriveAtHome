// npx tsx scripts/test-sms.ts
// Sends a real SMS to ONCALL_NAVIGATOR_PHONE.
// Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ONCALL_NAVIGATOR_PHONE
import 'dotenv/config'
import { TwilioSmsProvider } from '../lib/services/TwilioSmsProvider'

const to = process.env.ONCALL_NAVIGATOR_PHONE
if (!to) {
  console.error('ERROR: ONCALL_NAVIGATOR_PHONE not set in .env.local')
  process.exit(1)
}

async function main() {
  const sms = new TwilioSmsProvider()

  console.log('Sending standard SMS...')
  await sms.send(to!, 'ThriveAtHome test — Margaret Chen just completed her daily check-in. Mood 7/10. Meds ✓')
  console.log('Standard SMS sent.')

  console.log('Sending urgent SMS...')
  await sms.sendUrgent(to!, 'Margaret Chen mentioned a fall during today\'s check-in. Please follow up.')
  console.log('Urgent SMS sent.')

  console.log('✅ Both SMS messages sent successfully. Check your phone.')
}

main().catch((e) => {
  console.error('ERROR:', e)
  process.exit(1)
})
