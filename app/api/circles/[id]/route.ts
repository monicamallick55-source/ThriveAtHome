// app/api/circles/[id]/route.ts — join/leave a circle
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

async function resolveMember(db: ReturnType<typeof createAdminClient>, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any).from('members').select('id').eq('supabase_auth_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function POST(_req: Request, { params }: Params) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const memberId = await resolveMember(db, user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any).from('circle_memberships').insert({ circle_id: circleId, member_id: memberId })
  if (error?.code === '23505') return NextResponse.json({ joined: true, already: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ joined: true }, { status: 201 })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const memberId = await resolveMember(db, user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).from('circle_memberships').delete().eq('circle_id', circleId).eq('member_id', memberId)
  return NextResponse.json({ left: true })
}
