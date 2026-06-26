import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface TemplateRow {
  id: string
  created_at: string
  org_id: string | null
  name: string
  subject: string
  body: string
  is_factory: boolean
  last_used_at: string | null
}

async function getOrgAdminContext(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, org_id, full_name').eq('supabase_auth_id', userId).maybeSingle()
  if (!fm || (fm.role !== 'org_admin' && fm.role !== 'admin')) return null
  return fm as { role: string; org_id: string | null; full_name: string }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdminContext(user.id)
  if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Get factory templates + org-specific templates
  const factoryRes = await (admin.from as any)('org_email_templates')
    .select('id, created_at, org_id, name, subject, body, is_factory, last_used_at')
    .is('org_id', null)
    .eq('is_factory', true)
    .order('name', { ascending: true }) as { data: TemplateRow[] | null }

  let orgTemplates: TemplateRow[] = []
  if (fm.org_id) {
    const orgRes = await (admin.from as any)('org_email_templates')
      .select('id, created_at, org_id, name, subject, body, is_factory, last_used_at')
      .eq('org_id', fm.org_id)
      .eq('is_factory', false)
      .order('name', { ascending: true }) as { data: TemplateRow[] | null }
    orgTemplates = orgRes.data ?? []
  }

  return NextResponse.json({
    factoryTemplates: factoryRes.data ?? [],
    orgTemplates,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdminContext(user.id)
  if (!fm || !fm.org_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.name?.trim() || !body?.subject?.trim() || !body?.body?.trim()) {
    return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_email_templates').insert({
    org_id: fm.org_id,
    name: String(body.name).trim().slice(0, 100),
    subject: String(body.subject).trim().slice(0, 200),
    body: String(body.body).trim().slice(0, 10000),
    is_factory: false,
  }).select().single() as { data: TemplateRow | null; error: { message: string } | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdminContext(user.id)
  if (!fm || !fm.org_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const templateId = searchParams.get('id')
  if (!templateId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  // Only allow deleting own org templates (not factory)
  const { error } = await (admin.from as any)('org_email_templates')
    .delete()
    .eq('id', templateId)
    .eq('org_id', fm.org_id)
    .eq('is_factory', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
