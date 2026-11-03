// app/api/b2b-signup/route.ts
// B2B organization signup — creates org record + admin Supabase account
// Called from /for-organizations/signup wizard at step 5 (Review)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    // Org details (step 1)
    org_name,
    org_type,        // 'senior_living' | 'home_care' | 'healthcare' | 'employer' | 'other'
    org_size,        // estimated member count
    website,
    // Admin contact (step 2)
    admin_first_name,
    admin_last_name,
    admin_email,
    admin_phone,
    admin_title,
    // Password for admin account
    password,
    // Plan selection (step 4)
    plan,            // 'basics' | 'complete'
    member_count,    // initial seat count
  } = body as {
    org_name?: string
    org_type?: string
    org_size?: string
    website?: string
    admin_first_name?: string
    admin_last_name?: string
    admin_email?: string
    admin_phone?: string
    admin_title?: string
    password?: string
    plan?: string
    member_count?: number
  }

  // Validate required fields
  const missing = ['org_name', 'admin_first_name', 'admin_last_name', 'admin_email', 'password', 'plan'].filter(
    f => !body[f]
  )
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
  }

  if (!['basics', 'complete'].includes(plan!)) {
    return NextResponse.json({ error: 'Plan must be basics or complete' }, { status: 400 })
  }

  const db = supabaseAdmin as any

  try {
    // 1. Create organization record
    const { data: org, error: orgError } = await db
      .from('organizations')
      .insert({
        name: org_name,
        org_type: org_type || 'other',
        org_size: org_size,
        website: website || null,
        plan,
        status: 'pending_payment',
        created_at: new Date().toISOString(),
      })
      .select('id, name')
      .single()

    if (orgError) {
      console.error('[b2b-signup] Organization insert error:', orgError)
      // Check for duplicate org name
      if (orgError.code === '23505') {
        return NextResponse.json({ error: 'An organization with this name already exists. Contact support if this is unexpected.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create organization record' }, { status: 500 })
    }

    // 2. Create Supabase Auth admin account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email!,
      password: password!,
      email_confirm: true,  // Skip email verification for B2B (they're vetted)
      user_metadata: {
        first_name: admin_first_name,
        last_name: admin_last_name,
        phone: admin_phone,
        title: admin_title,
        org_id: org.id,
        role: 'org_admin',
        account_type: 'b2b',
      },
    })

    if (authError) {
      console.error('[b2b-signup] Auth user creation error:', authError)

      // Roll back org creation if auth fails
      await db.from('organizations').delete().eq('id', org.id)

      if (authError.message?.includes('already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 })
    }

    // 3. Create org_members record linking admin to org
    await db.from('org_members').insert({
      org_id: org.id,
      auth_id: authData.user.id,
      email: admin_email,
      first_name: admin_first_name,
      last_name: admin_last_name,
      phone: admin_phone || null,
      title: admin_title || null,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    })

    // 4. Seed b2b_platform_config with defaults
    await db.from('b2b_platform_config').insert({
      org_id: org.id,
      plan,
      seat_limit: member_count || 25,
      aria_calls_enabled: true,
      family_portal_enabled: true,
      sms_enabled: true,
      weekly_reports_enabled: true,
      created_at: new Date().toISOString(),
    })

    // 5. Notify internal team (fire and forget)
    const internalNotifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/notify`
    fetch(internalNotifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.CRON_SECRET || '' },
      body: JSON.stringify({
        type: 'b2b_signup',
        message: `New B2B signup: ${org_name} (${plan} plan, ~${member_count || 'TBD'} members). Admin: ${admin_first_name} ${admin_last_name} <${admin_email}>`,
        priority: 'high',
      }),
    }).catch(err => console.error('[b2b-signup] Internal notify failed:', err))

    console.log(`[b2b-signup] Created org ${org.id} (${org_name}) with admin ${authData.user.id}`)

    return NextResponse.json({
      success: true,
      org_id: org.id,
      org_name: org.name,
      admin_user_id: authData.user.id,
      plan,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[b2b-signup] Unexpected error:', message)
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 })
  }
}
