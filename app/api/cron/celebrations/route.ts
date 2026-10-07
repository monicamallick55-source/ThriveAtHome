import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runJoyCalls } from '@/lib/voice/outboundTriggers'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date()
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(today.getUTCDate()).padStart(2, '0')

  const { data: birthdayMembers } = await supabase
    .from('members')
    .select('id, preferred_name, full_name, date_of_birth, plan_tier, timezone')
    .filter('celebration_opt_out' as any, 'eq', false)
    .filter('date_of_birth', 'not.is', null)
    .filter('date_of_birth', 'like', `%-${mm}-${dd}`)

  const results: Record<string, unknown>[] = []

  for (const member of birthdayMembers ?? []) {
    const dob = new Date(member.date_of_birth)
    const age = today.getUTCFullYear() - dob.getUTCFullYear()

    const { data: milestone } = await (supabase.from as any)('milestone_birthday_programs')
      .select('*')
      .eq('age', age)
      .eq('is_active', true)
      .maybeSingle()

    await supabase.from('member_achievements').insert({
      member_id: member.id,
      type: milestone ? `milestone_birthday_${age}` : 'birthday',
      occurred_at: new Date().toISOString(),
      shared_with_family: true,
      metadata: {
        age,
        milestone_name: milestone?.program_name ?? null,
        gifts: milestone?.gifts ?? [],
      },
    })

    results.push({ member_id: member.id, age, milestone: milestone?.program_name ?? null })
  }

  await runJoyCalls()

  return NextResponse.json({ processed: results.length, birthdays: results })
}
