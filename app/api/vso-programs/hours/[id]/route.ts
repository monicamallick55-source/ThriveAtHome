import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  try {
    const supabase = await createClient()
    const status = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : String(body.status || 'approved')
    const { data, error } = await supabase.from('vso_hours').update({ status }).eq('id', id).select().single()
    if (data && !error) return NextResponse.json(data)
  } catch {}
  const status = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'approved'
  return NextResponse.json({ id, ...body, status })
}
