// M22 Phase 90 — pull recent wearable readings for a member.
// Runs wearableProvider.syncReadings (stub returns a sample day), persists them,
// and runs the fall protocol for any reading that carries fall_detected=true.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { wearableProvider } from '@/lib/providers'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveWearableReadings } from '@/lib/data/devices'
import { handleFallEvent } from '@/lib/devices/fallProtocol'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const platform = typeof body?.platform === 'string' ? body.platform : null

  const admin = createAdminClient()
  let q = admin
    .from('wearable_connections')
    .select('id, platform, external_user_id, status')
    .eq('member_id', fm.member_id)
    .eq('status', 'active')
  if (platform) q = q.eq('platform', platform)
  const { data: connections } = await q

  if (!connections || connections.length === 0) {
    return NextResponse.json({ error: 'No active wearable connection to sync.' }, { status: 400 })
  }

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let totalSaved = 0
  let fallsRaised = 0

  for (const conn of connections) {
    if (!conn.external_user_id) continue
    let readings
    try {
      readings = await wearableProvider.syncReadings(conn.external_user_id, since)
    } catch (e) {
      console.error('[api/wearables/sync] syncReadings failed:', e)
      continue
    }
    const { saved } = await saveWearableReadings({
      memberId: fm.member_id,
      connectionId: conn.id,
      platform: conn.platform,
      readings,
    })
    totalSaved += saved

    for (const r of readings) {
      if (r.fallDetected) {
        await handleFallEvent({
          memberId: fm.member_id,
          source: 'wearable',
          raw: { platform: conn.platform, readingDate: r.readingDate },
        })
        fallsRaised++
      }
    }

    await admin
      .from('wearable_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', conn.id)
  }

  return NextResponse.json({ saved: totalSaved, fallsRaised })
}
