import { NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { updateGriefRequestStatus } from '@/lib/data/grief'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'navigator' && role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { status, navigatorNotes } = body as { status: string; navigatorNotes?: string }

    if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

    const { error } = await updateGriefRequestStatus(requestId, status, navigatorNotes)
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
