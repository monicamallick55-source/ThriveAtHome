import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  return NextResponse.json({ tier: 'none', volunteer_count: 0, quarterly_hours: 0, total_hours: 0 })
}
