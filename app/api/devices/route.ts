/**
 * app/api/devices/route.ts — G4.5 Thrive Device Kiosk
 *
 * GET  /api/devices?org_id=<id>   — list devices (staff only)
 * POST /api/devices               — provision a new device token (staff only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')
  const memberId = searchParams.get('member_id')

  let query = supabase
    .from('device_tokens')
    .select('*')
    .order('created_at', { ascending: false })

  if (orgId) query = query.eq('org_id', orgId)
  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ devices: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, org_id, label, device_type = 'tablet', os } = body

  const { data, error } = await supabase
    .from('device_tokens')
    .insert({
      member_id: member_id ?? null,
      org_id: org_id ?? null,
      label: label ?? null,
      device_type,
      os: os ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ device: data }, { status: 201 })
}
