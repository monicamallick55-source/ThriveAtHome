// app/api/pets/route.ts
// G7.24 — Pet profiles + milestones + grief pathway
// GET  — list member's pets (+ upcoming birthdays)
// POST — add pet profile
// PATCH — update pet (mark as deceased, triggers grief pathway)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const memberId = url.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pets, error } = await (admin as any)
    .from('member_pets')
    .select('*, milestones:pet_milestones(id, type, occurred_at, title, shared_with_family)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Annotate upcoming birthdays (within 30 days)
  const today = new Date()
  const enriched = (pets ?? []).map((pet: any) => {
    let birthdayComingUp = false
    if (pet.birthday && !pet.is_deceased) {
      const bday = new Date(pet.birthday)
      const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
      const diff = (thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      birthdayComingUp = diff >= 0 && diff <= 30
    }
    return { ...pet, birthday_coming_up: birthdayComingUp }
  })

  return NextResponse.json({ pets: enriched })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { memberId, name, species, breed, birthday, adoptedAt, color, notes } = body

  if (!memberId || !name || !species) {
    return NextResponse.json({ error: 'memberId, name, and species required' }, { status: 400 })
  }

  const validSpecies = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'reptile', 'other']
  if (!validSpecies.includes(species)) {
    return NextResponse.json({ error: `species must be: ${validSpecies.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pet, error } = await (admin as any)
    .from('member_pets')
    .insert({
      member_id: memberId,
      name: name.slice(0, 100),
      species,
      breed: breed ?? null,
      birthday: birthday ?? null,
      adopted_at: adoptedAt ?? null,
      color: color ?? null,
      notes: notes ? notes.slice(0, 500) : null,
    })
    .select('id, name, species')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log new pet milestone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('pet_milestones').insert({
    pet_id: pet.id,
    member_id: memberId,
    type: 'new_pet',
    occurred_at: new Date().toISOString().split('T')[0],
    title: `${name} joined the family! 🐾`,
    shared_with_family: true,
  }).catch(() => null)

  // Inject into Aria context for next call
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('aria_call_contexts').upsert({
    member_id: memberId,
    context_type: 'new_pet',
    context_key: `pet_${pet.id}`,
    content: `${name} the ${species} is a new furry family member!`,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'member_id,context_key' }).catch(() => null)

  return NextResponse.json({ ok: true, petId: pet.id }, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { petId, action } = body
  if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pet } = await (admin as any)
    .from('member_pets')
    .select('id, name, species, member_id, is_deceased')
    .eq('id', petId)
    .maybeSingle()
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  if (action === 'mark_deceased') {
    const passedAt = body.passedAt ?? new Date().toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('member_pets')
      .update({ is_deceased: true, passed_at: passedAt })
      .eq('id', petId)

    // Log loss milestone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('pet_milestones').insert({
      pet_id: petId,
      member_id: pet.member_id,
      type: 'loss',
      occurred_at: passedAt,
      title: `In loving memory of ${pet.name} 🌈`,
      shared_with_family: true,
    }).catch(() => null)

    // Trigger grief pathway — create navigator task with high priority
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('navigator_tasks').insert({
      member_id: pet.member_id,
      task_type: 'pet_loss_grief',
      priority: 'high',
      description: `Member lost their ${pet.species}, ${pet.name}. Consider checking in with a grief counselor referral. Pet loss can be profound for seniors.`,
      metadata: { pet_id: petId, pet_name: pet.name, species: pet.species, passed_at: passedAt },
    }).catch(() => null)

    // Inject grief context into Aria for next 14 days
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: pet.member_id,
      context_type: 'pet_loss',
      context_key: `pet_loss_${petId}`,
      content: `${pet.name} the ${pet.species} recently passed away. Member may be grieving. Acknowledge gently if they bring it up; do not proactively ask.`,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)

    return NextResponse.json({ ok: true, griefTaskCreated: true })
  }

  // Generic update
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.slice(0, 100)
  if (body.notes !== undefined) updates.notes = body.notes?.slice(0, 500)
  if (body.photoUrl !== undefined) updates.photo_url = body.photoUrl
  if (body.breed !== undefined) updates.breed = body.breed
  if (body.color !== undefined) updates.color = body.color

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('member_pets').update(updates).eq('id', petId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
