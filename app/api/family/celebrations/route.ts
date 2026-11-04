import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, requested_by, occasion, occasion_date, tier, price_cents, notes_for_team } = body

  if (!member_id || !requested_by || !occasion || !occasion_date || !tier) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await (supabase as any)
    .from('celebration_requests')
    .insert({
      member_id,
      requested_by,
      occasion,
      occasion_date,
      tier,
      price_cents: price_cents ?? 0,
      payment_status: price_cents > 0 ? 'pending' : 'not_required',
      notes_for_team: notes_for_team || null,
      status: 'requested',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tier !== 'digital') {
    const dueDate = new Date(new Date(occasion_date).getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await (supabase as any).from('navigator_tasks').insert({
      member_id,
      task_type: 'celebration_coordination',
      priority: 'medium',
      description: `${tier} celebration: ${occasion.replace('_',' ')} on ${occasion_date}.${notes_for_team ? ' Notes: ' + notes_for_team : ''}`,
      due_date: dueDate,
    }).catch(() => {})
  }

  if (tier === 'digital') {
    console.log(`[STUB][Celebrations] Digital celebration for member ${member_id} on ${occasion_date}`)
  }

  return NextResponse.json({ data })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('celebration_requests')
    .select('*, celebration_messages(id, content, is_card_message, author_id, created_at)')
    .eq('member_id', memberId)
    .order('occasion_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
