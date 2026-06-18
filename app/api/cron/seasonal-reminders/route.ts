import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const SEASON_TIPS: Record<string, string> = {
  '1': 'winter home safety check — heating system, carbon monoxide detector, slip hazards on steps',
  '4': 'spring home safety check — smoke detectors, outdoor walkways, medication review before summer',
  '7': 'summer safety check — cooling, hydration reminders, outdoor heat hazards',
  '10': 'fall home safety check — heating system, grab bars, lighting for shorter days',
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const admin = createAdminClient()
  const month = String(new Date().getUTCMonth() + 1)
  const seasonTip = SEASON_TIPS[month] ?? 'seasonal home safety check'

  const { data: members, error } = await admin
    .from('members')
    .select('id, first_name')
    .eq('status', 'active')

  if (error) {
    console.error('[seasonal-reminders] Failed to fetch members:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = members?.length ?? 0
  console.log(`[seasonal-reminders] Sending ${seasonTip} reminders to ${count} active members`)

  // In production: send email/SMS to each family member via emailProvider
  // Currently stubs the notification — real send added when SendGrid is configured

  return NextResponse.json({ sent: count, season_tip: seasonTip })
}
