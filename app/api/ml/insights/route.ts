// M23 — family-facing read + manual recompute of the ML wellness intelligence
// for the caller's own member.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMemberContext } from '@/lib/data/members'
import { getMlSummaryForMember } from '@/lib/data/ml'
import { runMlForMember } from '@/lib/ml/mlSweep'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  const { data, error } = await getMlSummaryForMember(memberId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ summary: data })
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  try {
    const run = await runMlForMember(memberId)
    const { data } = await getMlSummaryForMember(memberId)
    return NextResponse.json({ ok: true, run, summary: data })
  } catch (e) {
    console.error('[api/ml/insights POST] failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
