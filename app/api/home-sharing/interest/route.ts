/**
 * app/api/home-sharing/interest/route.ts — G6.2
 *
 * POST /api/home-sharing/interest — member (or Rosa) records home-sharing interest
 * GET  /api/home-sharing/interest — admin demand report (staff only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, role, county, timeline, hopes, concerns } = body

  if (!member_id || !role || !county) {
    return NextResponse.json({ error: 'member_id, role and county required' }, { status: 400 })
  }

  // Find active home-sharing partners in this county
  const { data: partners } = await supabase
    .from('community_partners')
    .select('id, name, website, referral_method')
    .eq('category', 'home_sharing')
    .eq('status', 'active')
    .contains('service_counties', [county])

  const hasPartner = (partners ?? []).length > 0

  const { data, error } = await supabase
    .from('home_sharing_interest')
    .insert({
      member_id,
      role,
      county,
      timeline: timeline ?? null,
      hopes: hopes ?? null,
      concerns: concerns ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If no partner in the county, just log interest
  if (!hasPartner) {
    return NextResponse.json({
      interest: data,
      partners: [],
      message: `We don't have a home-sharing partner in ${county} yet. We've noted your interest and will reach out when we do.`
    }, { status: 201 })
  }

  // Create a navigator task for the warm handoff introduction
  await supabase.from('navigator_tasks').insert({
    member_id,
    title: `Home sharing interest — ${role} in ${county}`,
    description: `Member expressed interest in home sharing as a ${role}. Partners available: ${partners?.map((p: { name: string }) => p.name).join(', ')}. Present options and get member consent before making any referral.`,
    priority: 'medium',
    category: 'home_sharing',
    status: 'pending',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    metadata: { interest_id: data.id, county, role },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  return NextResponse.json({ interest: data, partners }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Staff-only: demand by county
  const { data, error } = await supabase
    .from('home_sharing_interest')
    .select('county, role, status')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate by county
  const byCounty: Record<string, { county: string; provider_count: number; seeker_count: number }> = {}
  for (const row of data ?? []) {
    if (!byCounty[row.county]) {
      byCounty[row.county] = { county: row.county, provider_count: 0, seeker_count: 0 }
    }
    if (row.role === 'provider') byCounty[row.county].provider_count++
    if (row.role === 'seeker') byCounty[row.county].seeker_count++
  }

  return NextResponse.json({ demand: Object.values(byCounty) })
}
