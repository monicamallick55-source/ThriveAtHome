import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function run(args: Record<string, unknown>, memberId: string | null): Promise<{ ok: boolean }> {
  if (!memberId) return { ok: false }
  const { error } = await supabase.from('service_requests').insert({
    member_id: memberId,
    service_type: args.service_type ?? 'general',
    description: args.description ?? '',
    requested_for: args.date ?? null,
    status: 'pending',
  })
  if (error) console.error('[Tool] scheduleService:', error.message)
  return { ok: !error }
}
