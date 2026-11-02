import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const myOnly = searchParams.get('my') === 'true'
  const { data: { user } } = await supabase.auth.getUser()

  let query = (admin as any).from('member_campaigns')
    .select(`id, title, description, cause_category, goal_amount, raised_amount, donor_count, status, cover_image_url, end_date, is_featured, stripe_payment_link_url, created_at, members!inner(id, first_name, last_name)`)
    .order('is_featured', { ascending: false })
    .order('raised_amount', { ascending: false })

  if (myOnly && user) {
    const { data: member } = await (admin as any).from('members').select('id').eq('supabase_auth_id', user.id).single()
    if (member) query = query.eq('member_id', member.id)
  } else {
    query = query.eq('status', 'active')
  }

  if (category) query = query.eq('cause_category', category)
  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await (admin as any).from('members').select('id, plan, status').eq('supabase_auth_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (member.status !== 'active') return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
  if (!['complete','premier'].includes(member.plan)) {
    return NextResponse.json({ error: 'Complete or Premier plan required to create campaigns' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, cause_category, goal_amount, end_date, cover_image_url } = body
  if (!title || !description || !cause_category || !goal_amount) {
    return NextResponse.json({ error: 'title, description, cause_category, goal_amount required' }, { status: 400 })
  }

  const { data: campaign, error } = await (admin as any).from('member_campaigns').insert({
    member_id: member.id, title, description, cause_category,
    goal_amount: parseFloat(goal_amount), end_date: end_date || null,
    cover_image_url: cover_image_url || null, status: 'pending_review',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: task } = await (admin as any).from('navigator_tasks').insert({
    member_id: member.id, task_type: 'campaign_review',
    title: `Review campaign: "${title}"`,
    description: `Member submitted a fundraising campaign. Category: ${cause_category}, Goal: $${goal_amount}. Review and approve or reject.`,
    priority: 'normal', status: 'open', metadata: { campaign_id: campaign.id },
  }).select('id').single()
  if (task) await (admin as any).from('member_campaigns').update({ navigator_task_id: task.id }).eq('id', campaign.id)

  return NextResponse.json(campaign, { status: 201 })
}
