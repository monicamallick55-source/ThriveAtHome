// Logs a view/click on an embedded 988 / SAMHSA crisis resource. Phase 100 (M24).
// Best-effort analytics only — never blocks the user reaching help.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const VALID_SURFACES = ['dashboard_footer', 'grief', 'crisis_page', 'member_portal', 'other']
const VALID_ACTIONS = ['view', 'call_clicked', 'text_clicked', 'chat_clicked']

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  }
  const { resource_key, surface, action } = body as Record<string, unknown>
  if (typeof resource_key !== 'string' || !resource_key) {
    return NextResponse.json({ ok: false, error: 'resource_key required' }, { status: 400 })
  }

  const surfaceVal = typeof surface === 'string' && VALID_SURFACES.includes(surface) ? surface : 'other'
  const actionVal = typeof action === 'string' && VALID_ACTIONS.includes(action) ? action : 'view'

  try {
    const admin = createAdminClient()
    const { data: fm } = await getFamilyMemberByAuthId(user.id)
    const { error } = await admin.from('crisis_resource_views').insert({
      member_id: fm?.member_id ?? null,
      viewer_auth_id: user.id,
      resource_key: resource_key.slice(0, 80),
      surface: surfaceVal,
      action: actionVal,
    })
    if (error) {
      console.error('[api/crisis-resources/log]', error)
      return NextResponse.json({ ok: false }, { status: 200 })
    }
  } catch (e) {
    console.error('[api/crisis-resources/log] Unexpected:', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
