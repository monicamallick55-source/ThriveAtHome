import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { category, note } = await req.json()
    if (!category) return NextResponse.json({ error: 'category required' }, { status: 400 })

    // Try to create a navigator task — graceful if user not logged in
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    let memberId: string | null = null
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .single()
        memberId = member?.id ?? null
      }
    }

    if (memberId) {
      await (admin as any).from('navigator_tasks').insert({
        member_id: memberId,
        task_type: 'partner_referral_request',
        title: `Partner referral request: ${category}`,
        description: note
          ? `Member requested a local referral for ${category}.\n\nMember note: ${note}`
          : `Member requested a local referral for ${category}.`,
        priority: 'medium',
        status: 'pending',
        metadata: { category, source: 'partner-directory' },
      })
    }
    // If not logged in, the request is still acknowledged — member can follow up via dashboard

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('partner referral request error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
