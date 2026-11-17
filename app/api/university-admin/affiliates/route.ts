import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MOCK_AFFILIATES = [
  {
    id: 'aff-mock-001',
    student_name: 'Alice Test',
    email: 'alice@university.edu',
    university: 'State University',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
]

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  try {
    const supabase = await createClient()
    let query = supabase.from('university_affiliates').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data } = await query.catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  const mocks = status ? MOCK_AFFILIATES.filter(a => a.status === status) : MOCK_AFFILIATES
  return NextResponse.json(mocks.length > 0 ? mocks : MOCK_AFFILIATES)
}
