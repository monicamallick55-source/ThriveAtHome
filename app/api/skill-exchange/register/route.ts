import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { registerSkill } from '@/lib/data/skill-exchange'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const body = await request.json()
  const { skill_name, skill_category, description, delivery_method, max_group_size } = body

  if (!skill_name || !description) {
    return NextResponse.json({ error: 'skill_name and description are required' }, { status: 400 })
  }

  const { data, error } = await registerSkill({
    member_id: fm.member_id,
    skill_name,
    skill_category: skill_category ?? 'other',
    description,
    delivery_method: delivery_method ?? 'phone',
    max_group_size: max_group_size ?? 1,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ skill: data })
}
