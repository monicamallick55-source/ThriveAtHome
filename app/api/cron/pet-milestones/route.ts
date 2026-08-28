// M27 Phase 117/118 — daily sweep for pet birthdays, adoption ("gotcha day") anniversaries,
// and senior-companion milestones. Writes rows into the shared celebration_events table so
// pet milestones appear alongside human ones on /dashboard/celebrations, pushes a family
// realtime notification, and logs a [STUB][Aria] line for the next friendly call.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  daysUntilAnniversary,
  yearsAtNextAnniversary,
  petCelebrationExists,
  petOneTimeCelebrationExists,
} from '@/lib/data/pets'

export const runtime = 'nodejs'

const WINDOW_DAYS = 7

export async function GET(req: NextRequest) {
  const started = Date.now()
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    console.warn('[pet-milestones-cron] CRON_SECRET not set — running unauthenticated')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration: Supabase env not set' }, { status: 500 })
  }

  const admin = createAdminClient()
  const results = { pets_checked: 0, created: 0, notified: 0, skipped_exists: 0, errors: 0, details: [] as string[] }
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Active members with at least one living pet.
  const { data: pets, error: petsErr } = await admin
    .from('member_pets')
    .select('id, member_id, name, species, birth_date, adoption_date, is_active, passed_away_on')
    .eq('is_active', true)
    .is('passed_away_on', null)
  if (petsErr) {
    return NextResponse.json({ error: 'DB error fetching pets', detail: petsErr.message }, { status: 500 })
  }

  const memberIds = Array.from(new Set((pets ?? []).map((p) => p.member_id)))
  const { data: activeMembers } = await admin
    .from('members')
    .select('id, preferred_name, full_name, status')
    .in('id', memberIds.length ? memberIds : ['00000000-0000-0000-0000-000000000000'])
  const activeMemberMap = new Map(
    (activeMembers ?? []).filter((m) => m.status === 'active').map((m) => [m.id, m])
  )

  for (const pet of pets ?? []) {
    results.pets_checked++
    const member = activeMemberMap.get(pet.member_id)
    if (!member) continue
    const memberName = member.preferred_name ?? member.full_name

    type Candidate = { type: string; eventDate: string; message: string; oneTime: boolean }
    const candidates: Candidate[] = []

    try {
      // Birthday
      if (pet.birth_date) {
        const d = daysUntilAnniversary(pet.birth_date, today)
        if (d >= 0 && d <= WINDOW_DAYS) {
          const years = yearsAtNextAnniversary(pet.birth_date, today)
          const eventDate = addDays(today, d)
          candidates.push({
            type: 'pet_birthday',
            eventDate,
            oneTime: false,
            message:
              d === 0
                ? `Today is ${pet.name}'s birthday${years > 0 ? ` — turning ${years}` : ''}! 🐾`
                : `${pet.name}'s birthday is in ${d} day${d === 1 ? '' : 's'}${years > 0 ? ` (turning ${years})` : ''}.`,
          })
        }
      }
      // Adoption anniversary ("gotcha day")
      if (pet.adoption_date) {
        const d = daysUntilAnniversary(pet.adoption_date, today)
        if (d >= 0 && d <= WINDOW_DAYS) {
          const years = yearsAtNextAnniversary(pet.adoption_date, today)
          const eventDate = addDays(today, d)
          candidates.push({
            type: 'pet_adoption_anniversary',
            eventDate,
            oneTime: false,
            message:
              d === 0
                ? `Today marks ${years > 0 ? `${years} year${years === 1 ? '' : 's'} ` : ''}since ${memberName} welcomed ${pet.name} home. 🏡`
                : `${pet.name}'s adoption anniversary${years > 0 ? ` (${years} year${years === 1 ? '' : 's'})` : ''} is in ${d} day${d === 1 ? '' : 's'}.`,
          })
        }
      }
      // Senior-companion milestone (dogs & cats reaching ~10 years) — one-time per pet
      if (pet.birth_date && (pet.species === 'dog' || pet.species === 'cat')) {
        const ageYears = Math.floor(
          (today.getTime() - new Date(pet.birth_date + 'T00:00:00Z').getTime()) / (365.25 * 86_400_000)
        )
        if (ageYears >= 10) {
          candidates.push({
            type: 'pet_senior_milestone',
            eventDate: todayStr,
            oneTime: true,
            message: `${pet.name} is now a distinguished senior companion at ${ageYears}. A good moment to celebrate a long friendship.`,
          })
        }
      }

      for (const c of candidates) {
        const exists = c.oneTime
          ? await petOneTimeCelebrationExists(pet.id, c.type)
          : await petCelebrationExists(pet.id, c.type, new Date(c.eventDate + 'T00:00:00Z').getUTCFullYear())
        if (exists) {
          results.skipped_exists++
          continue
        }

        const { data: celeb, error: createErr } = await admin
          .from('celebration_events')
          .insert({
            member_id: pet.member_id,
            pet_id: pet.id,
            pet_name: pet.name,
            celebration_type: c.type,
            event_date: c.eventDate,
            status: c.eventDate === todayStr ? 'today' : 'scheduled',
            ai_message: c.message,
          })
          .select('id')
          .maybeSingle()
        if (createErr || !celeb) {
          results.errors++
          results.details.push(`pet ${pet.id} ${c.type}: create failed: ${createErr?.message ?? 'no row'}`)
          continue
        }
        results.created++
        console.log(
          `[STUB][Aria] Would gently mention in ${memberName}'s next friendly call: "${c.message}"`
        )

        const { error: notifErr } = await admin.from('realtime_notifications').insert({
          member_id: pet.member_id,
          type: 'celebration_upcoming',
          severity: 'info',
          title:
            c.type === 'pet_birthday'
              ? `${pet.name}'s birthday is coming up`
              : c.type === 'pet_adoption_anniversary'
                ? `${pet.name}'s adoption anniversary is coming up`
                : `A milestone for ${pet.name}`,
          body: c.message,
        })
        if (notifErr) {
          results.details.push(`pet ${pet.id}: notification insert failed: ${notifErr.message}`)
        } else {
          await admin
            .from('celebration_events')
            .update({ family_notified_at: new Date().toISOString() })
            .eq('id', celeb.id)
          results.notified++
        }
      }
    } catch (e) {
      results.errors++
      results.details.push(`pet ${pet.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const summary = { success: true, elapsed_ms: Date.now() - started, ...results }
  console.log('[pet-milestones-cron] Complete:', JSON.stringify(summary))
  return NextResponse.json(summary)
}

function addDays(from: Date, days: number): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
