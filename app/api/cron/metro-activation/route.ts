import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Cron: activate metro areas that have ≥50 members and a coordinator assigned
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Find metros with coordinator but not yet activated
  const { data: metros, error } = await admin
    .from('metro_areas')
    .select('id, name, member_count, coordinator_family_member_id')
    .eq('status', 'forming')
    .not('coordinator_family_member_id', 'is', null)

  if (error) {
    console.error('[metro-activation] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let activated = 0
  for (const metro of metros ?? []) {
    if ((metro.member_count ?? 0) >= 50) {
      const { error: updateErr } = await admin
        .from('metro_areas')
        .update({ status: 'active', activated_at: new Date().toISOString() })
        .eq('id', metro.id)
      if (updateErr) {
        console.error(`[metro-activation] update error ${metro.id}:`, updateErr.message)
      } else {
        console.log(`[metro-activation] Activated: ${metro.name}`)
        activated++
      }
    }
  }

  return NextResponse.json({ checked: (metros ?? []).length, activated })
}
