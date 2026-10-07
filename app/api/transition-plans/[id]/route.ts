import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { id } = await params
  const body = await req.json()
  const allowed = ['status', 'title', 'target_date', 'notes']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) if (key in body) updates[key] = body[key]

  const supabase = await createClient()
  const { data, error } = await (supabase.from as any)('transition_plans')
    .update(updates)
    .eq('id', id)
    .eq('member_id', memberId)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
