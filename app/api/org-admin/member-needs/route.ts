// POST /api/org-admin/member-needs — post a new need on behalf of a member.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMemberNeed } from '@/lib/data/communityOrgs'

const VALID_NEED_TYPES = ['transport', 'meals', 'companionship', 'tech_help', 'home_maintenance', 'medical', 'other']
const VALID_URGENCIES = ['urgent', 'normal', 'low']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id').eq('supabase_auth_id', user.id).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ error: 'No org linked to your account' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.member_id?.trim()) return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
  if (!body?.title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!body?.description?.trim()) return NextResponse.json({ error: 'description is required' }, { status: 400 })
  if (!VALID_NEED_TYPES.includes(body.need_type)) return NextResponse.json({ error: 'Invalid need_type' }, { status: 400 })
  if (!VALID_URGENCIES.includes(body.urgency ?? 'normal')) return NextResponse.json({ error: 'Invalid urgency' }, { status: 400 })

  const { data, error } = await createMemberNeed(body.member_id, fm.org_id as string, {
    need_type: body.need_type,
    title: body.title.trim(),
    description: body.description.trim(),
    urgency: body.urgency ?? 'normal',
    preferred_date: body.preferred_date || undefined,
    preferred_time: body.preferred_time || undefined,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
