// M22 Phase 91 — fall-detection webhook + manual trigger.
//
// Two callers:
//  1. A wearable / smart-home integration POSTs with the x-device-secret header
//     (DEVICE_WEBHOOK_SECRET, or CRON_SECRET as a fallback) and a member_id.
//  2. A signed-in family member POSTs to raise a manual fall alert for their own
//     member (source is forced to 'manual', member_id is ignored).
//
// Either way the request runs handleFallEvent, which raises an emergency alert,
// opens a critical navigator task, and writes the fall_events audit row.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { handleFallEvent, type FallSource } from '@/lib/devices/fallProtocol'

export const runtime = 'nodejs'

const DEVICE_SOURCES: FallSource[] = ['wearable', 'smart_home_no_motion', 'voice_assistant']

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const secret = process.env.DEVICE_WEBHOOK_SECRET || process.env.CRON_SECRET
  const providedSecret = req.headers.get('x-device-secret')

  // Path 1 — trusted device webhook
  if (secret && providedSecret === secret) {
    const { member_id, source, confidence, device_id, raw } = body as Record<string, unknown>
    if (typeof member_id !== 'string' || member_id.trim() === '') {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
    }
    const resolvedSource: FallSource = DEVICE_SOURCES.includes(source as FallSource)
      ? (source as FallSource)
      : 'wearable'
    const result = await handleFallEvent({
      memberId: member_id,
      source: resolvedSource,
      confidence: typeof confidence === 'number' ? confidence : undefined,
      deviceId: typeof device_id === 'string' ? device_id : null,
      raw: (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>,
    })
    if (result.error && !result.alertId) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json(result, { status: 201 })
  }

  // Path 2 — authenticated family member manual trigger
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })
  }

  const result = await handleFallEvent({
    memberId: fm.member_id,
    source: 'manual',
    raw: { reportedBy: fm.id },
  })
  if (result.error && !result.alertId) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json(result, { status: 201 })
}
