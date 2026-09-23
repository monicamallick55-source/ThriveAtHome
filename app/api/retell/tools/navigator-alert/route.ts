// Retell tool handler: creates a navigator alert when Aria calls create_navigator_alert.
// Args from Retell: { alert_type: string, message: string, priority?: string }
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { member_id?: string; call_id?: string; alert_type?: string; message?: string; priority?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { member_id, alert_type, message, priority } = body

  if (!member_id || !message) {
    return NextResponse.json({ result: 'Noted.' })
  }

  const admin = createAdminClient()

  const { error } = await (admin.from as any)('navigator_alerts').insert({
    member_id,
    alert_type: alert_type ?? 'general',
    message,
    priority: priority ?? 'medium',
    source: 'aria_call',
    acknowledged: false,
  })

  if (error) {
    console.error('[navigator-alert] insert failed:', error)
    return NextResponse.json({ result: 'Noted — your care team will follow up.' })
  }

  console.log(`[navigator-alert] member=${member_id} type=${alert_type} priority=${priority}`)
  return NextResponse.json({ result: 'I\'ve let your care team know. Someone will be in touch with you soon.' })
}
