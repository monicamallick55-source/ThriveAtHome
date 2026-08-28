// M22 Phase 89/91 — no-motion smart-home anomaly sweep.
// Runs every 2 hours (vercel.json). For each member with an active smart-home
// device, checks time since the last motion/door/button signal and raises a
// graduated alert; a very long gap escalates through the fall protocol.
import { NextRequest, NextResponse } from 'next/server'
import { runNoMotionSweep } from '@/lib/devices/anomalyDetection'

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

  try {
    const result = await runNoMotionSweep()
    console.log(
      `[cron/smart-home-anomaly] checked=${result.checked} concern=${result.concern} emergency=${result.emergency}`
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/smart-home-anomaly] failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
