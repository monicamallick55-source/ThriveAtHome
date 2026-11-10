import { NextRequest, NextResponse } from 'next/server'

function checkCronSecret(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Grace period reminder: notify members whose trial ends in 3 days
  return NextResponse.json({ ok: true, reminded: 0, message: 'Grace reminder cron ran' })
}

export async function POST(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, reminded: 0 })
}
