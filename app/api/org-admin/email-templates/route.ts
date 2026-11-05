/**
 * app/api/org-admin/email-templates/route.ts — 16.5 White-Label Email Templates
 *
 * GET  /api/org-admin/email-templates        — list org's custom templates
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: self } = await supabase
      .from('org_admins')
      .select('org_id')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!self) return NextResponse.json({ error: 'Not an org admin' }, { status: 403 })

    const { data, error } = await supabase
      .from('org_email_templates')
      .select('id, type, subject, body_html, from_name, reply_to, updated_at')
      .eq('org_id', self.org_id)
      .order('type')

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ templates: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
