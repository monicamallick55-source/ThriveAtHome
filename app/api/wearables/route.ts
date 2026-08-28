// M22 Phase 90 — list and connect wearable / health-data platforms.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { wearableProvider } from '@/lib/providers'
import {
  getWearableConnectionsForMember,
  upsertWearableConnection,
} from '@/lib/data/devices'

export const runtime = 'nodejs'

const PLATFORMS = ['apple_healthkit', 'google_fit', 'fitbit', 'garmin'] as const
const DEFAULT_SCOPES = ['activity', 'heartrate', 'sleep']

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const { data, error } = await getWearableConnectionsForMember(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ connections: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const platform = body?.platform
  if (typeof platform !== 'string' || !(PLATFORMS as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: 'Invalid wearable platform' }, { status: 400 })
  }
  const scopes = Array.isArray(body?.scopes) ? body.scopes.filter((s: unknown) => typeof s === 'string') : DEFAULT_SCOPES

  let connectResult
  try {
    connectResult = await wearableProvider.connect({ memberId: fm.member_id, platform, scopes })
  } catch (e) {
    console.error('[api/wearables] connect failed:', e)
    return NextResponse.json({ error: 'Could not connect this wearable. Please try again.' }, { status: 502 })
  }

  const { data, error } = await upsertWearableConnection({
    memberId: fm.member_id,
    platform,
    externalUserId: connectResult.externalUserId,
    scopes,
    status: connectResult.status === 'active' ? 'active' : 'pending',
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ connection: data, authUrl: connectResult.authUrl ?? null }, { status: 201 })
}
