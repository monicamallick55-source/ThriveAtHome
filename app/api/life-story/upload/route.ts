import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const entryId = formData.get('entry_id')

  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (!entryId || typeof entryId !== 'string') return NextResponse.json({ error: 'entry_id is required' }, { status: 400 })

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and PDF files are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size must be 10 MB or less' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${fm.member_id}/${entryId}/${safeName}`

  const buffer = await file.arrayBuffer()
  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from('life-story-attachments')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[life-story/upload] Storage error:', error.message)
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ path: storagePath, original_name: file.name, mime: file.type }, { status: 201 })
}
