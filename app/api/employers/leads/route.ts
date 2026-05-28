import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CARE_TEAM_EMAIL = process.env.CARE_TEAM_EMAIL ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company_name, contact_name, email, phone, company_size, notes } = body

    if (!company_name?.trim() || !contact_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Company name, contact name, and email are required.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('employer_leads')
      .insert({
        company_name: company_name.trim(),
        contact_name: contact_name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        company_size: company_size || null,
        notes: notes?.trim() || null,
        status: 'new',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[api/employers/leads] DB error:', error)
      return NextResponse.json({ error: 'Failed to save request.' }, { status: 500 })
    }

    // Notify sales team
    if (CARE_TEAM_EMAIL) {
      console.log(`[EMAIL] Would send employer demo request to ${CARE_TEAM_EMAIL}: ${company_name.trim()} / ${contact_name.trim()} <${email.trim()}>`)
    } else {
      console.log(`[STUB][EMAIL] Would send employer demo request notification to sales team: ${company_name.trim()} / ${contact_name.trim()} <${email.trim()}>`)
    }

    return NextResponse.json({ id: data?.id }, { status: 201 })
  } catch (e) {
    console.error('[api/employers/leads] Unexpected error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
