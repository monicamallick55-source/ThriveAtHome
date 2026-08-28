// M22 Phase 87 — update or disconnect one connected device.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateDevice, disconnectDevice } from '@/lib/data/devices'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

async function ownedDevice(userId: string, deviceId: string) {
  const { data: fm } = await getFamilyMemberByAuthId(userId)
  if (!fm?.member_id) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('member_devices')
    .select('id, member_id')
    .eq('id', deviceId)
    .maybeSingle()
  if (!data || data.member_id !== fm.member_id) return null
  return data
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownedDevice(user.id, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { device_name, status, settings, notes } = body as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  if (typeof device_name === 'string') patch.device_name = device_name
  if (typeof status === 'string' && ['pending', 'active', 'disconnected', 'error'].includes(status))
    patch.status = status
  if (settings && typeof settings === 'object') patch.settings = settings
  if (typeof notes === 'string') patch.notes = notes
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error } = await updateDevice(id, patch)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ device: data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownedDevice(user.id, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { error } = await disconnectDevice(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
