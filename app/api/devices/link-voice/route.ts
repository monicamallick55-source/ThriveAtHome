// M22 Phase 88 — link a voice assistant / smart-home hub account.
// Runs through deviceProvider (stub until Alexa Skill / Google Actions creds exist),
// then records or updates the member_devices row with the returned account id.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { deviceProvider } from '@/lib/providers'
import { registerDevice, updateDevice, getDevicesForMember } from '@/lib/data/devices'

export const runtime = 'nodejs'

const VOICE_TYPES = [
  'alexa', 'google_assistant', 'echo_show', 'nest_hub', 'ring_doorbell',
  'adt_hub', 'philips_hue', 'grandpad', 'motion_sensor',
] as const

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) {
    return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const deviceType = body?.device_type
  const provider = body?.provider
  if (typeof deviceType !== 'string' || !(VOICE_TYPES as readonly string[]).includes(deviceType)) {
    return NextResponse.json({ error: 'Invalid device type' }, { status: 400 })
  }

  const isSmartHome = ['ring_doorbell', 'adt_hub', 'philips_hue', 'motion_sensor', 'nest_hub'].includes(deviceType)
  const category = isSmartHome ? 'smart_home' : 'voice_assistant'

  let link
  try {
    link = await deviceProvider.linkAccount({
      memberId,
      deviceType,
      provider: typeof provider === 'string' ? provider : 'unknown',
    })
  } catch (e) {
    console.error('[api/devices/link-voice] linkAccount failed:', e)
    return NextResponse.json({ error: 'Could not start device linking. Please try again.' }, { status: 502 })
  }

  // Reuse an existing row of the same type if present, else create one.
  const { data: existing } = await getDevicesForMember(memberId)
  const match = existing.find((d: any) => d.device_type === deviceType)

  if (match) {
    const { data, error } = await updateDevice(match.id, {
      status: link.status === 'active' ? 'active' : 'pending',
      external_account_id: link.externalAccountId,
      provider: typeof provider === 'string' ? provider : match.provider,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ device: data, linkUrl: link.linkUrl ?? null })
  }

  const { data, error } = await registerDevice({
    member_id: memberId,
    device_category: category,
    device_type: deviceType,
    provider: typeof provider === 'string' ? provider : null,
    status: link.status === 'active' ? 'active' : 'pending',
    external_account_id: link.externalAccountId,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ device: data, linkUrl: link.linkUrl ?? null }, { status: 201 })
}
