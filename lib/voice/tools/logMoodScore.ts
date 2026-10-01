// Retell tool: log_mood_score — saves a mood score mid-call onto this call's check_in_calls row
// (there is no mood_logs table). Post-call processing keeps a score set here instead of
// overwriting it with the AI-extracted one.
// Args: { score: number (1–10), notes?: string }. Members only — anyone else gets a polite spoken reply.
import { toolAdmin, resolveToolCaller, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const memberId = (await resolveToolCaller(args, ctx)).memberId
  const callId = str(args.call_id) ?? ctx.callId ?? undefined
  const raw = typeof args.score === 'number' ? args.score : typeof args.score === 'string' ? Number(args.score) : NaN
  const score = Number.isFinite(raw) ? Math.min(10, Math.max(1, Math.round(raw))) : undefined

  if (!memberId) return { status: 200, body: { result: 'Thank you for telling me how you\'re feeling.' } }
  if (score === undefined || !callId) return { status: 200, body: { result: 'Mood noted.' } }

  const admin = toolAdmin()
  // The row normally exists from call_started; create it if that event was missed.
  const { data: updated, error: updErr } = await admin
    .from('check_in_calls').update({ mood_score: score }).eq('retell_call_id', callId).select('id')
  let error = updErr
  if (!error && (updated ?? []).length === 0) {
    ;({ error } = await admin.from('check_in_calls').insert({
      retell_call_id: callId,
      member_id: memberId,
      status: 'in_progress',
      direction: ctx.direction === 'outbound' ? 'outbound' : 'inbound',
      mood_score: score,
      started_at: new Date().toISOString(),
    }))
  }
  if (error) {
    console.error('[log-mood-score] save failed:', error.message)
    return { status: 200, body: { result: 'Thank you for telling me how you\'re feeling.' } }
  }

  console.log(`[log-mood-score] member=${memberId} score=${score}`)
  return { status: 200, body: { result: 'Thank you — I\'ve noted how you\'re feeling today.' } }
}
