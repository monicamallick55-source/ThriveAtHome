// Aria call scheduler cron. Logic lives in lib/voice/ariaSchedule.ts.
import { NextRequest, NextResponse } from 'next/server'
import { runAriaSchedule } from '@/lib/voice/ariaSchedule'

export const runtime = 'nodejs'

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

  const results = await runAriaSchedule()
  return NextResponse.json({ success: true, ...results })
}
