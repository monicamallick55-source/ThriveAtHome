import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function checkCronSecret(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

async function runBirthdayArc() {
  const supabase = createAdminClient()
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  const { data: members } = await supabase
    .from('members')
    .select('id, full_name, date_of_birth')
    .not('date_of_birth', 'is', null)

  const processed: string[] = []
  for (const m of members ?? []) {
    const dob = new Date(m.date_of_birth)
    const dobMM = String(dob.getMonth() + 1).padStart(2, '0')
    const dobDD = String(dob.getDate()).padStart(2, '0')
    if (dobMM === mm && dobDD === dd) {
      await supabase.from('notifications').insert({
        member_id: m.id,
        type: 'birthday_arc_d0',
        payload: { name: m.full_name },
        created_at: new Date().toISOString(),
      })
      processed.push(m.id)
    }
  }
  return processed
}

export async function GET(req: NextRequest) {
  if (!checkCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const processed = await runBirthdayArc()
  return NextResponse.json({ ok: true, processed })
}

export async function POST(req: NextRequest) {
  if (!checkCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const processed = await runBirthdayArc()
  return NextResponse.json({ ok: true, processed })
}
