// Org document delete and signed-URL API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'platform-documents'

async function getOrgAdmin(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, org_id')
    .eq('supabase_auth_id', userId)
    .maybeSingle()
  return fm
}

// GET /api/org-admin/documents/[id] — returns signed download URL
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdmin(user.id)
  if (!fm || !['org_admin', 'admin'].includes(fm.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: doc } = await (admin.from as any)('platform_documents')
    .select('storage_path, org_id, file_name')
    .eq('id', id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  if (fm.role !== 'admin' && doc.org_id !== fm.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 300) // 5 min expiry

  if (error || !signed) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, fileName: doc.file_name })
}

// DELETE /api/org-admin/documents/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdmin(user.id)
  if (!fm || !['org_admin', 'admin'].includes(fm.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: doc } = await (admin.from as any)('platform_documents')
    .select('storage_path, org_id')
    .eq('id', id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (fm.role !== 'admin' && doc.org_id !== fm.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: dbError } = await (admin.from as any)('platform_documents').delete().eq('id', id)
  if (dbError) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  // Best-effort storage cleanup
  await admin.storage.from(BUCKET).remove([doc.storage_path])

  return NextResponse.json({ ok: true })
}
