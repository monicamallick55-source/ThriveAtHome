import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await req.json().catch(() => ({}))
  const { action, decline_reason, notes } = body

  if (action === 'decline') {
    const { data, error } = await supabase.from('buddy_assignments')
      .update({ status: 'declined', end_reason: decline_reason ?? null, ended_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, status: 'declined' })
  }

  if (action === 'accept') {
    const { data, error } = await supabase.from('buddy_assignments')
      .update({ status: 'active', assigned_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, status: 'active' })
  }

  // Generic update
  const { data, error } = await supabase.from('buddy_assignments')
    .update({ ...body })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
