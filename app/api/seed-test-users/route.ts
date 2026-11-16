/**
 * POST /api/seed-test-users
 * Creates missing test accounts in Supabase Auth using service role key.
 * Safe to call multiple times — skips existing users but always upserts member rows.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const TEST_USERS = [
  { email: 'orgadmin@test.com', password: 'TestPass123!', role: 'org_admin' },
  { email: 'uniadmin@test.com', password: 'TestPass123!', role: 'uni_admin' },
  { email: 'admin@test.com',    password: 'TestPass123!', role: 'admin' },
  { email: 'member@test.com',   password: 'TestPass123!', role: 'member' },
  { email: 'family@test.com',   password: 'TestPass123!', role: 'family' },
  { email: 'volunteer@test.com',password: 'TestPass123!', role: 'volunteer' },
  { email: 'navigator@test.com',password: 'TestPass123!', role: 'navigator' },
]

const MEMBER_ROLES = ['member','family','volunteer','navigator']

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-seed-secret') || ''
  if (secret !== 'thrive-e2e-seed-2026') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const results: Record<string, string> = {}

  for (const u of TEST_USERS) {
    const { error: listErr, data: listData } = await admin.auth.admin.listUsers()
    let userId: string | null = null

    if (!listErr) {
      const existing = listData.users.find((x: any) => x.email === u.email)
      if (existing) {
        results[u.email] = 'exists:' + existing.id
        userId = existing.id
      }
    }

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { role: u.role, test_account: true },
      })
      if (error) {
        results[u.email] = 'error:' + error.message
        continue
      }
      results[u.email] = 'created:' + data.user.id
      userId = data.user.id
    }

    // Always upsert member row for member-type roles
    if (MEMBER_ROLES.includes(u.role) && userId) {
      const { error: memberErr } = await admin.from('members').upsert({
        supabase_auth_id: userId,
        full_name: u.role.charAt(0).toUpperCase() + u.role.slice(1) + ' Test',
        preferred_name: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        date_of_birth: '1950-01-01',
        phone_number: '555-0001',
        preferred_language: 'english',
        timezone: 'America/New_York',
        check_in_frequency: 'daily',
        plan_tier: 'basics',
        status: 'active',
      }, { onConflict: 'supabase_auth_id' })
      if (memberErr) results[u.email] += ':member_err:' + memberErr.message
      else results[u.email] += ':member_ok'
    }
  }

  return NextResponse.json({ seeded: results })
}
