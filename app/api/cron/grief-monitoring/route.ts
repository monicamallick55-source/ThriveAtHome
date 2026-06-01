import { NextResponse } from 'next/server'
import {
  detectProlongedGriefMembers,
  createProlongedGriefTask,
  getMembersNearLossAnniversary,
  setDailyCheckInForGrief,
} from '@/lib/data/grief'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const results = {
    prolongedGrief: { checked: 0, tasksCreated: 0, errors: [] as string[] },
    anniversaries: { checked: 0, updatedToDaily: 0, errors: [] as string[] },
  }

  // --- Prolonged grief detection ---
  const { data: flaggedMembers, error: pgError } = await detectProlongedGriefMembers()
  if (pgError) {
    results.prolongedGrief.errors.push(pgError)
  } else {
    results.prolongedGrief.checked = flaggedMembers?.length ?? 0
    for (const memberId of flaggedMembers ?? []) {
      const { error } = await createProlongedGriefTask(memberId)
      if (error) results.prolongedGrief.errors.push(`${memberId}: ${error}`)
      else results.prolongedGrief.tasksCreated++
    }
  }

  // --- Anniversary sensitivity ---
  const { data: anniversaryMembers, error: annError } = await getMembersNearLossAnniversary()
  if (annError) {
    results.anniversaries.errors.push(annError)
  } else {
    results.anniversaries.checked = anniversaryMembers?.length ?? 0
    const seen = new Set<string>()
    for (const { member_id } of anniversaryMembers ?? []) {
      if (seen.has(member_id)) continue
      seen.add(member_id)
      const { error } = await setDailyCheckInForGrief(member_id)
      if (error) results.anniversaries.errors.push(`${member_id}: ${error}`)
      else results.anniversaries.updatedToDaily++
    }
  }

  console.log('[cron/grief-monitoring]', JSON.stringify(results))
  return NextResponse.json({ ok: true, results })
}
