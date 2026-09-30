// Retell tool: update_call_preferences — member tells the agent how often to call.
// Args: { call_frequency?: string, preferred_time?: string }
import { toolAdmin, memberIdFrom, str, type ToolArgs, type ToolContext, type ToolOutcome } from './types'

export async function run(args: ToolArgs, ctx: ToolContext): Promise<ToolOutcome> {
  const memberId = memberIdFrom(args, ctx)
  const callFrequency = str(args.call_frequency)
  const preferredTime = str(args.preferred_time)

  if (!memberId) return { status: 400, body: { error: 'member_id is required' } }

  let freq = 'weekly'
  if (callFrequency) {
    const f = callFrequency.toLowerCase().trim()
    if (f.includes('daily') || f.includes('every day')) freq = 'daily'
    else if (f.includes('few') || f.includes('twice') || f.includes('other day')) freq = 'few_times_week'
    else if (f.includes('week')) freq = 'weekly'
  }

  const admin = toolAdmin()
  const { data: member, error: memberErr } = await admin
    .from('members')
    .select('id, preferred_name')
    .eq('id', memberId)
    .maybeSingle()

  if (memberErr || !member) return { status: 404, body: { error: 'Member not found' } }

  const { error: updateErr } = await admin
    .from('members')
    .update({ call_frequency_preference: freq, onboarding_call_completed: true })
    .eq('id', memberId)

  if (updateErr) {
    console.error('[update-call-preferences] error:', updateErr)
    return { status: 500, body: { error: 'Failed to update preferences' } }
  }

  const freqPhrase = freq === 'daily' ? 'every day' : freq === 'few_times_week' ? 'a few times a week' : 'once a week'

  return {
    status: 200,
    body: {
      success: true,
      result: 'Got it, I will call you ' + freqPhrase + (preferredTime ? ' in the ' + preferredTime : '') + '. You are all set!',
    },
  }
}
