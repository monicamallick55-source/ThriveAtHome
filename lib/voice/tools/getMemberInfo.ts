import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function run(args: Record<string, unknown>, memberId: string | null): Promise<Record<string, unknown>> {
  if (!memberId) return { error: 'no member id' }
  const { data, error } = await supabase.from('members')
    .select('id, full_name, phone_number, date_of_birth, plan_tier, checkin_preference, aria_call_opted_in, risk_level')
    .eq('id', memberId).maybeSingle()
  if (error) { console.error('[Tool] getMemberInfo:', error.message); return { error: error.message } }
  return data ?? { error: 'not found' }
}
