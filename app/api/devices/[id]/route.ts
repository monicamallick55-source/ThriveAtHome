/**
 * app/api/devices/[id]/route.ts — G4.5
 *
 * GET   /api/devices/[id]           — fetch device by id or token
 * PATCH /api/devices/[id]           — update device (activate, suspend, retire, heartbeat)
 *   body: { action?: 'activate'|'suspend'|'retire', label?, member_id?, mdm_device_id? }
 *
 * Also handles device heartbeat: PATCH with action='heartbeat' updates last_seen_at.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Allow unauthenticated lookup by token (device kiosk self-identifies)
  const { searchParams } = new URL(req.url)
  const byToken = searchParams.get('by') === 'token'

  if (byToken) {
    const { data, error } = await supabase
      .from('device_tokens')
      .select('id, status, member_id, org_id, label, device_type')
      .eq('token', id)
      .single()
    if (error) return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    return NextResponse.json({ device: data })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('device_tokens')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ device: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()
  const { action, token, ...fields } = body

  // Heartbeat — device sends its token, no auth required
  if (action === 'heartbeat' && token) {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null
    const { error } = await supabase
      .from('device_tokens')
      .update({ last_seen_at: new Date().toISOString(), last_seen_ip: ip })
      .eq('token', token)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates: Record<string, unknown> = {}

  if (action === 'activate') {
    updates.status = 'active'
    updates.activated_at = new Date().toISOString()
    updates.activated_by = user.id
  } else if (action === 'suspend') {
    updates.status = 'suspended'
  } else if (action === 'retire') {
    updates.status = 'retired'
  }

  const allowedFields = ['label', 'member_id', 'org_id', 'mdm_device_id', 'os', 'device_type']
  for (const field of allowedFields) {
    if (fields[field] !== undefined) updates[field] = fields[field]
  }

  const { data, error } = await supabase
    .from('device_tokens')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ device: data })
}
