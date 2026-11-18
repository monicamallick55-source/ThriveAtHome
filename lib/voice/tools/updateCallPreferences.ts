import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function run(args: Record<string, unknown>, memberId: string | null): Promise<{ ok: boolean }> {
  if (!memberId) return { ok: false }
  const updates: Record<string, unknown> = {}
  if (args.frequency) updates.call_frequency_preference = args.frequency
  if (args.time_preference) updates.call_time_preference = args.time_preference
  if (args.opted_in !== undefined) updates.aria_call_opted_in = !!args.opted_in
  if (!Object.keys(updates).length) return { ok: true }
  const { error } = await supabase.from('members').update(updates).eq('id', memberId)
  if (error) console.error('[Tool] updateCallPreferences:', error.message)
  return { ok: !error }
}
