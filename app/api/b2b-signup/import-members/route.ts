// app/api/b2b-signup/import-members/route.ts
// CSV member import for B2B org admins
// Called from /org-admin CSV import panel
// Body: { org_id: string, members: Array<{ name: string, email: string }> }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let body: { org_id?: string; members?: Array<{ name: string; email: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { org_id, members } = body

  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: 'members array required' }, { status: 400 })
  }
  if (members.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 members per import batch' }, { status: 400 })
  }

  // Validate org exists
  const { data: org, error: orgError } = await supabase
    .from('b2b_orgs')
    .select('id, org_name, billing_tier')
    .eq('id', org_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
  }

  // Normalise and deduplicate the incoming list
  const normalised = members
    .filter(m => m.name?.trim() && m.email?.trim())
    .map(m => ({ name: m.name.trim(), email: m.email.trim().toLowerCase() }))

  if (normalised.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: ['No valid rows in CSV'] })
  }

  const emails = normalised.map(m => m.email)

  // Find existing members (already in this org) to skip
  const { data: existing } = await supabase
    .from('members')
    .select('email')
    .eq('org_id', org_id)
    .in('email', emails)

  const existingEmails = new Set((existing || []).map((m: { email: string }) => m.email))

  const toCreate = normalised.filter(m => !existingEmails.has(m.email))
  const skipped = normalised.length - toCreate.length

  if (toCreate.length === 0) {
    return NextResponse.json({ imported: 0, skipped, message: 'All members already exist in this organisation' })
  }

  // Create Supabase Auth accounts and member rows in batches of 50
  let imported = 0
  const importErrors: string[] = []

  for (const member of toCreate) {
    try {
      // Create auth account with a random temp password (they'll set their own via invite email)
      const tempPassword = crypto.randomUUID().replace(/-/g, '') + 'Aa1!'
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: member.email,
        password: tempPassword,
        email_confirm: false, // Send confirmation/invite email
        user_metadata: {
          full_name: member.name,
          org_id,
          account_type: 'b2b_member',
        },
      })

      if (authError) {
        // May already be a Supabase auth user from another org — skip
        if (authError.message?.includes('already registered')) {
          importErrors.push(`${member.email}: already a platform user`)
          continue
        }
        throw authError
      }

      // Create members row
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          supabase_auth_id: authData.user.id,
          full_name: member.name,
          email: member.email,
          org_id,
          plan_tier: 'basic',
          status: 'active',
          source: 'b2b_csv_import',
        })

      if (memberError) {
        // If member row already exists (race condition), count as skipped
        if (memberError.code === '23505') {
          continue
        }
        throw memberError
      }

      // Send invite email via SendGrid
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
            to: [{ email: member.email, name: member.name }],
            from: { email: fromEmail, name: 'ThriveAtHome' },
            subject: `You've been invited to ThriveAtHome by ${org.org_name}`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
                <h2 style="color:#2d6a4f;">Welcome to ThriveAtHome, ${member.name}!</h2>
                <p>${org.org_name} has set up a ThriveAtHome membership for you.</p>
                <p>ThriveAtHome is a senior independence platform that provides daily check-in calls,
                   navigator support, community connections, and more.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thrive-at-home-pied.vercel.app'}/signup?email=${encodeURIComponent(member.email)}&org=${encodeURIComponent(org_id)}"
                   style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
                  Set Up Your Account →
                </a>
                <p style="color:#666;font-size:13px;">Questions? Reply to this email or call 1-800-THRIVE1.</p>
              </div>
            `,
          }),
        }).catch(err => console.error('[import-members] SendGrid error for', member.email, err))
      }

      imported++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[import-members] Error for', member.email, msg)
      importErrors.push(`${member.email}: ${msg}`)
    }
  }

  console.log(`[import-members] org=${org_id} imported=${imported} skipped=${skipped} errors=${importErrors.length}`)

  return NextResponse.json({
    imported,
    skipped: skipped + importErrors.length,
    errors: importErrors.length > 0 ? importErrors.slice(0, 10) : undefined,
    message: `${imported} member${imported !== 1 ? 's' : ''} imported successfully`,
  })
}
