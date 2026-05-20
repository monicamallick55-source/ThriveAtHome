// Document delete API — removes document from storage and database.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteDocument } from '@/lib/data/documents'

const BUCKET = 'member-documents'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: documentId } = await params

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
  }

  // 2. Fetch the document to get member_id for authorization
  const admin = createAdminClient()
  const { data: doc, error: docError } = await admin
    .from('document_vault_items')
    .select('id, member_id, storage_path')
    .eq('id', documentId)
    .maybeSingle()

  if (docError) {
    console.error('[api/documents/delete] fetch doc:', docError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // 3. Authorise: confirm this user is linked to the document's member
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', doc.member_id)
    .maybeSingle()

  if (fmError) {
    console.error('[api/documents/delete] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Delete DB record (also returns storage_path for cleanup)
  const { storagePath, error: deleteError } = await deleteDocument(documentId, doc.member_id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError }, { status: 500 })
  }

  // 5. Remove from storage — best effort (DB record already deleted)
  if (storagePath) {
    const { error: storageError } = await admin.storage.from(BUCKET).remove([storagePath])
    if (storageError) {
      console.error('[api/documents/delete] storage remove (non-fatal):', storageError)
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
