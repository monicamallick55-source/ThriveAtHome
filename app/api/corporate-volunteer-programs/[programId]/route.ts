import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/corporate-volunteer-programs/[programId] — authenticated volunteers fetch their program details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await params
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('corporate_volunteer_programs')
      .select('program_name, matching_rate_per_hour, annual_hour_cap_per_employee, tier, employer_account_id')
      .eq('id', programId)
      .maybeSingle()
    if (error || !data) return NextResponse.json({ program: null })

    // Get employer name
    const { data: employer } = await admin
      .from('employer_accounts')
      .select('company_name')
      .eq('id', data.employer_account_id)
      .maybeSingle()

    return NextResponse.json({
      program: {
        program_name: data.program_name,
        employer_name: employer?.company_name ?? 'Your employer',
        matching_rate_per_hour: data.matching_rate_per_hour,
        annual_hour_cap_per_employee: data.annual_hour_cap_per_employee,
        tier: data.tier,
      },
    })
  } catch {
    return NextResponse.json({ program: null })
  }
}
