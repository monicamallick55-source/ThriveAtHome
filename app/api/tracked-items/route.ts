import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase.from('navigator_tasks').select('id, task_type, description, priority, completed, member_id, created_at').eq('completed', false).limit(20)
  const { data } = await query.catch(() => ({ data: null }))
  return NextResponse.json((data || []).map((t: Record<string, unknown>) => ({ ...t, status: t.completed ? 'completed' : 'pending' })))
}
