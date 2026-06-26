// Navigator member-document API — upload and list care documents for a specific member.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'platform-documents'
const MAX_FILE_SIZE = 20 * 1024 * 1024

async function getNavigator(userId: string) {
  const admin = createAdminClient()
  const { data: fm } = await admin
    .from('family_members')
    .select('role, full_name')
    .eq('supabase_auth_id', userId)
    .maybeSingle()
  if (!fm || !['navigator', 'admin'].includes(fm.role ?? '')) return null

  if (fm.role === 'navigator') {
    const { data: nav } = await admin
      .from('care_navigators')
      .select('id')
      .eq('supabase_auth_id', userId)
      .maybeSingle()
    return { ...fm, navigatorId: nav?.id ?? null }
  }
  return { ...fm, navigatorId: null }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nav = await getNavigator(user.id)
  if (!nav) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberId = request.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('platform_documents')
    .select('id, created_at, title, description, file_name, file_type, file_size_bytes, category, visibility, uploaded_by_name, storage_path')
    .eq('member_id', memberId)
    .eq('scope', 'member')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nav = await getNavigator(user.id)
  if (!nav) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const memberId = formData.get('memberId') as string | null
  const category = (formData.get('category') as string | null) ?? 'member_specific'
  const visibility = (formData.get('visibility') as string | null) ?? 'care_team'

  if (!file || !title?.trim() || !memberId) {
    return NextResponse.json({ error: 'file, title, and memberId are required' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large — maximum 20 MB' }, { status: 400 })
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `member/${memberId}/${Date.now()}_${safeFileName}`
  const fileBuffer = await file.arrayBuffer()

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('[api/navigator/documents POST] upload:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Ensure the platform-documents Storage bucket exists.' }, { status: 500 })
  }

  const { data: doc, error: dbError } = await (admin.from as any)('platform_documents').insert({
    member_id: memberId,
    scope: 'member',
    title: title.trim(),
    description: description?.trim() || null,
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
    storage_path: storagePath,
    category,
    visibility,
    uploaded_by_name: (nav as any).full_name || 'Navigator',
  }).select().maybeSingle()

  if (dbError || !doc) {
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
  }

  return NextResponse.json({ data: doc }, { status: 201 })
}
