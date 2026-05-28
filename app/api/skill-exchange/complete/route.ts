import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { completeExchange } from '@/lib/data/skill-exchange'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { exchange_id } = await request.json()
  if (!exchange_id) return NextResponse.json({ error: 'exchange_id required' }, { status: 400 })

  // verify member is teacher or learner
  const admin = createAdminClient()
  const { data: exchange } = await admin
    .from('skill_exchanges')
    .select('teacher_member_id, learner_member_id, status')
    .eq('id', exchange_id)
    .maybeSingle()

  if (!exchange) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })
  if (exchange.teacher_member_id !== fm.member_id && exchange.learner_member_id !== fm.member_id) {
    return NextResponse.json({ error: 'Not your exchange' }, { status: 403 })
  }
  if (exchange.status === 'completed') {
    return NextResponse.json({ error: 'Already completed' }, { status: 400 })
  }

  const { error } = await completeExchange(exchange_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ completed: true })
}
