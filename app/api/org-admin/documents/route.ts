// Org document library API — list and upload documents for a community org.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'platform-documents'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

async function getOrgAdmin(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, org_id, full_name')
    .eq('supabase_auth_id', userId)
    .maybeSingle()
  return fm
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdmin(user.id)
  if (!fm || !['org_admin', 'admin'].includes(fm.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ data: [] })

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('platform_documents')
    .select('id, created_at, title, description, file_name, file_type, file_size_bytes, category, visibility, uploaded_by_name, scope, storage_path')
    .eq('org_id', fm.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/org-admin/documents GET]', error)
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fm = await getOrgAdmin(user.id)
  if (!fm || !['org_admin', 'admin'].includes(fm.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!fm.org_id) return NextResponse.json({ error: 'No org linked' }, { status: 400 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const category = (formData.get('category') as string | null) ?? 'general'
  const visibility = (formData.get('visibility') as string | null) ?? 'admins_only'

  if (!file || !title?.trim()) {
    return NextResponse.json({ error: 'file and title are required' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large — maximum 20 MB' }, { status: 400 })
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `org/${fm.org_id}/${Date.now()}_${safeFileName}`
  const fileBuffer = await file.arrayBuffer()

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('[api/org-admin/documents POST] upload:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Ensure the platform-documents Storage bucket exists.' }, { status: 500 })
  }

  const { data: doc, error: dbError } = await (admin.from as any)('platform_documents').insert({
    org_id: fm.org_id,
    scope: 'org',
    title: title.trim(),
    description: description?.trim() || null,
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
    storage_path: storagePath,
    category,
    visibility,
    uploaded_by_name: fm.full_name || 'Admin',
  }).select().maybeSingle()

  if (dbError || !doc) {
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
  }

  return NextResponse.json({ data: doc }, { status: 201 })
}
