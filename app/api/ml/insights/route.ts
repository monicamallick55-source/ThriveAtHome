// M23 — family-facing read + manual recompute of the ML wellness intelligence
// for the caller's own member.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
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

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  const { data, error } = await getMlSummaryForMember(fm.member_id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ summary: data })
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member found' }, { status: 404 })

  try {
    const run = await runMlForMember(fm.member_id)
    const { data } = await getMlSummaryForMember(fm.member_id)
    return NextResponse.json({ ok: true, run, summary: data })
  } catch (e) {
    console.error('[api/ml/insights POST] failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
