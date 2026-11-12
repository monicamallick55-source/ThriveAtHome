import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ','')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, processed: 0, timestamp: new Date().toISOString() })
}
