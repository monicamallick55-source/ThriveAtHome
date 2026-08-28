// M26 Phase 109 — Attach a short video file to a caregiver video diary entry.
// Video is stored in the private "caregiver-video-diary" Storage bucket.
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { attachVideoDiaryVideo, hasActiveAddon } from '@/lib/data/premium-addons'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set([
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp',
])
const MAX_SIZE = 100 * 1024 * 1024 // 100 MB
const BUCKET = 'caregiver-video-diary'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })
  if (!(await hasActiveAddon(fm.member_id, 'long_distance_caregiver'))) {
    return NextResponse.json({ error: 'The Long-Distance Caregiver add-on is required.' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const entryId = formData.get('entry_id')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (!entryId || typeof entryId !== 'string') {
    return NextResponse.json({ error: 'entry_id is required' }, { status: 400 })
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Please upload a video file (mp4, mov, or webm).' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Video must be 100 MB or less.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('caregiver_video_diary_entries')
    .select('id, member_id')
    .eq('id', entryId)
    .maybeSingle()
  if (!row || row.member_id !== fm.member_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${fm.member_id}/${entryId}/${safeName}`

  const buffer = await file.arrayBuffer()
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (uploadErr) {
    console.error('[addons/video-diary/upload] Storage error:', uploadErr.message)
    return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 500 })
  }

  const { error } = await attachVideoDiaryVideo(entryId, fm.member_id, storagePath)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ path: storagePath }, { status: 201 })
}
