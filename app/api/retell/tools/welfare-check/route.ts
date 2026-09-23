import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      member_id,
      concern_type,
      description,
      severity = 'concern',
    } = body.args ?? body

    if (!member_id || !concern_type || !description) {
      return NextResponse.json(
        { error: 'member_id, concern_type, and description are required' },
        { status: 400 }
      )
    }

    const { data: member, error: memberErr } = await admin
      .from('members')
      .select('id, full_name, preferred_name')
      .eq('id', member_id)
      .single()

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const alertType = concern_type === 'fall' ? 'fall'
      : concern_type === 'emergency' ? 'emergency'
      : concern_type === 'medication' ? 'medication_miss'
      : 'crisis'

    await admin.from('alerts').insert({
      member_id,
      alert_type: alertType,
      severity,
      message: `Aria flagged ${concern_type} concern for ${member.preferred_name}: "${description}"`,
      metadata: {
        concern_type,
        source: 'aria_call',
        flagged_during_call: true,
      },
    })

    if (severity === 'emergency') {
      await (admin.from as any)('emergency_log').insert({
        member_id,
        trigger: 'aria_call',
        description: `${concern_type}: ${description}`,
        severity: 'emergency',
      })
    }

    const spokenResponse = severity === 'emergency'
      ? `I'm alerting your care team right now. If this is a life-threatening emergency, please call 911 immediately. Stay on the line with me.`
      : `I've let your care team know. Someone will be in touch with you soon. Is there anything else I can do for you right now?`

    return NextResponse.json({
      success: true,
      alert_created: true,
      result: spokenResponse,
    })
  } catch (error) {
    console.error('[Retell Tool] welfare-check error:', error)
    return NextResponse.json(
      { error: 'Welfare check tool failed' },
      { status: 500 }
    )
  }
}
