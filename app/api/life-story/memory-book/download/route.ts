import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createAdminClient } from '@/lib/supabase/admin'

// POST {storagePath} — returns a fresh 1-hour signed URL for a Memory Book PDF
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  let body: { storagePath?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.storagePath) {
    return NextResponse.json({ error: 'storagePath required' }, { status: 400 })
  }

  // Validate path prefix belongs to this member (security check)
  if (!body.storagePath.startsWith(`${memberId}/`)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('memory-books')
    .createSignedUrl(body.storagePath, 3600)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create download URL' }, { status: 500 })
  }

  return NextResponse.json({ downloadUrl: data.signedUrl })
}
