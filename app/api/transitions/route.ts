// app/api/transitions/route.ts
// POST — open a life transition pathway for a member
// GET  — list active transitions for the authenticated member/family

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Pathway = 'bereavement' | 'new_diagnosis' | 'moving' | 'caregiver_transition'

const PATHWAY_STEPS: Record<Pathway, Array<{ key: string; delayDays: number; title: string; body: string; priority: string }>> = {
  bereavement: [
    { key: 'day_0_check_in',    delayDays: 0,  priority: 'high',   title: 'Bereavement check-in call',      body: 'Member reported a bereavement. Aria should call today with a warm, gentle check-in — no agenda, just presence.' },
    { key: 'day_3_resources',   delayDays: 3,  priority: 'medium', title: 'Send grief resources',           body: 'Send curated grief support resources to member and family.' },
    { key: 'day_7_navigator',   delayDays: 7,  priority: 'high',   title: 'Navigator call — bereavement',  body: 'Human navigator follow-up: practical support, benefits review if spouse passed, local grief groups.' },
    { key: 'day_30_check_in',   delayDays: 30, priority: 'medium', title: '30-day bereavement check-in',   body: 'Aria check-in: how is the member doing a month later? Flag if grief symptoms are severe.' },
    { key: 'day_90_review',     delayDays: 90, priority: 'low',    title: 'Bereavement 90-day review',     body: 'Review member wellbeing; consider closing pathway or continuing support.' },
  ],
  new_diagnosis: [
    { key: 'day_0_navigator',   delayDays: 0,  priority: 'high',   title: 'New diagnosis navigator call',  body: 'Member reported a new health diagnosis. Navigator call today: understand diagnosis, review care plan, identify benefit gaps.' },
    { key: 'day_1_benefits',    delayDays: 1,  priority: 'high',   title: 'Benefits review — new diagnosis', body: 'Review Medicare, Medicaid, and supplemental benefits in light of new diagnosis. Identify cost support programs.' },
    { key: 'day_7_aria',        delayDays: 7,  priority: 'medium', title: 'Aria check-in — diagnosis adjustment', body: 'Aria check-in: how is the member adapting? Any questions about their care plan or medications?' },
    { key: 'day_30_care_plan',  delayDays: 30, priority: 'medium', title: '30-day care plan review',       body: 'Review updated care plan with member; coordinate with any new providers.' },
  ],
  moving: [
    { key: 'day_0_intake',      delayDays: 0,  priority: 'high',   title: 'Moving intake — navigator',     body: 'Member is planning a move/downsizing. Navigator intake: timeline, destination, support needs, local resources.' },
    { key: 'day_2_checklist',   delayDays: 2,  priority: 'medium', title: 'Send moving checklist',         body: 'Send downsizing checklist and local senior move manager referrals.' },
    { key: 'day_14_check_in',   delayDays: 14, priority: 'medium', title: 'Move progress check-in',        body: 'Check in on move progress; connect to additional resources as needed.' },
    { key: 'day_post_move',     delayDays: 30, priority: 'medium', title: 'Post-move settlement check-in', body: 'Post-move check-in: is the member settled? Update address, service providers, metro area assignment.' },
  ],
  caregiver_transition: [
    { key: 'day_0_intake',      delayDays: 0,  priority: 'high',   title: 'Caregiver transition intake',   body: 'Member or family reported a caregiver change. Navigator intake: current care situation, gaps, respite needs.' },
    { key: 'day_1_respite',     delayDays: 1,  priority: 'high',   title: 'Respite care options',          body: 'Identify and share local respite care options; connect to area agency on aging.' },
    { key: 'day_7_follow_up',   delayDays: 7,  priority: 'medium', title: 'Caregiver transition follow-up', body: 'Navigator follow-up: is new care arrangement in place? Any urgent gaps?' },
    { key: 'day_30_review',     delayDays: 30, priority: 'low',    title: '30-day caregiver review',       body: 'Review care arrangement stability; close pathway or continue monitoring.' },
  ],
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Resolve member_id
  let memberId: string | null = null
  const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
  if (member) { memberId = member.id } else {
    const { data: fm } = await db.from('family_members').select('member_id').eq('supabase_auth_id', user.id).maybeSingle()
    memberId = fm?.member_id ?? null
  }
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: transitions } = await db
    .from('life_transitions')
    .select('id, pathway, status, started_at, completed_at, metadata, life_transition_steps(*)')
    .eq('member_id', memberId)
    .order('started_at', { ascending: false })

  return NextResponse.json({ transitions: transitions ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { pathway?: string; metadata?: Record<string, unknown>; member_id?: string }
  const pathway = body.pathway as Pathway | undefined
  if (!pathway || !['bereavement','new_diagnosis','moving','caregiver_transition'].includes(pathway)) {
    return NextResponse.json({ error: 'Invalid pathway' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Resolve member_id (staff can pass member_id directly)
  let memberId: string | null = body.member_id ?? null
  if (!memberId) {
    const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
    if (member) { memberId = member.id } else {
      const { data: fm } = await db.from('family_members').select('member_id').eq('supabase_auth_id', user.id).maybeSingle()
      memberId = fm?.member_id ?? null
    }
  }
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Check for existing active transition of same pathway
  const { data: existing } = await db
    .from('life_transitions')
    .select('id')
    .eq('member_id', memberId)
    .eq('pathway', pathway)
    .eq('status', 'active')
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'Transition already active', transition_id: existing.id }, { status: 409 })

  // Create transition
  const { data: transition, error } = await db
    .from('life_transitions')
    .insert({ member_id: memberId, pathway, metadata: body.metadata ?? {} })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create initial steps + navigator tasks
  const steps = PATHWAY_STEPS[pathway]
  const now = new Date()
  for (const step of steps) {
    const scheduledFor = new Date(now.getTime() + step.delayDays * 86400000)

    // Create navigator task
    const { data: task } = await db.from('navigator_tasks').insert({
      type: `transition_${pathway}_${step.key}`,
      member_id: memberId,
      priority: step.priority,
      title: step.title,
      body: step.body,
      metadata: { transition_id: transition.id, pathway, step_key: step.key },
      status: step.delayDays === 0 ? 'open' : 'scheduled',
      scheduled_for: scheduledFor.toISOString(),
    }).select('id').single()

    await db.from('life_transition_steps').insert({
      transition_id: transition.id,
      step_key: step.key,
      scheduled_for: scheduledFor.toISOString(),
      navigator_task_id: task?.id ?? null,
    })
  }

  // Fetch resources for pathway
  const { data: resources } = await db
    .from('transition_resources')
    .select('title, description, url, resource_type')
    .eq('pathway', pathway)
    .order('sort_order')

  return NextResponse.json({ transition, resources: resources ?? [] }, { status: 201 })
}
