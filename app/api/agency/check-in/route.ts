import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getCareWorkerByAuthId, checkInVisit } from '@/lib/data/agencies'

export async function POST(request: Request) {
  const user = await requireAuth()

  const body = await request.json()
  const { visit_id } = body as { visit_id: string }
  if (!visit_id) {
    return NextResponse.json({ error: 'visit_id is required' }, { status: 400 })
  }

  const { data: worker, error: workerError } = await getCareWorkerByAuthId(user.id)
  if (workerError || !worker) {
    return NextResponse.json({ error: 'Care worker not found' }, { status: 403 })
  }

  const { data: visit, error } = await checkInVisit(visit_id, worker.id)
  if (error || !visit) {
    return NextResponse.json({ error: error ?? 'Check-in failed' }, { status: 400 })
  }

  return NextResponse.json({ visit })
}
