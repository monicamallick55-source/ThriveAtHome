import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'

// POST body: { paths: string[] }
// Returns: { urls: { path, url, original_name }[] }
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

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('life-story-attachments')
    .createSignedUrls(paths, 3600) // 1-hour signed URLs

  if (error) {
    console.error('[signed-urls] Error:', error.message)
    return NextResponse.json({ error: 'Failed to generate signed URLs' }, { status: 500 })
  }

  const urls = (data ?? []).map((item) => {
    const p = item.path ?? ''
    return {
      path: p,
      url: item.signedUrl,
      original_name: p.split('/').pop() ?? p,
      mime: guessMime(p),
    }
  })

  return NextResponse.json({ urls })
}

function guessMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}
