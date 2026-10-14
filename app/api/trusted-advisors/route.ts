// app/api/trusted-advisors/route.ts
// G7.16 — Therapist/chaplain/grief counselor directory
// GET  — list advisors by category (public read for active listings)
// POST — staff adds a new advisor
// PATCH — staff updates (approve listing, toggle status)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_CATEGORIES = [
  'attorney', 'cpa', 'financial_advisor', 'physician', 'nurse', 'pharmacist',
  'therapist', 'grief_counselor', 'chaplain', 'social_worker', 'other',
] as const

// Chaplain is NEVER auto-suggested — only shown when member requests
const CHAPLAIN_REQUEST_ONLY = true

export async function GET(req: Request) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const memberId = url.searchParams.get('memberId')
  const includeChaplain = url.searchParams.get('includeChaplain') === 'true'

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('trusted_advisors')
    .select('id, name, category, specialty, bio, location, telehealth_available, license_number, license_state, non_proselytizing, chaplain_on_request_only, created_at')
    .eq('status', 'active')
    .order('name')

  if (category) {
    query = query.eq('category', category)
  } else {
    // Unless explicitly requested, exclude chaplains (member request only)
    if (!includeChaplain) {
      query = query.neq('category', 'chaplain')
    }
  }

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Annotate with paid listing tier if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listings } = await (admin as any)
    .from('trusted_advisor_listings')
    .select('trusted_advisor_id, listing_tier')
    .eq('status', 'active')

  const listingMap = new Map<string, string>()
  for (const l of listings ?? []) listingMap.set(l.trusted_advisor_id, l.listing_tier)

  const advisors = (data ?? []).map((a: any) => ({
    ...a,
    listing_tier: listingMap.get(a.id) ?? null,
  }))

  // Featured listings first, then premier, then basic, then unlisted
  advisors.sort((a: any, b: any) => {
    const tierOrder: Record<string, number> = { premier: 0, featured: 1, basic: 2 }
    return (tierOrder[a.listing_tier] ?? 3) - (tierOrder[b.listing_tier] ?? 3)
  })

  return NextResponse.json({ advisors })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['staff', 'admin'].includes((fm as any).role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const {
    name, category, specialty, bio, location,
    telehealthAvailable, licenseNumber, licenseState,
    nonProselytizing, phone, email,
  } = body

  if (!name || !category) return NextResponse.json({ error: 'name and category required' }, { status: 400 })
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
  }

  // Therapist requires license
  if (category === 'therapist' && (!licenseNumber || !licenseState)) {
    return NextResponse.json({ error: 'Therapist requires license_number and license_state' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('trusted_advisors')
    .insert({
      name: name.slice(0, 200),
      category,
      specialty: specialty ?? null,
      bio: bio ? bio.slice(0, 1000) : null,
      location: location ?? null,
      telehealth_available: !!telehealthAvailable,
      license_number: licenseNumber ?? null,
      license_state: licenseState ?? null,
      non_proselytizing: category === 'chaplain' ? (nonProselytizing ?? true) : null,
      chaplain_on_request_only: category === 'chaplain' ? CHAPLAIN_REQUEST_ONLY : null,
      phone: phone ?? null,
      email: email ?? null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, advisorId: data.id }, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['staff', 'admin'].includes((fm as any).role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { advisorId, action } = body

  if (!advisorId) return NextResponse.json({ error: 'advisorId required' }, { status: 400 })

  const admin = createAdminClient()

  if (action === 'approve_listing') {
    const { listingId } = body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('trusted_advisor_listings')
      .update({ status: 'active', approved_by: fm.id, approved_at: new Date().toISOString() })
      .eq('id', listingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject_listing') {
    const { listingId, reason } = body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('trusted_advisor_listings')
      .update({ status: 'cancelled', rejection_reason: reason ?? null })
      .eq('id', listingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Generic update
  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.bio !== undefined) updates.bio = body.bio?.slice(0, 1000)
  if (body.specialty !== undefined) updates.specialty = body.specialty
  if (body.telehealthAvailable !== undefined) updates.telehealth_available = body.telehealthAvailable

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('trusted_advisors')
    .update(updates)
    .eq('id', advisorId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
