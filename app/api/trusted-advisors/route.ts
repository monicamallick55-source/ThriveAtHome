import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const advisors = [
    { role: 'therapist',           label: 'Therapist',               available: true },
    { role: 'elder_law_attorney',  label: 'Elder Law Attorney',       available: true },
    { role: 'financial_advisor',   label: 'Financial Advisor',        available: true },
    { role: 'chaplain',            label: 'Chaplain',                 available: 'on_request' },
    { role: 'grief_counselor',     label: 'Grief Counselor',          available: 'on_request' },
  ]
  return NextResponse.json({ advisors })
}
