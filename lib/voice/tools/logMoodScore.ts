// Retell tool: log_mood_score — saves a mood score mid-call.
// Args: { score: number, notes?: string }
import { toolAdmin, memberIdFrom, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const memberId = memberIdFrom(args, ctx)
  const callId = str(args.call_id) ?? ctx.callId ?? undefined
  const score = typeof args.score === 'number' ? args.score : undefined
  const notes = str(args.notes)

  if (!memberId || score === undefined) {
    return { status: 200, body: { result: 'Mood noted.' } }
  }

  const admin = toolAdmin()

  if (callId) {
    await admin
      .from('check_in_calls')
      .update({ mood_score: score, ...(notes ? { ai_summary: notes } : {}) })
      .eq('retell_call_id', callId)
  }

  // Standalone mood_logs entry if that table exists — non-fatal
  const { error } = await admin.from('mood_logs').insert({
    member_id: memberId,
    score,
    notes: notes ?? null,
    source: 'aria_call',
    call_id: callId ?? null,
  })
  if (error) console.warn('[log-mood-score] mood_logs insert skipped:', error.message)

  console.log(`[log-mood-score] member=${memberId} score=${score}`)
  return { status: 200, body: { result: 'Thank you — I\'ve noted how you\'re feeling today.' } }
}
