import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  const status = req.nextUrl.searchParams.get('status')

  let query = (supabase as any)
    .from('fraud_flags')
    .select('*')
    .order('created_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, source, source_id, scam_type, matched_text, severity } = body

  if (!member_id || !source || !scam_type) {
    return NextResponse.json({ error: 'member_id, source, scam_type required' }, { status: 400 })
  }

  const { data, error } = await (supabase as any)
    .from('fraud_flags')
    .insert({
      member_id,
      source,
      source_id: source_id || null,
      scam_type,
      matched_text: matched_text ? matched_text.slice(0, 200) : null,
      severity: severity ?? 'concern',
      status: 'open',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const taskPriority = severity === 'urgent' ? 'critical' : 'high'
  const scamLabel = scam_type.replace(/_/g, ' ')
  await (supabase as any).from('navigator_tasks').insert({
    member_id,
    task_type: 'fraud_review',
    priority: taskPriority,
    description: `${severity === 'urgent' ? 'URGENT: ' : ''}Possible ${scamLabel} detected via ${source.replace(/_/g,' ')}.${matched_text ? ' Excerpt: "' + matched_text.slice(0, 100) + '"' : ''}`,
  }).then(({error: _e}: {error: unknown}) => { if (_e) console.warn(_e) })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, resolution_note } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('fraud_flags')
    .update({ status, resolution_note: resolution_note || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
