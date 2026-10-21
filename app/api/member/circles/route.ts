import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Find member ID
  let memberId: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directMember } = await (admin.from as any)('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (directMember?.id) {
    memberId = directMember.id
  } else {
    const { data: fm } = await admin
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    memberId = fm?.member_id ?? null
  }

  if (!memberId) return NextResponse.json({ circles: [], events: [] })

  // Get joined circles
  const { data: memberships } = await admin
    .from('circle_memberships')
    .select('circle_id, joined_at')
    .eq('member_id', memberId)

  const circleIds = (memberships ?? []).map((m: any) => m.circle_id)

  // Always fetch age-circle (even if no memberships yet)
  const { data: memberRow } = await (admin.from as any)('members')
    .select('date_of_birth')
    .eq('id', memberId)
    .maybeSingle()

  let ageCircle: { id: string; circle_name: string; description: string; emoji: string | null; already_joined: boolean } | null = null
  if (memberRow?.date_of_birth) {
    const dob = new Date(memberRow.date_of_birth)
    const today2 = new Date()
    const age = today2.getFullYear() - dob.getFullYear() -
      (today2.getMonth() < dob.getMonth() || (today2.getMonth() === dob.getMonth() && today2.getDate() < dob.getDate()) ? 1 : 0)
    const { data: ac } = await (admin.from as any)('cultural_circles')
      .select('id, circle_name, description, emoji')
      .eq('community_type', 'age_group')
      .eq('is_active', true)
      .lte('age_min', age)
      .or(`age_max.is.null,age_max.gte.${age}`)
      .maybeSingle()
    if (ac) {
      ageCircle = { ...ac, already_joined: circleIds.includes(ac.id) }
    }
  }

  if (circleIds.length === 0) return NextResponse.json({ circles: [], events: [], ageCircle })

  // Get circle details
  const { data: circles } = await admin
    .from('cultural_circles')
    .select('id, circle_name, primary_language, description, member_count, image_placeholder')
    .in('id', circleIds)
    .eq('is_active', true)

  // Get upcoming events for joined circles
  const today = new Date().toISOString().slice(0, 10)
  const { data: events } = await (admin.from as any)('circle_events')
    .select('id, circle_id, title, description, event_date, event_time, format, dial_in_number, dial_in_code, video_link, rsvp_count')
    .in('circle_id', circleIds)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10)

  return NextResponse.json({ circles: circles ?? [], events: events ?? [], ageCircle })
}
