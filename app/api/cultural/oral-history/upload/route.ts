// M25 Phase 107 — Attach an audio file to an existing oral history recording.
// Audio is stored in the private "oral-history" Storage bucket.
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createAdminClient } from '@/lib/supabase/admin'
import { attachOralHistoryAudio } from '@/lib/data/cultural'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/aac',
])
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
const BUCKET = 'oral-history'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const recordingId = formData.get('recording_id')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (!recordingId || typeof recordingId !== 'string') return NextResponse.json({ error: 'recording_id is required' }, { status: 400 })
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Please upload an audio file (mp3, m4a, wav, ogg, or webm).' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Audio file must be 50 MB or less.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: rec } = await admin
    .from('oral_history_recordings')
    .select('id, member_id')
    .eq('id', recordingId)
    .maybeSingle()
  if (!rec || rec.member_id !== memberId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'audio'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${memberId}/${recordingId}/${safeName}`

  const buffer = await file.arrayBuffer()
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (uploadErr) {
    console.error('[cultural/oral-history/upload] Storage error:', uploadErr.message)
    return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 500 })
  }

  const { error } = await attachOralHistoryAudio(recordingId, memberId, storagePath)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ path: storagePath }, { status: 201 })
}
