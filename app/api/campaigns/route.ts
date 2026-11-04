import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const myOnly = searchParams.get('my') === 'true'
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin.from('campaigns')
    .select('id, title, description, goal_cents, raised_cents, donor_count, status, image_url, ends_at, is_featured, is_public, campaign_type, created_at, creator_id')
    .order('is_featured', { ascending: false })
    .order('raised_cents', { ascending: false })

  if (myOnly && user) { query = query.eq('creator_id', user.id) }
  else { query = query.eq('status', 'active').eq('is_public', true) }

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
  if (!['complete', 'premier'].includes(member.plan)) return NextResponse.json({ error: 'Complete or Premier plan required' }, { status: 403 })

  const body = await req.json()
  const { title, description, story, goal_amount, ends_at, image_url, campaign_type } = body
  if (!title || !goal_amount) return NextResponse.json({ error: 'title and goal_amount required' }, { status: 400 })

  const { data: campaign, error } = await admin.from('campaigns').insert({
    creator_id: user.id, title, description: description || null, story: story || null,
    goal_cents: Math.round(parseFloat(goal_amount) * 100), ends_at: ends_at || null,
    image_url: image_url || null, campaign_type: campaign_type || 'fundraiser',
    status: 'draft', is_public: false, is_featured: false, metadata: {},
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await admin.from('navigator_tasks').insert({
      member_id: member.id, task_type: 'campaign_review',
      title: `Review campaign: "${title}"`,
      description: `Member submitted a fundraising campaign. Goal: $${goal_amount}.`,
      priority: 'medium',
    })
  } catch (e) { console.error('Failed to create navigator task:', e) }

  return NextResponse.json(campaign, { status: 201 })
}
