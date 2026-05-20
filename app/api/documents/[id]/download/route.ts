// Document download API — generates a short-lived signed URL for a document in Supabase Storage.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'member-documents'
const SIGNED_URL_EXPIRY_SECONDS = 60 // 60-second window — generated at click time

export async function GET(
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

  // 2. Fetch the document record to get storage_path and member_id
  const admin = createAdminClient()
  const { data: doc, error: docError } = await admin
    .from('document_vault_items')
    .select('id, member_id, storage_path, file_name')
    .eq('id', documentId)
    .maybeSingle()

  if (docError) {
    console.error('[api/documents/download] fetch doc:', docError)
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
    console.error('[api/documents/download] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Generate signed URL — expires in 60 seconds
  const { data: signedData, error: signedError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY_SECONDS)

  if (signedError || !signedData?.signedUrl) {
    console.error('[api/documents/download] createSignedUrl:', signedError)
    return NextResponse.json({ error: 'Unable to generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signedData.signedUrl, fileName: doc.file_name })
}
