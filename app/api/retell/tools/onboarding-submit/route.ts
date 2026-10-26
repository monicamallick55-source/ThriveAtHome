import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface QuinnPayload {
  full_name?: string
  preferred_name?: string
  date_of_birth?: string
  phone_number?: string
  topics_enjoy?: string
  preferred_language?: string
  aria_call_opt_in?: string
  lives_alone?: boolean
  emergency_contact_name?: string
  emergency_contact_phone?: string
  call_id?: string
  [key: string]: unknown
}

async function getUserIdFromCallId(callId: string): Promise<string | null> {
  const apiKey = process.env.RETELL_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return null
    const data = await res.json() as { retell_llm_dynamic_variables?: Record<string, string> }
    return data.retell_llm_dynamic_variables?.auth_user_id ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as QuinnPayload

    // Authenticate via call_id → Retell API → auth_user_id dynamic variable
    const authUserId = payload.call_id
      ? await getUserIdFromCallId(payload.call_id)
      : null

    if (!authUserId) {
      console.error('[onboarding-submit] could not resolve auth user from call_id', payload.call_id)
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Find the family_member row
    const { data: fm, error: fmErr } = await supabase
      .from('family_members')
      .select('id, relationship')
      .eq('supabase_auth_id', authUserId)
      .single()

    if (fmErr || !fm) {
      console.error('[onboarding-submit] no family_member for', authUserId, fmErr)
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
    }

    const memberData = {
      full_name: payload.full_name ?? null,
      preferred_name: payload.preferred_name ?? (payload.full_name?.split(' ')[0] ?? null),
      date_of_birth: payload.date_of_birth ?? null,
      phone_number: payload.phone_number ?? null,
      topics_enjoy: payload.topics_enjoy ?? null,
      preferred_language: payload.preferred_language ?? 'en',
      aria_call_opt_in: payload.aria_call_opt_in ?? 'no',
      lives_alone: payload.lives_alone ?? null,
      emergency_contact_name: payload.emergency_contact_name ?? null,
      emergency_contact_phone: payload.emergency_contact_phone ?? null,
      onboarding_complete: true,
    }

    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('family_member_id', fm.id)
      .maybeSingle()

    let memberId: string

    if (existingMember) {
      const { error: updateErr } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', existingMember.id)
      if (updateErr) throw updateErr
      memberId = existingMember.id
    } else {
      const { data: newMember, error: insertErr } = await supabase
        .from('members')
        .insert({ ...memberData, family_member_id: fm.id })
        .select('id')
        .single()
      if (insertErr || !newMember) throw insertErr
      memberId = newMember.id
    }

    const preferredName = memberData.preferred_name ?? 'there'

    // Fire Aria welcome call (non-fatal)
    try {
      const phone = payload.phone_number?.trim()
      if (phone && memberId && (payload.aria_call_opt_in === 'daily' || payload.aria_call_opt_in === 'less_often')) {
        const { RetellCallProvider } = await import('@/lib/services/RetellCallProvider')
        const provider = new RetellCallProvider()
        await provider.scheduleCall(memberId, phone, {
          agent: 'aria',
          preferredName,
          callType: 'onboarding',
          interests: payload.topics_enjoy ? payload.topics_enjoy.split(',').map((s: string) => s.trim()) : [],
          dynamicVariables: {},
          priorCallSummaries: [],
          preferredLanguage: payload.preferred_language ?? 'en',
        })
      }
    } catch (retellErr) {
      console.error('[onboarding-submit] Aria call failed (non-fatal):', retellErr)
    }

    return NextResponse.json({
      success: true,
      preferred_name: preferredName,
      message: `Perfect — I've saved your profile, ${preferredName}. Welcome to Thrive at Home!`,
    })
  } catch (err) {
    console.error('[onboarding-submit] error', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
