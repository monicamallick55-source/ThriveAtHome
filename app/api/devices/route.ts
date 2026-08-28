// M22 Phase 87 — list and register a member's connected devices.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getDevicesForMember, registerDevice } from '@/lib/data/devices'

export const runtime = 'nodejs'

const CATEGORIES = ['companion_tablet', 'voice_assistant', 'smart_home', 'wearable'] as const
const BILLING = ['none', 'one_time_99', 'monthly_15', 'free_with_commitment'] as const

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })
  }

  const { data, error } = await getDevicesForMember(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ devices: data })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) {
    return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { device_category, device_type, device_name, provider, billing_option, settings } =
    body as Record<string, unknown>

  if (
    typeof device_category !== 'string' ||
    !(CATEGORIES as readonly string[]).includes(device_category)
  ) {
    return NextResponse.json({ error: 'Invalid device category' }, { status: 400 })
  }
  if (typeof device_type !== 'string' || device_type.trim() === '') {
    return NextResponse.json({ error: 'A device type is required' }, { status: 400 })
  }
  if (
    billing_option !== undefined &&
    !(BILLING as readonly string[]).includes(String(billing_option))
  ) {
    return NextResponse.json({ error: 'Invalid billing option' }, { status: 400 })
  }

  const { data, error } = await registerDevice({
    member_id: fm.member_id,
    device_category,
    device_type: device_type.trim(),
    device_name: typeof device_name === 'string' ? device_name : null,
    provider: typeof provider === 'string' ? provider : null,
    billing_option: billing_option ? String(billing_option) : 'none',
    status: device_category === 'companion_tablet' ? 'pending' : 'active',
    settings: (settings && typeof settings === 'object' ? settings : {}) as Record<string, unknown>,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })

  console.log(
    `[STUB][Device] Registered ${device_type} (${device_category}) for member ${fm.member_id}`
  )
  return NextResponse.json({ device: data }, { status: 201 })
}
