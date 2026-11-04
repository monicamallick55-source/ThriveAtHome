/**
 * app/api/pets/route.ts — G7.24 Pet Profiles
 *
 * GET  /api/pets?member_id=<id>   — list member's pets
 * POST /api/pets                   — add a pet profile
 *
 * Pet profiles are used by Grace and navigators to personalize conversation,
 * track veterinary care needs, and flag pet-related wellbeing concerns
 * (e.g. "if something happens to me, who will take care of Max?").
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('member_pets')
    .select('*')
    .eq('member_id', memberId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pets: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    member_id, name, species, breed, age_years,
    vet_name, vet_phone, emergency_contact_name, emergency_contact_phone,
    care_notes, photo_url,
  } = body

  if (!member_id || !name || !species) {
    return NextResponse.json({ error: 'member_id, name, and species required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('member_pets')
    .insert({
      member_id,
      name,
      species,
      breed: breed ?? null,
      age_years: age_years ?? null,
      vet_name: vet_name ?? null,
      vet_phone: vet_phone ?? null,
      emergency_contact_name: emergency_contact_name ?? null,
      emergency_contact_phone: emergency_contact_phone ?? null,
      care_notes: care_notes ?? null,
      photo_url: photo_url ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update member metadata so Grace knows about this pet
  await supabase
    .from('member_metadata')
    .upsert({ member_id, key: `pet_${data.id}_name`, value: name })
    .then(({ error: _e }: { error: unknown }) => void _e)

  return NextResponse.json({ pet: data }, { status: 201 })
}
