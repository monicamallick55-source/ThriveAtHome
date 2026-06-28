// Member self-upload API — allows a directly-authenticated member (or a family member)
// to upload a personal document to the platform-documents bucket.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'platform-documents'
const MAX_FILE_SIZE = 20 * 1024 * 1024

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const memberId = formData.get('memberId') as string | null

  if (!file || !title?.trim() || !memberId) {
    return NextResponse.json({ error: 'file, title, and memberId are required' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large — maximum 20 MB' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the user is linked to this member (direct member auth or family member)
  const [directCheck, familyCheck] = await Promise.all([
    (admin.from as any)('members').select('id').eq('id', memberId).eq('supabase_auth_id', user.id).maybeSingle(),
    admin.from('family_members').select('member_id').eq('supabase_auth_id', user.id).eq('member_id', memberId).maybeSingle(),
  ])

  if (!directCheck.data && !familyCheck.data) {
    return NextResponse.json({ error: 'Forbidden — you are not linked to this member' }, { status: 403 })
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `member/${memberId}/${Date.now()}_${safeFileName}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('[api/member/upload-document POST] upload:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Ensure the platform-documents Storage bucket exists.' }, { status: 500 })
  }

  const { data: doc, error: dbError } = await (admin.from as any)('platform_documents').insert({
    member_id: memberId,
    scope: 'member',
    title: title.trim(),
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
    storage_path: storagePath,
    category: 'member_specific',
    visibility: 'members',
    uploaded_by_name: 'Member',
  }).select().maybeSingle()

  if (dbError || !doc) {
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
  }

  return NextResponse.json({ data: doc }, { status: 201 })
}
