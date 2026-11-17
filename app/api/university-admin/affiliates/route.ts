import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const status = req.nextUrl.searchParams.get('status')
    let query = supabase.from('university_affiliates').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data } = await query
    return NextResponse.json(data ?? [])
  } catch { return NextResponse.json([]) }
}
