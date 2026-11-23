import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['admin','super_admin','csm'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ orgs: [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['admin','super_admin','csm'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ org: { id: 'org_' + Date.now(), ...body, created_at: new Date().toISOString() } }, { status: 201 })
}
