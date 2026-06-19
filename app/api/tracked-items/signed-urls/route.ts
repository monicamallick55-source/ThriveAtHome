import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'tracked-item-attachments'

// POST body: { paths: string[] }
// Returns: { urls: { path, url, original_name, mime }[] }
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  let body: { paths?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { paths } = body
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ urls: [] })
  }

  // Security: all paths must start with this member's ID
  const unauthorized = paths.filter(p => !p.startsWith(fm.member_id + '/'))
  if (unauthorized.length > 0) {
    return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600)

  if (error) {
    console.error('[tracked-items/signed-urls] Error:', error.message)
    return NextResponse.json({ error: 'Failed to generate signed URLs' }, { status: 500 })
  }

  const urls = (data ?? []).map(item => {
    const p = item.path ?? ''
    const ext = p.split('.').pop()?.toLowerCase() ?? ''
    const mime = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    return { path: p, url: item.signedUrl, original_name: p.split('/').pop() ?? p, mime }
  })

  return NextResponse.json({ urls })
}
