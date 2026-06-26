import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getCareWorkerByAuthId, checkOutVisit } from '@/lib/data/agencies'

export async function POST(request: Request) {
  const user = await requireAuth()

  const body = await request.json()
  const { visit_id, notes } = body as { visit_id: string; notes?: string }
  if (!visit_id) {
    return NextResponse.json({ error: 'visit_id is required' }, { status: 400 })
  }

  const { data: worker, error: workerError } = await getCareWorkerByAuthId(user.id)
  if (workerError || !worker) {
    return NextResponse.json({ error: 'Care worker not found' }, { status: 403 })
  }

  const { data: visit, error } = await checkOutVisit(visit_id, worker.id, notes)
  if (error || !visit) {
    return NextResponse.json({ error: error ?? 'Check-out failed' }, { status: 400 })
  }

  return NextResponse.json({ visit })
}
