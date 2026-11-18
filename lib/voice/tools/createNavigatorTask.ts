import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function run(args: Record<string, unknown>, memberId: string | null): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: args.task_type ?? 'general',
    priority: args.priority ?? 'normal',
    status: 'pending',
    description: args.description ?? '',
  })
  if (error) console.error('[Tool] createNavigatorTask:', error.message)
  return { ok: !error }
}
