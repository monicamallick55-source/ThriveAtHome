import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { requestExchange } from '@/lib/data/skill-exchange'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const { skill_id, scheduled_date } = await request.json()
  if (!skill_id) return NextResponse.json({ error: 'skill_id required' }, { status: 400 })

  // look up the teacher from the skill
  const admin = createAdminClient()
  const { data: skill } = await admin
    .from('skills_offered')
    .select('member_id')
    .eq('id', skill_id)
    .maybeSingle()

  if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
  if (skill.member_id === fm.member_id) {
    return NextResponse.json({ error: 'Cannot request your own skill' }, { status: 400 })
  }

  const { data, error } = await requestExchange({
    learner_member_id: fm.member_id,
    teacher_member_id: skill.member_id,
    skill_id,
    scheduled_date,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ exchange: data })
}
