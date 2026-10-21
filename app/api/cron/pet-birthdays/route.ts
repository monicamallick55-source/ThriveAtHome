// app/api/cron/pet-birthdays/route.ts
// G7.24 — Daily cron: detect pet birthdays, inject Aria context
// Vercel cron: {"path":"/api/cron/pet-birthdays","schedule":"0 7 * * *"}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const today = new Date()
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(today.getUTCDate()).padStart(2, '0')

  // Find pets with birthday today (match MM-DD regardless of year)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pets, error } = await (admin as any)
    .from('member_pets')
    .select('id, name, species, member_id, birthday, adopted_at')
    .eq('is_deceased', false)
    .not('birthday', 'is', null)
    .like('birthday', `%-${mm}-${dd}`)

  if (error) {
    console.error('[pet-birthdays cron] query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ petId: string; petName: string; memberId: string; type: string }> = []

  for (const pet of pets ?? []) {
    // Calculate age
    const birthYear = new Date(pet.birthday).getFullYear()
    const age = today.getUTCFullYear() - birthYear

    // Log birthday milestone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('pet_milestones').insert({
      pet_id: pet.id,
      member_id: pet.member_id,
      type: 'birthday',
      occurred_at: today.toISOString().split('T')[0],
      title: `Happy birthday, ${pet.name}! 🎂 (${age} year${age === 1 ? '' : 's'} old)`,
      shared_with_family: true,
    }).catch(() => null)

    // Inject into Aria context for today's call
    const speciesWord = pet.species === 'dog' ? 'pup' : pet.species === 'cat' ? 'cat' : pet.species
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: pet.member_id,
      context_type: 'pet_birthday',
      context_key: `pet_bday_${pet.id}_${today.getUTCFullYear()}`,
      content: `Today is ${pet.name}'s birthday — the ${speciesWord} turns ${age}! Mention it warmly if it comes up naturally.`,
      expires_at: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)

    results.push({ petId: pet.id, petName: pet.name, memberId: pet.member_id, type: 'birthday' })
  }

  // Also check adoption anniversaries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adopted } = await (admin as any)
    .from('member_pets')
    .select('id, name, species, member_id, adopted_at')
    .eq('is_deceased', false)
    .not('adopted_at', 'is', null)
    .like('adopted_at', `%-${mm}-${dd}`)

  for (const pet of adopted ?? []) {
    const adoptYear = new Date(pet.adopted_at).getFullYear()
    const years = today.getUTCFullYear() - adoptYear
    if (years < 1) continue // Skip first year

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('pet_milestones').insert({
      pet_id: pet.id,
      member_id: pet.member_id,
      type: 'adoption_anniversary',
      occurred_at: today.toISOString().split('T')[0],
      title: `${pet.name}'s ${years}-year adoption anniversary! 🏠❤️`,
      shared_with_family: true,
    }).catch(() => null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: pet.member_id,
      context_type: 'pet_anniversary',
      context_key: `pet_anniv_${pet.id}_${today.getUTCFullYear()}`,
      content: `Today marks ${years} year${years === 1 ? '' : 's'} since ${pet.name} was adopted! A lovely milestone.`,
      expires_at: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)

    results.push({ petId: pet.id, petName: pet.name, memberId: pet.member_id, type: 'adoption_anniversary' })
  }

  return NextResponse.json({ processed: results.length, pets: results })
}
