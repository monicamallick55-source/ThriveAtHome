import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/corporate-volunteer-programs — public endpoint, lists active programs for volunteer application dropdown
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('corporate_volunteer_programs')
      .select('id, program_name, tier, employer_account_id')
      .eq('status', 'active')
      .order('program_name')
    if (error) return NextResponse.json({ programs: [] })
    return NextResponse.json({ programs: data ?? [] })
  } catch {
    return NextResponse.json({ programs: [] })
  }
}
