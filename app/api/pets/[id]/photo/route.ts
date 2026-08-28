// M27 Phase 117 — attach a photo to a pet profile (private "member-pet-photos" bucket).
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { attachPetPhoto } from '@/lib/data/pets'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'])
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const BUCKET = 'member-pet-photos'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Please upload a photo (JPEG, PNG, or WEBP).' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Photo must be 10 MB or less.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row } = await admin.from('member_pets').select('id, member_id').eq('id', id).maybeSingle()
  if (!row || row.member_id !== fm.member_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${fm.member_id}/${id}/${safeName}`
  const buffer = await file.arrayBuffer()
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (uploadErr) {
    console.error('[pets/photo] Storage error:', uploadErr.message)
    return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 500 })
  }

  const { error } = await attachPetPhoto(id, fm.member_id, storagePath)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ path: storagePath }, { status: 201 })
}
