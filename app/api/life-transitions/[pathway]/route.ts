import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const P: Record<string,string> = { retirement:'Retirement',widow:'Widowhood',diagnosis:'Health Diagnosis',moving:'Moving',caregiving:'Caregiving',divorce:'Divorce',loss:'Loss of Independence',financial:'Financial Change',independence:'Independence' }
export async function GET(req: NextRequest, { params }: { params: Promise<{ pathway: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { pathway } = await params
  if (!P[pathway]) return NextResponse.json({ error: 'Unknown pathway' }, { status: 404 })
  return NextResponse.json({ pathway, name: P[pathway], resources: [], navigator_support: true })
}
