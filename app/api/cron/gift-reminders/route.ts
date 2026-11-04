import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
const CRON_SECRET = process.env.CRON_SECRET
const HOLIDAYS: Array<[number, number, string, number]> = [
  [11, 28, "Thanksgiving", 14],[12, 25, "Christmas", 21],
  [5, 8, "Mother's Day", 10],[6, 16, "Father's Day", 10],[2, 14, "Valentine's Day", 7],
]
function isWithinDays(m: number, d: number, days: number): boolean {
  const now = new Date(); const year = now.getFullYear()
  let target = new Date(year, m - 1, d)
  if (target < now) target = new Date(year + 1, m - 1, d)
  const diff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = await createClient(); const now = new Date(); const reminded: string[] = []
    const { data: members } = await supabase.from('members').select('id, first_name, last_name, date_of_birth').not('date_of_birth', 'is', null)
    for (const member of members ?? []) {
      if (!member.date_of_birth) continue
      const dob = new Date(member.date_of_birth)
      if (!isWithinDays(dob.getMonth() + 1, dob.getDate(), 7)) continue
      const { data: familyLinks } = await supabase.from('family_member_links').select('family_member_id, family_members(id, name, email, user_id)').eq('member_id', member.id)
      for (const link of familyLinks ?? []) {
        const fm = (link as any).family_members
        if (!fm?.user_id) continue
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', fm.user_id).eq('type', 'gift_reminder_birthday').eq('related_id', member.id).gte('created_at', new Date(now.getTime() - 7 * 86400000).toISOString()).limit(1)
        if (existing && existing.length > 0) continue
        await supabase.from('notifications').insert({ user_id: fm.user_id, type: 'gift_reminder_birthday', related_id: member.id, title: `🎂 ${member.first_name}'s birthday is coming up!`, body: `Send a gift through ThriveAtHome.`, action_url: '/dashboard/gifts', read: false })
        reminded.push(`birthday:${member.id}:${fm.user_id}`)
      }
    }
    for (const [month, day, label, daysBefore] of HOLIDAYS) {
      if (!isWithinDays(month, day, daysBefore)) continue
      const { data: familyUsers } = await supabase.from('family_members').select('id, user_id, name').not('user_id', 'is', null)
      for (const fm of familyUsers ?? []) {
        if (!fm.user_id) continue
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', fm.user_id).eq('type', 'gift_reminder_holiday').ilike('title', `%${label}%`).gte('created_at', new Date(now.getTime() - 14 * 86400000).toISOString()).limit(1)
        if (existing && existing.length > 0) continue
        await supabase.from('notifications').insert({ user_id: fm.user_id, type: 'gift_reminder_holiday', related_id: null, title: `🎁 ${label} is coming up!`, body: `Send a gift for ${label} through ThriveAtHome.`, action_url: '/dashboard/gifts', read: false })
        reminded.push(`holiday:${label}:${fm.user_id}`)
      }
    }
    return NextResponse.json({ ok: true, reminded_count: reminded.length, reminded, ran_at: now.toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
