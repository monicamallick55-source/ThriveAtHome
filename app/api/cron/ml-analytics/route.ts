// M23 Phases 93-97 — nightly Advanced AI/ML analytics sweep.
// Recomputes each active member's wellness baseline, then runs behavioral
// anomaly, fall-risk, social-isolation and grief-pattern models. Any model that
// crosses its threshold raises the appropriate alert / navigator task.
import { NextRequest, NextResponse } from 'next/server'
import { runMlAnalyticsSweep } from '@/lib/ml/mlSweep'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// ML sweep iterates every active member — give it headroom.
export const maxDuration = 300

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
    const result = await runMlAnalyticsSweep()
    console.log('[cron/ml-analytics]', JSON.stringify(result))
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/ml-analytics] failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
