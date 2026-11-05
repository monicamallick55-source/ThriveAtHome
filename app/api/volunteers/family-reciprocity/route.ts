/**
 * app/api/volunteers/family-reciprocity/route.ts — G7.13 Family Reciprocity
 *
 * Family members who volunteer with ThriveAtHome earn time-bank credits
 * that convert into companion call credits for their loved one.
 *
 * GET  /api/volunteers/family-reciprocity?member_id=<id>
 *   Returns the family member's volunteer hours and earned credits.
 *
 * POST /api/volunteers/family-reciprocity
 *   Records a family member volunteer session and awards credits.
 *
 * Credit formula: 1 hour of family volunteer time = 1 companion call credit
 *   for the senior member (capped at 4 credits/month to prevent abuse).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const HOURS_PER_CREDIT = 1
const MAX_CREDITS_PER_MONTH = 4

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  const familyMemberId = searchParams.get('family_member_id') ?? user.id

  // Get time bank entries sourced from family volunteering
  const query = supabase
    .from('time_bank_entries')
    .select('id, hours, description, earned_at, source, family_member_id, credited_to_member_id')
    .eq('source', 'family_volunteer')
    .order('earned_at', { ascending: false })

  const { data: entries, error } = memberId
    ? await query.eq('credited_to_member_id', memberId)
    : await query.eq('family_member_id', familyMemberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalHours = (entries ?? []).reduce((sum: number, e: { hours: number }) => sum + (e.hours ?? 0), 0)
  const totalCredits = Math.floor(totalHours / HOURS_PER_CREDIT)

  // Current month hours (for cap enforcement)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthHours = (entries ?? [])
    .filter((e: { earned_at: string }) => new Date(e.earned_at) >= monthStart)
    .reduce((sum: number, e: { hours: number }) => sum + (e.hours ?? 0), 0)
  const monthCredits = Math.floor(monthHours / HOURS_PER_CREDIT)

  return NextResponse.json({
    entries: entries ?? [],
    summary: {
      total_hours: totalHours,
      total_credits_earned: totalCredits,
      month_credits_earned: monthCredits,
      month_cap: MAX_CREDITS_PER_MONTH,
      month_credits_remaining: Math.max(0, MAX_CREDITS_PER_MONTH - monthCredits),
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { family_member_id, member_id, hours, description, opportunity_id } = body

  if (!family_member_id || !member_id || !hours || hours <= 0) {
    return NextResponse.json(
      { error: 'family_member_id, member_id, and hours (> 0) required' },
      { status: 400 }
    )
  }

  // Verify family member belongs to this member
  const { data: fm } = await supabase
    .from('family_members')
    .select('id')
    .eq('id', family_member_id)
    .eq('member_id', member_id)
    .single()

  if (!fm) {
    return NextResponse.json({ error: 'Family member not found for this member' }, { status: 404 })
  }

  // Check monthly cap
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: monthEntries } = await supabase
    .from('time_bank_entries')
    .select('hours')
    .eq('source', 'family_volunteer')
    .eq('family_member_id', family_member_id)
    .eq('credited_to_member_id', member_id)
    .gte('earned_at', monthStart.toISOString())

  const monthHoursSoFar = (monthEntries ?? []).reduce(
    (sum: number, e: { hours: number }) => sum + (e.hours ?? 0),
    0
  )
  const monthCreditsSoFar = Math.floor(monthHoursSoFar / HOURS_PER_CREDIT)

  if (monthCreditsSoFar >= MAX_CREDITS_PER_MONTH) {
    return NextResponse.json({
      error: `Monthly credit cap of ${MAX_CREDITS_PER_MONTH} companion call credits already reached for this family member`,
      month_credits_earned: monthCreditsSoFar,
    }, { status: 409 })
  }

  // Log the time bank entry
  const cappedHours = Math.min(hours, (MAX_CREDITS_PER_MONTH - monthCreditsSoFar) * HOURS_PER_CREDIT)
  const creditsAwarded = Math.floor(cappedHours / HOURS_PER_CREDIT)

  const { data: entry, error: entryError } = await supabase
    .from('time_bank_entries')
    .insert({
      member_id: null, // family member volunteering — not a member-side entry
      family_member_id,
      credited_to_member_id: member_id,
      source: 'family_volunteer',
      hours: cappedHours,
      description: description ?? 'Family volunteer session',
      opportunity_id: opportunity_id ?? null,
      earned_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 500 })

  // Award companion call credits to the senior's account
  if (creditsAwarded > 0) {
    await supabase.rpc('increment_companion_credits', {
      p_member_id: member_id,
      p_credits: creditsAwarded,
    }).then(({ error: _e }: { error: unknown }) => void _e)

    // Notify member's navigator
    await supabase.from('navigator_tasks').insert({
      member_id,
      title: `Family volunteer credits awarded`,
      description: `A family member volunteered ${cappedHours}h and earned ${creditsAwarded} companion call credit(s) for the member.`,
      priority: 'low',
      category: 'volunteer',
      status: 'pending',
      due_date: new Date().toISOString().split('T')[0],
      metadata: { entry_id: entry.id, family_member_id, credits: creditsAwarded },
    }).then(({ error: _e }: { error: unknown }) => void _e)
  }

  return NextResponse.json({
    entry,
    credits_awarded: creditsAwarded,
    hours_capped: cappedHours < hours,
    message: creditsAwarded > 0
      ? `Logged ${cappedHours}h — ${creditsAwarded} companion call credit(s) added to member's account`
      : 'Hours logged but monthly credit cap already reached',
  }, { status: 201 })
}
