import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [
  { id: 'evt-mock-001', title: 'Morning Yoga', event_date: new Date(Date.now() + 86400000).toISOString(), status: 'upcoming', category: 'wellness' },
  { id: 'evt-mock-002', title: 'Book Club', event_date: new Date(Date.now() + 172800000).toISOString(), status: 'upcoming', category: 'social' },
]
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true }).limit(20).catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK)
}
