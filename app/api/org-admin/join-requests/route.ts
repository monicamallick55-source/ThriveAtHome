// app/api/org-admin/join-requests/route.ts
// GET  ?org_id=<id>           → list join requests for org
// POST { request_id, action: 'approve'|'deny', org_id } → decide on request

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')

  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('org_join_requests')
    .select('id, full_name, email, phone, message, requested_at, status')
    .eq('org_id', org_id)
    .order('requested_at', { ascending: false })

  if (error) {
    // Table may not exist yet — return empty list gracefully
    console.error('[join-requests GET]', error.message)
    return NextResponse.json([])
  }

  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  let body: { request_id?: string; action?: 'approve' | 'deny'; org_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { request_id, action, org_id } = body
  if (!request_id || !action || !org_id) {
    return NextResponse.json({ error: 'request_id, action, and org_id required' }, { status: 400 })
  }
  if (!['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or deny' }, { status: 400 })
  }

  // Fetch the join request
  const { data: joinReq, error: fetchErr } = await supabase
    .from('org_join_requests')
    .select('*')
    .eq('id', request_id)
    .eq('org_id', org_id)
    .single()

  if (fetchErr || !joinReq) {
    return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
  }

  if (joinReq.status !== 'pending') {
    return NextResponse.json({ error: 'Request already decided' }, { status: 409 })
  }

  if (action === 'deny') {
    // Mark denied
    const { error: updateErr } = await supabase
      .from('org_join_requests')
      .update({ status: 'denied', decided_at: new Date().toISOString() })
      .eq('id', request_id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Optionally notify user via SendGrid
    const sendgridApiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@thriveathome.app'

    if (sendgridApiKey) {
      // Fetch org name for email
      const { data: org } = await supabase
        .from('b2b_orgs')
        .select('org_name')
        .eq('id', org_id)
        .single()

      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [{ email: joinReq.email, name: joinReq.full_name }],
          from: { email: fromEmail, name: 'ThriveAtHome' },
          subject: 'Update on your ThriveAtHome membership request',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <h2 style="color:#2d6a4f;">Hello, ${joinReq.full_name}</h2>
              <p>Thank you for your interest in joining ThriveAtHome${org?.org_name ? ` through ${org.org_name}` : ''}.</p>
              <p>Unfortunately, we're unable to approve your request at this time.</p>
              <p>If you believe this is an error or have questions, please contact us at
                <a href="mailto:support@thriveathome.app">support@thriveathome.app</a>.</p>
            </div>
          `,
        }),
      }).catch(err => console.error('[join-requests] SendGrid deny email error', err))
    }

    return NextResponse.json({ ok: true, status: 'denied' })
  }

  // action === 'approve': create Supabase auth user + member row
  const { data: org } = await supabase
    .from('b2b_orgs')
    .select('org_name')
    .eq('id', org_id)
    .single()

  const tempPassword = crypto.randomUUID().replace(/-/g, '') + 'Aa1!'
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: joinReq.email,
    password: tempPassword,
    email_confirm: false,
    user_metadata: {
      full_name: joinReq.full_name,
      org_id,
      account_type: 'b2b_member',
    },
  })

  if (authErr) {
    // If user already exists in auth — look them up and link
    if (!authErr.message?.includes('already registered')) {
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }
  }

  const authUserId = authData?.user?.id
  if (authUserId) {
    // Insert member row (ignore conflict — may have been created elsewhere)
    await supabase
      .from('members')
      .insert({
        supabase_auth_id: authUserId,
        full_name: joinReq.full_name,
        email: joinReq.email,
        org_id,
        plan_tier: 'basic',
        status: 'active',
        source: 'join_request',
      })
      
  }

  // Mark approved
  await supabase
    .from('org_join_requests')
    .update({ status: 'approved', decided_at: new Date().toISOString() })
    .eq('id', request_id)

  // Send welcome invite
  const sendgridApiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@thriveathome.app'

  if (sendgridApiKey) {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [{ email: joinReq.email, name: joinReq.full_name }],
        from: { email: fromEmail, name: 'ThriveAtHome' },
        subject: `Welcome to ThriveAtHome${org?.org_name ? ` — invitation from ${org.org_name}` : ''}!`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <h2 style="color:#2d6a4f;">Welcome, ${joinReq.full_name}!</h2>
            <p>Your membership request has been approved.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thrive-at-home-pied.vercel.app'}/signup?email=${encodeURIComponent(joinReq.email)}&org=${encodeURIComponent(org_id)}"
               style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
              Set Up Your Account →
            </a>
            <p style="color:#666;font-size:13px;">Questions? Reply to this email or call 1-800-THRIVE1.</p>
          </div>
        `,
      }),
    }).catch(err => console.error('[join-requests] SendGrid approve email error', err))
  }

  return NextResponse.json({ ok: true, status: 'approved' })
}
