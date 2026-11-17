import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  return NextResponse.json({ training_completed: false, training_complete: false, can_volunteer: false, modules_completed: 0, modules_total: 5, modules: [] })
}
