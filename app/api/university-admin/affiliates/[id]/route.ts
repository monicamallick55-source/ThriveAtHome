import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await req.json().catch(() => ({}))
    const newStatus = body.action === 'verify' ? 'verified' : (body.status ?? 'active')
    const { data, error } = await supabase.from('university_affiliates').update({ status: newStatus }).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ id: params.id, status: newStatus })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'failed' }, { status: 500 }) }
}
