// app/api/onboarding/submit/route.ts
// POST — triggered by the browser when SSE status === 'ready_to_submit'
// Creates the members row and marks the onboarding session complete

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Authenticated client — identifies the family member making the request
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { session_id } = (await req.json()) as { session_id: string }

  if (!session_id) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  // Fetch the onboarding session data (use admin client to read any session)
  const { data: onboarding, error: fetchError } = await supabaseAdmin
    .from('onboarding_sessions')
    .select('*')
    .eq('session_id', session_id)
    .single()

  if (fetchError || !onboarding) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Guard: must be in ready_to_submit state
  if (onboarding.status !== 'ready_to_submit') {
    return NextResponse.json(
      { error: `Session not ready (status: ${onboarding.status})` },
      { status: 409 }
    )
  }

  // Validate required fields
  const missing: string[] = []
  if (!onboarding.first_name) missing.push('first_name')
  if (!onboarding.last_name) missing.push('last_name')
  if (!onboarding.phone) missing.push('phone')

  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing required fields', missing },
      { status: 422 }
    )
  }

  // Look up the family_member row for the authenticated user
  const { data: familyMember, error: fmError } = await supabase
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', session.user.id)
    .single()

  if (fmError || !familyMember) {
    return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
  }

  try {
    // Create the member row
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        family_member_id: familyMember.id,
        first_name: onboarding.first_name,
        last_name: onboarding.last_name,
        preferred_name: onboarding.preferred_name ?? onboarding.first_name,
        phone: onboarding.phone,
        email: onboarding.email,
        dob: onboarding.dob,
        address: onboarding.address,
        plan_tier: 'basics', // Default tier after voice signup; upgrade via plan selection screen
        onboarding_complete: false, // Still needs plan selection + payment
      })
      .select('id')
      .single()

    if (memberError || !member) {
      throw new Error(memberError?.message ?? 'Failed to create member')
    }

    // Insert emergency contact if captured
    if (onboarding.emergency_contact_name && onboarding.emergency_contact_phone) {
      await supabaseAdmin.from('emergency_contacts').insert({
        member_id: member.id,
        name: onboarding.emergency_contact_name,
        phone: onboarding.emergency_contact_phone,
        relationship: 'emergency_contact',
        is_primary: true,
      })
    }

    // Mark onboarding session as submitted
    await supabaseAdmin
      .from('onboarding_sessions')
      .update({
        status: 'submitted',
        family_member_id: familyMember.id,
      })
      .eq('session_id', session_id)

    return NextResponse.json({
      success: true,
      member_id: member.id,
      redirect: '/welcome', // Browser navigates here after submit
    })
  } catch (err) {
    // Flag the session as failed so browser shows recovery UI
    await supabaseAdmin
      .from('onboarding_sessions')
      .update({ status: 'error', error_type: 'submit_failed' })
      .eq('session_id', session_id)

    console.error('[onboarding/submit] error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
