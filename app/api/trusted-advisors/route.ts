import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'adv-mock-001', name: 'Dr. Test', category: 'grief', status: 'active' }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { searchParams } = new URL(req.url); const category = searchParams.get('category'); const limit = parseInt(searchParams.get('limit') || '20'); let q = supabase.from('trusted_advisors').select('*').limit(limit); if (category) q = q.eq('category', category); const { data } = await q; if (data && data.length > 0) return NextResponse.json(data) } catch {}
  const category = new URL(req.url).searchParams.get('category'); return NextResponse.json(category ? MOCK.filter(a => a.category === category) : MOCK)
}
