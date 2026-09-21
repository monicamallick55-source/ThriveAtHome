// M22 Phase 92 — revoke an EHR / FHIR connection.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createAdminClient } from '@/lib/supabase/admin'
import { revokeEhrConnection } from '@/lib/data/devices'
import { ehrProvider } from '@/lib/providers'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: conn } = await admin
    .from('ehr_connections')
    .select('id, member_id, patient_fhir_id')
    .eq('id', id)
    .maybeSingle()
  if (!conn || conn.member_id !== memberId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (conn.patient_fhir_id) {
    try {
      await ehrProvider.revoke(conn.patient_fhir_id)
    } catch (e) {
      console.error('[api/ehr/[id]] provider revoke failed:', e)
    }
  }

  const { error } = await revokeEhrConnection(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
