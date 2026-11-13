import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('members').upsert({ user_id: user.id, first_name: body.first_name, last_name: body.last_name, zip_code: body.zip_code, aria_opt_in: body.aria_opt_in ?? false, grief_support: body.grief_support ?? false, onboarding_complete: true, plan_tier: 'basic', updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.grief_support) {
    await supabase.from('navigator_tasks').insert({ title: 'Grief support check-in', description: 'Member opted into grief support during onboarding', status: 'pending', priority: 'high', member_id: data.id, created_by: user.id, assigned_to: user.id, created_at: new Date().toISOString() }).catch(() => {})
  }
  return NextResponse.json(data, { status: 201 })
}
