import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    tier: 'corporate',
    total_hours: 0,
    volunteer_count: 0,
    impact_score: 0,
    next_tier_hours: 500,
    badges: [],
  })
}
