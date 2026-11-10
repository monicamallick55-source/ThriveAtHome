import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['admin', 'super_admin', 'csm'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('support_tickets').select('*').eq('id', params.id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['admin', 'super_admin', 'csm'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['status', 'assigned_to', 'admin_notes', 'priority']
  const update: Record<string, any> = {}
  for (const k of allowed) { if (body[k] !== undefined) update[k] = body[k] }
  if (update.status === 'resolved') update.resolved_at = new Date().toISOString()

  const admin = createAdminClient()
  const { data, error } = await admin.from('support_tickets').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
