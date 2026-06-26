// Member document download — generates signed URL for accessible document
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'platform-documents'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('member_id, org_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm?.member_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: doc } = await (admin.from as any)('platform_documents')
    .select('storage_path, file_name, org_id, member_id, visibility, scope')
    .eq('id', id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check access: org-shared or member-specific
  const canAccess =
    (doc.scope === 'org' && doc.org_id === fm.org_id && doc.visibility === 'members') ||
    (doc.scope === 'member' && doc.member_id === fm.member_id && ['members', 'care_team'].includes(doc.visibility))

  if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 300)

  if (error || !signed) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, fileName: doc.file_name })
}
