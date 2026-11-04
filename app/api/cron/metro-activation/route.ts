// app/api/cron/metro-activation/route.ts
// G5.3 — Weekly cron: flip metro to 'official' when ≥ 50 active members + coordinator exists
// Vercel cron: "0 9 * * 1" (every Monday 9am UTC)

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Get all forming metros
  const { data: metros, error } = await db
    .from('metro_areas')
    .select('id, name, slug, coordinator_id')
    .eq('status', 'forming')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const activated: string[] = []
  const needsCoordinator: string[] = []

  for (const metro of (metros ?? [])) {
    // Count active members in this metro
    const { count } = await db
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('metro_area_id', metro.id)
      .eq('status', 'active')

    const memberCount = count ?? 0

    // Update member_count regardless
    await db
      .from('metro_areas')
      .update({ member_count: memberCount })
      .eq('id', metro.id)

    if (memberCount >= 50) {
      if (metro.coordinator_id) {
        // Activate!
        await db
          .from('metro_areas')
          .update({ status: 'official', is_active: true })
          .eq('id', metro.id)

        // Create admin navigator task to notify
        await db.from('navigator_tasks').insert({
          type: 'metro_activated',
          priority: 'medium',
          task_type: 'metro_activated',
          body: `${metro.name} has reached 50+ active members and is now an official ThriveAtHome chapter. Coordinator assigned.`,
          metadata: { metro_id: metro.id, metro_slug: metro.slug, member_count: memberCount },
          status: 'open',
        })

        activated.push(metro.name)
      } else {
        // Has members but no coordinator — create recruitment task
        const { data: existingTask } = await db
          .from('navigator_tasks')
          .select('id')
          .eq('type', 'recruit_metro_coordinator')
          .eq('status', 'open')
          .contains('metadata', { metro_id: metro.id })
          .maybeSingle()

        if (!existingTask) {
          await db.from('navigator_tasks').insert({
            type: 'recruit_metro_coordinator',
            priority: 'high',
            task_type: 'recruit_coordinator',
            body: `${metro.name} has ${memberCount} active members (≥50) but no coordinator assigned. Recruit a local coordinator to activate this chapter.`,
            metadata: { metro_id: metro.id, metro_slug: metro.slug, member_count: memberCount },
            status: 'open',
          })
        }

        needsCoordinator.push(`${metro.name} (${memberCount} members)`)
      }
    }
  }

  return NextResponse.json({
    checked: (metros ?? []).length,
    activated,
    needs_coordinator: needsCoordinator,
    ran_at: new Date().toISOString(),
  })
}
