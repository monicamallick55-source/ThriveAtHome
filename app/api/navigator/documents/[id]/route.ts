// Navigator document delete and signed-URL API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'platform-documents'

async function getNavigator(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', userId)
    .maybeSingle()
  return fm && ['navigator', 'admin'].includes(fm.role ?? '') ? fm : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nav = await getNavigator(user.id)
  if (!nav) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: doc } = await (admin.from as any)('platform_documents')
    .select('storage_path, file_name')
    .eq('id', id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 300)

  if (error || !signed) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, fileName: doc.file_name })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nav = await getNavigator(user.id)
  if (!nav) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: doc } = await (admin.from as any)('platform_documents')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error: dbError } = await (admin.from as any)('platform_documents').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  await admin.storage.from(BUCKET).remove([doc.storage_path])
  return NextResponse.json({ ok: true })
}
