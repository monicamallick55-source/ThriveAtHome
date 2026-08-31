// Onboarding API — creates member row and links it to the signed-in family_members row.
// Auth is required. Duplicate submissions are rejected (member_id already set).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface OnboardingBody {
  full_name?: string
  preferred_name?: string
  date_of_birth?: string
  phone_number?: string
  emergency_contact_1_name?: string
  emergency_contact_1_phone?: string
  emergency_contact_1_rel?: string
  address?: string
  lives_alone?: boolean | null
  health_conditions?: string
  medications?: string
  preferred_language?: string
  preferred_call_time?: string
  aria_call_opt_in?: '' | 'daily' | 'less_often' | 'no'
  check_in_frequency?: 'daily' | 'every_other_day' | 'weekly'
  topics_enjoy?: string
  topics_avoid?: string
  doctor_name?: string
  doctor_phone?: string
  buddy_match_topics?: string
  buddy_match_era?: string
  buddy_call_length_preference?: string
  buddy_intro_note?: string
  grief_welcome_path?: string
  grief_loss_type?: string
}

export async function POST(req: NextRequest) {
  // 1. Verify authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to complete onboarding.' }, { status: 401 })
  }

  // 2. Parse body
  let body: OnboardingBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // 3. Validate required fields
  const { full_name, preferred_name, date_of_birth, phone_number } = body
  if (!full_name?.trim() || !preferred_name?.trim() || !date_of_birth?.trim() || !phone_number?.trim()) {
    return NextResponse.json(
      { error: 'Full name, preferred name, date of birth, and phone number are required.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // 4. Check for duplicate submission
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('id, member_id, relationship')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (fmError) {
    console.error('[api/onboarding] family_members lookup failed:', fmError)
    return NextResponse.json({ error: 'Unable to complete onboarding. Please try again.' }, { status: 500 })
  }

  if (!fm) {
    return NextResponse.json({ error: 'Account not found. Please sign up again.' }, { status: 404 })
  }

  if (fm.member_id) {
    return NextResponse.json({ error: 'Profile already created. Visit your dashboard.' }, { status: 409 })
  }

  // A senior who signed up for themselves (family_members.relationship === 'self')
  // is linked directly to the members row too, so they can log in as the member
  // and land on the member self-service portal.
  const isSelfEnrolment = fm.relationship === 'self'

  // 5. Insert member row (plan_tier defaults to 'basics' in the database)
  const topicsEnjoyArray = body.topics_enjoy
    ? body.topics_enjoy.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const buddyMatchTopicsArray = body.buddy_match_topics
    ? body.buddy_match_topics.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  // Aria's daily calls are opt-in. Only 'daily' or 'less_often' turn them on.
  const ariaOptedIn = body.aria_call_opt_in === 'daily' || body.aria_call_opt_in === 'less_often'
  const ariaFrequency: 'daily' | 'every_other_day' | 'weekly' =
    body.aria_call_opt_in === 'daily'
      ? 'daily'
      : body.grief_welcome_path === 'true'
        ? 'daily'
        : (body.check_in_frequency || 'daily')

  const { data: member, error: memberError } = await (admin.from as any)('members')
    .insert({
      full_name: full_name.trim(),
      preferred_name: preferred_name.trim(),
      date_of_birth,
      phone_number: phone_number.trim(),
      supabase_auth_id: isSelfEnrolment ? user.id : null,
      emergency_contact_1_name: body.emergency_contact_1_name?.trim() || null,
      emergency_contact_1_phone: body.emergency_contact_1_phone?.trim() || null,
      emergency_contact_1_rel: body.emergency_contact_1_rel?.trim() || null,
      address: body.address?.trim() || null,
      lives_alone: body.lives_alone ?? null,
      health_conditions: body.health_conditions?.trim() || null,
      medications: body.medications?.trim() || null,
      preferred_language: body.preferred_language?.trim() || 'english',
      preferred_call_time: body.preferred_call_time?.trim() || null,
      aria_call_opted_in: ariaOptedIn,
      check_in_frequency: ariaFrequency,
      topics_enjoy: topicsEnjoyArray,
      topics_avoid: body.topics_avoid?.trim() || null,
      doctor_name: body.doctor_name?.trim() || null,
      doctor_phone: body.doctor_phone?.trim() || null,
      buddy_match_topics: buddyMatchTopicsArray,
      buddy_match_era: body.buddy_match_era?.trim() || null,
      buddy_call_length_preference: body.buddy_call_length_preference?.trim() || null,
      buddy_intro_note: body.buddy_intro_note?.trim() || null,
      grief_welcome_path: body.grief_welcome_path === 'true',
      grief_enrolled_at: body.grief_welcome_path === 'true' ? new Date().toISOString() : null,
      grief_loss_type: body.grief_welcome_path === 'true' ? (body.grief_loss_type?.trim() || null) : null,
      plan_tier: 'basics',
      status: 'active',
    })
    .select('id, preferred_name')
    .maybeSingle()

  if (memberError || !member) {
    console.error('[api/onboarding] members insert failed:', memberError)
    return NextResponse.json({ error: 'Could not save profile. Please try again.' }, { status: 500 })
  }

  // 6. Link family_members.member_id to the new member
  const { error: linkError } = await admin
    .from('family_members')
    .update({ member_id: member.id })
    .eq('id', fm.id)

  if (linkError) {
    console.error('[api/onboarding] member_id link failed:', linkError)
    return NextResponse.json(
      { error: 'Profile saved but linking failed. Contact support.' },
      { status: 500 }
    )
  }

  // 7. Agency-branded welcome email stub — if registering family member is linked to an agency
  const { data: fmWithAgency } = await admin
    .from('family_members')
    .select('agency_id')
    .eq('id', fm.id)
    .maybeSingle()

  if (fmWithAgency?.agency_id) {
    const { data: brandCfg } = await (admin as any)
      .from('brand_configs')
      .select('agency_display_name, primary_color')
      .eq('agency_id', fmWithAgency.agency_id)
      .maybeSingle() as { data: { agency_display_name?: string; primary_color?: string } | null }
    const agencyName = brandCfg?.agency_display_name ?? 'your agency'
    console.log(`[STUB][Email] Agency-branded welcome sent to ${member.preferred_name}: "Welcome from ${agencyName}, Powered by ThriveAtHome."`)
  }

  // 8. Grief Welcome Path — create navigator tasks + stub notifications
  if (body.grief_welcome_path === 'true') {
    const slaDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const week1Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const lossType = body.grief_loss_type?.trim()
    const lossSuffix = lossType ? ` (loss: ${lossType})` : ''
    const { error: griefTaskError } = await (admin as any).from('navigator_tasks').insert([
      {
        member_id: member.id,
        task_type: 'buddy_assignment',
        description: `GRIEF PATH — compassionate buddy assignment needed within 48 hours for ${member.preferred_name}${lossSuffix}`,
        priority: 'critical',
        due_by: slaDate,
      },
      {
        member_id: member.id,
        task_type: 'follow_up',
        description: `Week 1 touchpoint — call ${member.preferred_name} (grief welcome path member)${lossSuffix}`,
        priority: 'high',
        due_by: week1Date,
      },
    ])
    if (griefTaskError) {
      console.error('[api/onboarding] grief navigator_tasks insert failed:', griefTaskError)
    }
    // Stub: grief circle invitation email
    console.log(`[STUB][Email] Grief circle invitation sent to ${member.preferred_name}: "We have a Grief Support Circle that meets weekly — we'd love to invite you."`)
    console.log(`[STUB][Navigator] GRIEF PATH member enrolled: ${member.preferred_name} (${member.id})${lossSuffix} — buddy assignment SLA: 48 hours`)
  }

  return NextResponse.json({ success: true, preferred_name: member.preferred_name })
}
