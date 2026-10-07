import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_achievements')
    .select('*')
    .eq('member_id', memberId)
    .order('occurred_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const body = await req.json()
  const { type, occurred_at, shared_with_family, metadata } = body
  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_achievements')
    .insert({
      member_id: memberId,
      type,
      occurred_at: occurred_at ?? new Date().toISOString(),
      shared_with_family: shared_with_family ?? false,
      metadata: metadata ?? {},
    })
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
