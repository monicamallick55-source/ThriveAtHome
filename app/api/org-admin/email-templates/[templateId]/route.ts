/**
 * app/api/org-admin/email-templates/[templateId]/route.ts
 *
 * PATCH /api/org-admin/email-templates/[templateId] — save/update a template
 *       templateId can be an existing UUID or a template type key (upsert)
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = ['welcome', 'invitation', 'weekly_check_in', 'care_alert', 'gift_received', 'celebration']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id, role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })
    if (self.role === 'viewer') return NextResponse.json({ error: 'Viewers cannot edit templates' }, { status: 403 })

    const body = await req.json()
    const { subject, body_html, from_name, reply_to } = body

    if (!subject || !body_html) {
      return NextResponse.json({ error: 'subject and body_html are required' }, { status: 400 })
    }

    // templateId might be a type key (e.g. 'welcome') for first-time creation
    const isTypeKey = VALID_TYPES.includes(templateId)

    if (isTypeKey) {
      // Upsert by org_id + type
      const { data, error } = await supabase
        .from('org_email_templates')
        .upsert({
          org_id: self.org_id,
          type: templateId,
          subject,
          body_html,
          from_name: from_name ?? null,
          reply_to: reply_to ?? null,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        }, { onConflict: 'org_id,type' })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ template: data })
    }

    // Existing UUID — verify it belongs to this org
    const { data, error } = await supabase
      .from('org_email_templates')
      .update({
        subject, body_html,
        from_name: from_name ?? null,
        reply_to: reply_to ?? null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', templateId)
      .eq('org_id', self.org_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ template: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
