// app/api/cron/weekly-summary/route.ts
// Sends weekly email summary to members and family portal digest
// Schedule: Fridays at 4:00 PM — { "path": "/api/cron/weekly-summary", "schedule": "0 23 * * 5" }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SENDGRID_API_KEY   = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hello@thriveathome.com'
const APP_URL             = process.env.NEXT_PUBLIC_APP_URL || 'https://thriveathome.vercel.app'

async function sendWeeklySummaryEmail(
  email: string,
  firstName: string,
  stats: {
    calls: number
    servicesBooked: number
    eventsAttended: number
    messagesReceived: number
  }
) {
  if (!SENDGRID_API_KEY) return

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #2d6a4f; padding: 28px 40px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #fff; font-size: 22px; margin: 0;">Your weekly ThriveAtHome digest 🌿</h1>
      </div>
      <div style="background: #f7faf7; padding: 36px 40px; border-radius: 0 0 16px 16px; border: 1px solid #d4edda;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="color: #555; line-height: 1.7;">Here's a summary of your week — you're doing great!</p>
        <div style="display: grid; gap: 12px; margin: 24px 0;">
          ${[
            { emoji: '📞', label: 'Check-in calls', value: stats.calls },
            { emoji: '🛎️', label: 'Services booked', value: stats.servicesBooked },
            { emoji: '🌍', label: 'Community events', value: stats.eventsAttended },
            { emoji: '✉️', label: 'Messages received', value: stats.messagesReceived },
          ].map(({ emoji, label, value }) => `
            <div style="background: #fff; border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e0ede8;">
              <span style="font-size: 15px; color: #444;">${emoji} ${label}</span>
              <strong style="font-size: 20px; color: #2d6a4f;">${value}</strong>
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 28px;">
          <a href="${APP_URL}/dashboard" style="background: #2d6a4f; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 15px;">
            View my dashboard →
          </a>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 24px;">
          ThriveAtHome · <a href="${APP_URL}/unsubscribe" style="color: #aaa;">Unsubscribe from summaries</a>
        </p>
      </div>
    </div>
  `

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }], subject: `Your ThriveAtHome week in review 🌿` }],
      from: { email: SENDGRID_FROM_EMAIL, name: 'ThriveAtHome' },
      content: [{ type: 'text/html', value: html }],
    }),
  }).catch(err => console.error('[weekly-summary] SendGrid error:', err))
}

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!SENDGRID_API_KEY) {
    return NextResponse.json({ error: 'SendGrid not configured' }, { status: 503 })
  }

  const ago7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: members, error } = await db
    .from('members')
    .select('id, first_name, email, subscription_status, weekly_summary_opt_out')
    .eq('subscription_status', 'active')
    .not('email', 'is', null)
    .not('weekly_summary_opt_out', 'eq', true)

  if (error) {
    console.error('[weekly-summary] Members error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let sent = 0
  for (const member of (members || [])) {
    try {
      // Fetch stats in parallel
      const [calls, services, events, messages] = await Promise.all([
        supabaseAdmin.from('call_logs').select('id', { count: 'exact', head: true })
          .eq('member_id', member.id).in('status', ['completed', 'ended']).gte('created_at', ago7),
        supabaseAdmin.from('service_bookings').select('id', { count: 'exact', head: true })
          .eq('member_id', member.id).gte('created_at', ago7),
        supabaseAdmin.from('event_registrations').select('id', { count: 'exact', head: true })
          .eq('member_id', member.id).gte('created_at', ago7),
        supabaseAdmin.from('messages').select('id', { count: 'exact', head: true })
          .eq('receiver_member_id', member.id).gte('created_at', ago7),
      ])

      await sendWeeklySummaryEmail(member.email, member.first_name || 'Friend', {
        calls:            calls.count ?? 0,
        servicesBooked:   services.count ?? 0,
        eventsAttended:   events.count ?? 0,
        messagesReceived: messages.count ?? 0,
      })

      sent++
      // Throttle: 1 email per 100ms to stay within SendGrid rate limits
      await new Promise(r => setTimeout(r, 100))
    } catch (err) {
      console.error(`[weekly-summary] Error for member ${member.id}:`, err)
    }
  }

  return NextResponse.json({ sent, total: (members || []).length })
}

export async function GET(req: NextRequest) { return POST(req) }
