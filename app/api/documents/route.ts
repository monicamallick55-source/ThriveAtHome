// Document vault API — uploads a document to Supabase Storage and records metadata.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addDocument, getDocumentsForMember } from '@/lib/data/documents'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const BUCKET = 'member-documents'

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Validate params
  const { searchParams } = request.nextUrl
  const memberId = searchParams.get('memberId')
  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
  }

  // 3. Authorise
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', memberId)
    .maybeSingle()

  if (fmError) {
    console.error('[api/documents GET] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Fetch
  const { data: docs, error: docsError } = await getDocumentsForMember(memberId)
  if (docsError) {
    return NextResponse.json({ error: docsError }, { status: 500 })
  }

  return NextResponse.json({ documents: docs ?? [] })
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse multipart form
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const memberId = formData.get('memberId') as string | null
  const description = formData.get('description') as string | null
  const isAdvanceDirective = formData.get('isAdvanceDirective') === 'true'

  if (!file || !memberId) {
    return NextResponse.json({ error: 'file and memberId are required' }, { status: 400 })
  }

  // 3. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File is too large. Maximum size is 10 MB.' },
      { status: 400 }
    )
  }

  // 4. Authorise: confirm this user is linked to the requested member
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .eq('member_id', memberId)
    .maybeSingle()

  if (fmError) {
    console.error('[api/documents POST] family_members check:', fmError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  if (!fm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 5. Upload to Supabase Storage — path: memberId/timestamp_filename
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${memberId}/${Date.now()}_${safeFileName}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('[api/documents POST] storage upload:', uploadError)
    return NextResponse.json({ error: 'File upload failed. Please try again.' }, { status: 500 })
  }

  // 6. Record metadata in database
  const { data: doc, error: docError } = await addDocument({
    memberId,
    uploadedBy: fm.id,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    description: description || null,
    storagePath,
    isAdvanceDirective,
  })

  if (docError || !doc) {
    // Attempt to clean up the uploaded file if DB insert fails
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: docError ?? 'Failed to record document' }, { status: 500 })
  }

  return NextResponse.json({ document: doc }, { status: 201 })
}
