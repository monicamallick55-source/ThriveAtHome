import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'vso-mock-001', volunteer_id: 'vol-1', name: 'John Veteran', status: 'pending', submitted_at: new Date().toISOString() }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { searchParams } = new URL(req.url); const status = searchParams.get('status'); let q = supabase.from('vso_approvals').select('*').limit(20); if (status) q = q.eq('status', status); const { data } = await q; if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
