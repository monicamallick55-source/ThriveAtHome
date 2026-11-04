/**
 * app/api/volunteers/opportunities/route.ts — G7.10 Volunteer Opportunities
 *
 * GET  /api/volunteers/opportunities   — list open opportunities (filtered by zip for neighbors)
 * POST /api/volunteers/opportunities   — staff creates opportunity
 *
 * Opportunity types: companion_call, errand_run, skill_share, event_help,
 *                    neighbor_check_in (zip-enforced), retired_pro_consult
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NEIGHBOR_ZIP_RADIUS_MILES = 5 // neighbor_check_in confined to same/adjacent zip

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const opportunityType = searchParams.get('type')
  const county = searchParams.get('county')
  const memberZip = searchParams.get('zip') // for neighbor zip enforcement

  let query = supabase
    .from('opportunities')
    .select(`
      id, title, description, opportunity_type, required_skills,
      location_type, zip_code, county, spots_total, spots_filled,
      scheduled_date, duration_minutes, is_recurring,
      created_at, metadata
    `)
    .eq('status', 'open')
    .order('scheduled_date', { ascending: true })

  if (opportunityType) query = query.eq('opportunity_type', opportunityType)
  if (county) query = query.eq('county', county)

  const { data: opps, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let results = opps ?? []

  // G7.12 — Neighbor check-in zip enforcement: only show within ~5 miles
  if (memberZip) {
    results = results.filter((opp) => {
      if (opp.opportunity_type !== 'neighbor_check_in') return true
      if (!opp.zip_code) return true // no zip restriction = national
      return isNearbyZip(memberZip, opp.zip_code, NEIGHBOR_ZIP_RADIUS_MILES)
    })
  }

  return NextResponse.json({ opportunities: results })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    title, description, opportunity_type, required_skills,
    location_type, zip_code, county, spots_total,
    scheduled_date, duration_minutes, is_recurring,
    target_member_id, metadata,
  } = body

  if (!title || !opportunity_type) {
    return NextResponse.json({ error: 'title and opportunity_type required' }, { status: 400 })
  }

  // For neighbor_check_in, zip_code is required
  if (opportunity_type === 'neighbor_check_in' && !zip_code) {
    return NextResponse.json(
      { error: 'zip_code required for neighbor_check_in opportunities' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      title,
      description: description ?? null,
      opportunity_type,
      required_skills: required_skills ?? [],
      location_type: location_type ?? 'virtual',
      zip_code: zip_code ?? null,
      county: county ?? null,
      spots_total: spots_total ?? 1,
      spots_filled: 0,
      scheduled_date: scheduled_date ?? null,
      duration_minutes: duration_minutes ?? null,
      is_recurring: is_recurring ?? false,
      target_member_id: target_member_id ?? null,
      status: 'open',
      created_by: user.id,
      metadata: metadata ?? {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunity: data }, { status: 201 })
}

/**
 * Simple zip code proximity check.
 * Production: replace with PostGIS or zip-code-distance lookup.
 * Stub: same first 3 digits of zip = within ~5 miles in California.
 */
function isNearbyZip(memberZip: string, opportunityZip: string, _radiusMiles: number): boolean {
  if (memberZip === opportunityZip) return true
  // Same 3-digit prefix = same neighborhood in CA zip codes
  return memberZip.substring(0, 3) === opportunityZip.substring(0, 3)
}
