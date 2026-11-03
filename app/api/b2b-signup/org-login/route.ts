import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { data, error } = await supabase
    .from('b2b_orgs')
    .select('id, org_name, billing_tier')
    .eq('contact_email', email.toLowerCase().trim())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
  }

  return NextResponse.json({
    org_id: data.id,
    org_name: data.org_name,
    billing_tier: data.billing_tier,
  })
}
