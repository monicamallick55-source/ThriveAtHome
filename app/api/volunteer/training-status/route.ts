import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('volunteer_profiles')
    .select('training_completed, training_completed_at, training_modules')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    training_completed: data?.training_completed ?? false,
    training_completed_at: data?.training_completed_at ?? null,
    modules: data?.training_modules ?? [],
    can_volunteer: data?.training_completed ?? false,
  })
}
