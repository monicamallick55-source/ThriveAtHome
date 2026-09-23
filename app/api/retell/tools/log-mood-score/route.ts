// Retell tool handler: saves a mood score mid-call when Aria calls log_mood_score.
// Args from Retell: { score: number (1-5), notes?: string }
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { member_id?: string; call_id?: string; score?: number; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { member_id, call_id, score, notes } = body

  if (!member_id || score === undefined) {
    return NextResponse.json({ result: 'Mood noted.' })
  }

  const admin = createAdminClient()

  // Update the check_in_calls row if we have a call_id
  if (call_id) {
    await admin
      .from('check_in_calls')
      .update({
        mood_score: score,
        ...(notes ? { ai_summary: notes } : {}),
      })
      .eq('retell_call_id', call_id)
  }

  // Also write a standalone mood_logs entry if that table exists
  await (admin.from as any)('mood_logs').insert({
    member_id,
    score,
    notes: notes ?? null,
    source: 'aria_call',
    call_id: call_id ?? null,
  }).throwOnError().catch(() => {
    // Table may not exist yet — non-fatal
  })

  console.log(`[log-mood-score] member=${member_id} score=${score}`)
  return NextResponse.json({ result: 'Thank you — I\'ve noted how you\'re feeling today.' })
}
