// M25 Phase 102 — Daily sweep: for cultural festivals starting within 7 days,
// flag members of the matching cultural circle so Aria can acknowledge the
// festival warmly on her next call, and notify the family dashboard.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFestivalsWithinDays } from '@/lib/data/cultural'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const admin = createAdminClient()
  const festivals = await getFestivalsWithinDays(7)
  const results = { festivals: festivals.length, membersFlagged: 0, notified: 0, errors: 0 }

  for (const festival of festivals) {
    try {
      // Members whose cultural circle matches this festival's circle_name.
      let memberIds: string[] = []
      if (festival.circle_name) {
        const { data: circle } = await admin
          .from('cultural_circles')
          .select('id')
          .eq('circle_name', festival.circle_name)
          .maybeSingle()
        if (circle) {
          const { data: memberships } = await admin
            .from('circle_memberships')
            .select('member_id')
            .eq('circle_id', circle.id)
          memberIds = (memberships ?? []).map((m: any) => m.member_id)
        }
      }

      const greeting = festival.typical_greeting ? ` I might say "${festival.typical_greeting}".` : ''
      for (const memberId of memberIds) {
        console.log(
          `[STUB][Aria] Would warmly acknowledge ${festival.festival_name} (${festival.festival_date}) with member ${memberId}.${greeting}`
        )
        results.membersFlagged++

        const { data: fms } = await admin
          .from('family_members')
          .select('id')
          .eq('member_id', memberId)
        if ((fms ?? []).length > 0) {
          try {
            await (admin as any).from('realtime_notifications').insert({
              member_id: memberId,
              type: 'celebration_upcoming',
              severity: 'info',
              title: `${festival.festival_name} is coming up`,
              body: `${festival.festival_name} is on ${festival.festival_date}. Aria will mention it on her next call. See classes, potlucks, and story circles in Cultural Programming.`,
            })
            results.notified++
          } catch (e) {
            console.error('[cron/cultural-festivals] notif insert failed:', e)
            results.errors++
          }
        }
      }
    } catch (e) {
      console.error(`[cron/cultural-festivals] Error for festival ${festival.id}:`, e)
      results.errors++
    }
  }

  console.log('[cron/cultural-festivals] Done:', results)
  return NextResponse.json({ success: true, ...results })
}
