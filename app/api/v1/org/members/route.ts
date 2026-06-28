import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const admin = createAdminClient()

  // Authenticate via Authorization header: "Bearer org_..."
  const authHeader = req.headers.get('Authorization') || ''
  const apiKey = authHeader.replace('Bearer ', '').trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
  }

  // Look up the org by API key
  const { data: org } = await (admin as any)
    .from('community_orgs')
    .select('id, org_name, hv_sync_enabled, helpful_village_org_id, mon_ami_integration')
    .eq('org_api_key', apiKey)
    .maybeSingle() as { data: { id: string; org_name: string; hv_sync_enabled: boolean; helpful_village_org_id: string | null; mon_ami_integration: boolean } | null }

  if (!org) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    full_name,
    email,
    phone,
    date_of_birth,
    address,
    city,
    state,
    preferred_language,
    source,
    external_member_id,
  } = body as {
    full_name?: string
    email?: string
    phone?: string
    date_of_birth?: string
    address?: string
    city?: string
    state?: string
    preferred_language?: string
    source?: string
    external_member_id?: string
  }

  if (!full_name) {
    return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
  }

  // Mon Ami stub
  if (source === 'mon_ami') {
    console.log(`[STUB][MonAmi] Would sync member from Mon Ami org: ${full_name} (org: ${org.org_name})`)
  }

  // Upsert member — match by email if provided, else always create
  let memberId: string | null = null

  if (email) {
    const { data: existing } = await (admin as any)
      .from('members')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      memberId = existing.id
      await (admin as any)
        .from('members')
        .update({
          full_name,
          phone_number: phone ?? undefined,
          date_of_birth: date_of_birth ?? undefined,
          address: address ?? undefined,
          city: city ?? undefined,
          state: state ?? undefined,
          preferred_language: preferred_language ?? undefined,
        })
        .eq('id', memberId)
    }
  }

  if (!memberId) {
    const { data: created, error: createErr } = await (admin as any)
      .from('members')
      .insert({
        full_name,
        preferred_name: full_name.split(' ')[0],
        email: email ?? null,
        phone_number: phone ?? null,
        date_of_birth: date_of_birth ?? null,
        address: address ?? null,
        city: city ?? null,
        state: state ?? null,
        preferred_language: preferred_language ?? 'english',
        plan_tier: 'basics',
        check_in_frequency: 'daily',
      })
      .select('id')
      .single()

    if (createErr || !created) {
      return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
    }
    memberId = created.id
  }

  // Link member to org via org_memberships (upsert)
  await (admin as any)
    .from('org_memberships')
    .upsert(
      {
        org_id: org.id,
        member_id: memberId,
        membership_tier: 'standard',
        dues_paid: false,
        joined_at: new Date().toISOString(),
        external_id: external_member_id ?? null,
        source: source ?? 'api',
      },
      { onConflict: 'org_id,member_id', ignoreDuplicates: true }
    )

  // Stub co-branded welcome email
  console.log(
    `[STUB][Email] Would send co-branded welcome email to ${full_name} (${email ?? 'no email'}): ` +
    `"Welcome from ${org.org_name}, Powered by ThriveAtHome"`
  )

  return NextResponse.json({ success: true, member_id: memberId })
}
