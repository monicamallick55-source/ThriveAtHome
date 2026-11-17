import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  const status = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : String(body.status || 'approved')
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('vso_hours').update({ status }).eq('id', id).select().single()
    if (data) return NextResponse.json({ ...data, status })
  } catch {}
  return NextResponse.json({ id, ...body, status })
}
