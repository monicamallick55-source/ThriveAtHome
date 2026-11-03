import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAriaBrief } from '@/lib/data/buddies'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  const { data, error } = await generateAriaBrief(memberId)
  if (error) return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
  return NextResponse.json(data)
}
