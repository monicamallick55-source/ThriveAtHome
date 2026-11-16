import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('members').upsert({
    supabase_auth_id: user.id,
    full_name: body.full_name ?? body.first_name + ' ' + body.last_name,
    preferred_name: body.preferred_name ?? body.first_name ?? 'Friend',
    date_of_birth: body.date_of_birth ?? '1950-01-01',
    phone_number: body.phone_number ?? '555-0000',
    preferred_language: body.preferred_language ?? 'english',
    timezone: body.timezone ?? 'America/New_York',
    check_in_frequency: body.check_in_frequency ?? 'daily',
    address: body.zip_code ?? body.address ?? null,
    plan_tier: 'basics',
    status: 'active',
  }, { onConflict: 'supabase_auth_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.grief_support) {
    await supabase.from('navigator_tasks').insert({ title: 'Grief support check-in', description: 'Member opted into grief support during onboarding', status: 'pending', priority: 'high', member_id: data.id, created_by: user.id, assigned_to: user.id, created_at: new Date().toISOString() }).catch(() => {})
  }
  return NextResponse.json(data, { status: 201 })
}
