import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PATHWAY_INFO: Record<string, { title: string; description: string; resources: string[] }> = {
  retirement:   { title: 'Retirement',                    description: 'Navigating life after work — purpose, identity, and finances.',                            resources: ['AARP Retirement Guide', 'Social Security Administration', 'Medicare.gov'] },
  widow:        { title: 'Loss of a Spouse',              description: 'Grief support, legal steps, and rebuilding daily life.',                                   resources: ['Grief Share', 'Widows Connection', 'AARP Grief Resources'] },
  diagnosis:    { title: 'New Diagnosis',                 description: 'Understanding your diagnosis and next steps for care.',                                     resources: ['National Institute on Aging', 'Caregiver Action Network', 'Disease-specific foundations'] },
  moving:       { title: 'Moving or Downsizing',          description: 'Planning a move, downsizing a home, or transitioning to a new community.',                 resources: ['NASMM (Move Managers)', 'HUD Housing Counseling', 'Senior Move Manager Directory'] },
  caregiving:   { title: 'Becoming a Caregiver',          description: 'Support for family members taking on a caregiving role.',                                  resources: ['AARP Caregiving Resources', 'Caregiver Action Network', 'Eldercare Locator'] },
  divorce:      { title: 'Late-Life Divorce or Separation', description: 'Legal, financial, and emotional support for major relationship changes.',                resources: ['AARP Divorce After 50', 'State Bar Legal Aid', 'Therapist Directory'] },
  loss:         { title: 'Grief and Loss',                description: 'Support after losing a loved one, friend, or significant life change.',                    resources: ['GriefShare', "What's Your Grief", 'Local Hospice Bereavement Programs'] },
  financial:    { title: 'Financial Change',              description: 'Managing income changes, debt, or unexpected financial stress.',                            resources: ['NCOA Benefits CheckUp', 'Consumer Financial Protection Bureau', 'Local Area Agency on Aging'] },
  independence: { title: 'Maintaining Independence',      description: 'Resources and planning to stay safely at home as needs change.',                           resources: ['AARP HomeFit Guide', 'National Aging in Place Council', 'Area Agency on Aging'] },
}

export async function GET(req: NextRequest, { params }: { params: { pathway: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const info = PATHWAY_INFO[params.pathway]
  if (!info) return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })

  return NextResponse.json({ pathway: params.pathway, ...info })
}

export async function POST(req: NextRequest, { params }: { params: { pathway: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const info = PATHWAY_INFO[params.pathway]
  if (!info) return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  try {
    const admin = createAdminClient()
    await admin.from('notifications').insert({
      member_id: user.id,
      type: 'navigator_task',
      payload: { pathway: params.pathway, title: info.title, notes: body.notes ?? '' },
      created_at: new Date().toISOString(),
    })
  } catch {
    // Non-fatal — task queuing failed but we still respond OK
  }

  return NextResponse.json({ ok: true, pathway: params.pathway })
}
