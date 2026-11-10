import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
function ok(req: NextRequest) { const s = process.env.CRON_SECRET; return s && (req.headers.get('x-cron-secret') === s || req.headers.get('authorization')?.replace('Bearer ','') === s) }
export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, processed: 0 })
}
export async function POST(req: NextRequest) { return GET(req) }
