import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'train-mock-001', title: 'Companion Care Basics', status: 'available', duration_minutes: 60 }]
export async function GET(_req: NextRequest) {
  try { const supabase = await createClient(); const { data } = await supabase.from('volunteer_training').select('*').limit(20); if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
