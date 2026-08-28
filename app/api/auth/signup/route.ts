// Atomic signup: creates Supabase auth user + family_members row.
// Rolls back (deletes auth user) if family_members insert fails.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let body: {
    email?: string
    password?: string
    fullName?: string
    referralCode?: string
    accountType?: 'self' | 'proxy'
    relationship?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { email, password, fullName, referralCode, accountType } = body
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 })
  }

  // 'self' — the person signing up is the senior who will receive Aria's calls.
  // 'proxy' (default) — a family member enrolling someone they care for.
  const isSelfSignup = accountType === 'self'
  const relationship = isSelfSignup ? 'self' : (body.relationship?.trim() || null)

  const admin = createAdminClient()

  // Resolve referral code to agency
  let referringAgencyId: string | null = null
  let referringAgencyName: string | null = null
  if (referralCode?.trim()) {
    const { data: link } = await (admin as any)
      .from('agency_referral_links')
      .select('agency_id, referral_code')
      .eq('referral_code', referralCode.trim())
      .eq('is_active', true)
      .maybeSingle() as { data: { agency_id: string; referral_code: string } | null }
    if (link) {
      referringAgencyId = link.agency_id
      const { data: agency } = await admin
        .from('care_agencies' as any)
        .select('name')
        .eq('id', link.agency_id)
        .maybeSingle() as { data: { name: string } | null }
      referringAgencyName = agency?.name ?? null
    }
  }

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
    relationship,
    referring_agency_id: referringAgencyId,
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

  // Step 3: Co-branded welcome email stub for agency referrals
  if (referringAgencyId && referringAgencyName) {
    console.log(`[STUB][Email] Agency-referred welcome sent to ${fullName}: "Referred by ${referringAgencyName}, Powered by ThriveAtHome."`)
    console.log(`[STUB][Stripe] Would transfer $${(3500 / 100).toFixed(2)} referral fee to ${referringAgencyName} Stripe Connect account on plan activation.`)
  }

  return NextResponse.json({ success: true })
}
