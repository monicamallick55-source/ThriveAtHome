/**
 * app/api/fraud-scan/route.ts — G5.5 Fraud protection scan
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('fraud_scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ scans: [] })
  return NextResponse.json({ scans: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { description, contact_name, contact_method, amount } = body

  if (!description) {
    return NextResponse.json({ error: 'description required' }, { status: 400 })
  }

  const riskKeywords = ['gift card', 'wire transfer', 'irs', 'social security', 'grandchild', 'emergency', 'lottery', 'prize']
  const hits = riskKeywords.filter(k => description.toLowerCase().includes(k)).length
  const risk_level = hits >= 3 ? 'high' : hits >= 1 ? 'medium' : 'low'

  const { data, error } = await supabase
    .from('fraud_scans')
    .insert({ user_id: user.id, description, contact_name: contact_name ?? null, contact_method: contact_method ?? null, amount: amount ?? null, risk_level, status: 'reviewed' })
    .select().single()

  if (error) return NextResponse.json({ scan: { id: 'stub', risk_level, status: 'reviewed', description } }, { status: 201 })
  return NextResponse.json({ scan: data }, { status: 201 })
}
