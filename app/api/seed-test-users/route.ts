import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const TEST_USERS = [
  { email: 'orgadmin@test.com', password: 'TestPass123!', role: 'org_admin' },
  { email: 'uniadmin@test.com', password: 'TestPass123!', role: 'uni_admin' },
]
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-seed-secret') || ''
  if (secret !== 'thrive-e2e-seed-2026') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const results: Record<string, string> = {}
  const { data: listData } = await admin.auth.admin.listUsers()
  for (const u of TEST_USERS) {
    const existing = listData?.users?.find((x: any) => x.email === u.email)
    if (existing) { results[u.email] = 'exists:' + existing.id; continue }
    const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true })
    results[u.email] = error ? 'error:' + error.message : 'created:' + (data as any).user.id
  }
  return NextResponse.json({ seeded: results })
}
