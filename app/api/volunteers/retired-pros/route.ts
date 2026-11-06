import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const SPECIALTY_LABELS: Record<string, { label: string; emoji: string }> = {
  attorney:   { label: 'Attorney',          emoji: '⚖️' },
  cpa:        { label: 'CPA / Accountant',  emoji: '📊' },
  financial:  { label: 'Financial Advisor', emoji: '💰' },
  physician:  { label: 'Physician',         emoji: '🩺' },
  nurse:      { label: 'Nurse',             emoji: '🏥' },
  pharmacist: { label: 'Pharmacist',        emoji: '💊' },
  engineer:   { label: 'Engineer',          emoji: '⚙️' },
  social_work:{ label: 'Social Worker',     emoji: '🤝' },
  therapist:  { label: 'Therapist',         emoji: '🧠' },
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const specialtyFilter = searchParams.get('specialty')
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('volunteers')
    .select('id, full_name, volunteer_specialty, city, state, total_hours_logged, bio')
    .eq('status', 'active')
    .not('volunteer_specialty', 'is', null)
    .order('total_hours_logged', { ascending: false })
  if (specialtyFilter) {
    const values = specialtyFilter.split(',').map(s => s.trim()).filter(Boolean)
    if (values.length === 1) query = query.eq('volunteer_specialty', values[0])
    else if (values.length > 1) query = query.in('volunteer_specialty', values)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pros = (data ?? []).map((v: any) => {
    const meta = SPECIALTY_LABELS[v.volunteer_specialty] ?? { label: v.volunteer_specialty, emoji: '👤' }
    const nameParts = (v.full_name ?? '').split(' ')
    return {
      id: v.id, first_name: nameParts[0] ?? 'Volunteer', last_initial: nameParts[1]?.[0] ?? '',
      specialty: v.volunteer_specialty, specialty_label: meta.label, specialty_emoji: meta.emoji,
      location: [v.city, v.state].filter(Boolean).join(', ') || null,
      total_hours: v.total_hours_logged ?? 0, bio: v.bio ?? null,
    }
  })
  return NextResponse.json({ pros, specialty_labels: SPECIALTY_LABELS })
}
