// Atomic signup: creates Supabase auth user + family_members row.
// Rolls back (deletes auth user) if family_members insert fails.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; fullName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { email, password, fullName } = body
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Step 1: Create auth user (email confirmed immediately — no email verification in v1)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Could not create account.'
    console.error('[api/auth/signup] Auth user creation failed:', authError)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = authData.user.id

  // Step 2: Insert family_members row
  const { error: insertError } = await admin.from('family_members').insert({
    supabase_auth_id: userId,
    full_name: fullName,
    email,
    role: 'family',
  })

  if (insertError) {
    console.error('[api/auth/signup] family_members insert failed — rolling back:', insertError)
    // Rollback: delete the auth user so no orphan exists
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[api/auth/signup] ROLLBACK FAILED — orphaned auth user:', userId, deleteError)
    }
    return NextResponse.json(
      { error: 'Could not complete sign-up. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
