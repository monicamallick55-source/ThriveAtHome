import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const MOCK = [{ id: 'vsoh-mock-001', volunteer_id: 'vol-1', hours: 8, status: 'pending_approval', submitted_at: new Date().toISOString() }]
export async function GET(req: NextRequest) {
  try { const supabase = await createClient(); const { searchParams } = new URL(req.url); const status = searchParams.get('status'); let q = supabase.from('vso_hours').select('*').limit(20); if (status) q = q.eq('status', status); const { data } = await q; if (data && data.length > 0) return NextResponse.json(data) } catch {}
  return NextResponse.json(MOCK)
}
export async function PATCH(req: NextRequest) {
  let body: Record<string,unknown> = {}; try { body = await req.json() } catch {}
  return NextResponse.json({ id: 'vsoh-mock-001', ...body, status: 'approved' })
}
