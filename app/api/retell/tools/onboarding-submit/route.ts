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

    const authUserId = payload.call_id
      ? await getUserIdFromCallId(payload.call_id)
      : null

    if (!authUserId) {
      console.error('[onboarding-submit] could not resolve auth user from call_id', payload.call_id)
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Find the family_member row for this auth user
    const { data: fm, error: fmErr } = await supabase
      .from('family_members')
      .select('id, member_id')
      .eq('supabase_auth_id', authUserId)
      .single()

    if (fmErr || !fm) {
      console.error('[onboarding-submit] no family_member for', authUserId, fmErr)
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
    }

    const preferredName = payload.preferred_name ?? payload.full_name?.split(' ')[0] ?? 'there'
    const topicsArray = payload.topics_enjoy
      ? payload.topics_enjoy.split(',').map((s: string) => s.trim())
      : []

    let memberId: string

    if (fm.member_id) {
      // Member row already exists — update it
      const { error: updateErr } = await supabase
        .from('members')
        .update({
          full_name: payload.full_name ?? undefined,
          preferred_name: preferredName,
          date_of_birth: payload.date_of_birth ?? undefined,
          phone_number: payload.phone_number ?? undefined,
          topics_enjoy: topicsArray.length ? topicsArray : undefined,
          preferred_language: payload.preferred_language ?? 'english',
          lives_alone: payload.lives_alone ?? undefined,
          emergency_contact_1_name: payload.emergency_contact_name ?? undefined,
          emergency_contact_1_phone: payload.emergency_contact_phone ?? undefined,
        })
        .eq('id', fm.member_id)
      if (updateErr) throw updateErr
      memberId = fm.member_id
    } else {
      // Create a new member row then link it
      const { data: newMember, error: insertErr } = await supabase
        .from('members')
        .insert({
          full_name: payload.full_name ?? 'Unknown',
          preferred_name: preferredName,
          date_of_birth: payload.date_of_birth ?? '1900-01-01',
          phone_number: payload.phone_number ?? '',
          preferred_language: payload.preferred_language ?? 'english',
          topics_enjoy: topicsArray,
          lives_alone: payload.lives_alone ?? undefined,
          emergency_contact_1_name: payload.emergency_contact_name ?? undefined,
          emergency_contact_1_phone: payload.emergency_contact_phone ?? undefined,
        })
        .select('id')
        .single()
      if (insertErr || !newMember) throw insertErr
      memberId = newMember.id

      // Link family_member → member
      const { error: linkErr } = await supabase
        .from('family_members')
        .update({ member_id: memberId })
        .eq('id', fm.id)
      if (linkErr) throw linkErr
    }

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
          interests: topicsArray,
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
