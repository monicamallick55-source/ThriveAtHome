import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Accept cron secret from multiple header formats
  const authHeader = req.headers.get('authorization') ?? ''
  const cronHeader = req.headers.get('x-cron-secret') ?? ''
  const secret = cronHeader || authHeader.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ processed: 0, skipped: 0, errors: [] }, { status: 207 })
}
