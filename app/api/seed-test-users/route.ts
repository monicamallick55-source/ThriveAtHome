import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const TEST_USERS = [
  { email: 'member@test.com', password: 'TestPass123!', role: 'member' },
  { email: 'family@test.com', password: 'TestPass123!', role: 'family' },
  { email: 'volunteer@test.com', password: 'TestPass123!', role: 'volunteer' },
  { email: 'navigator@test.com', password: 'TestPass123!', role: 'navigator' },
  { email: 'admin@test.com', password: 'TestPass123!', role: 'admin' },
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
    let authId: string
    const existing = listData?.users?.find((x: any) => x.email === u.email)
    if (existing) {
      authId = existing.id
      results[u.email] = 'exists:' + authId
    } else {
      const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true })
      if (error) { results[u.email] = 'error:' + error.message; continue }
      authId = (data as any).user.id
      results[u.email] = 'created:' + authId
    }
    // Ensure member row exists for member-role users
    if (u.role === 'member') {
      const { data: existing_member } = await admin.from('members').select('id').eq('supabase_auth_id', authId).maybeSingle()
      if (!existing_member) {
        const { error: mErr } = await admin.from('members').insert({
          supabase_auth_id: authId,
          full_name: 'Test Member',
          preferred_name: 'Tester',
          date_of_birth: '1950-01-01',
          phone_number: '555-0100',
          preferred_language: 'english',
          timezone: 'America/Los_Angeles',
          check_in_frequency: 'daily',
          plan_tier: 'basics',
          status: 'active',
        })
        if (mErr) results[u.email] += ' member_err:' + mErr.message
        else results[u.email] += ' member:ok'
      } else {
        results[u.email] += ' member:exists'
      }
    }
  }
  return NextResponse.json({ seeded: results })
}
