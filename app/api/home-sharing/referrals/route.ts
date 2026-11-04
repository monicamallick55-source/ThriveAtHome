/**
 * app/api/home-sharing/referrals/route.ts — G6.2
 *
 * POST /api/home-sharing/referrals   — navigator creates a referral (consent_at required)
 * GET  /api/home-sharing/referrals   — member sees their referrals
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  let query = supabase
    .from('home_sharing_referrals')
    .select('*')
    .order('referred_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referrals: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, program_name, program_url, consent_at } = body

  if (!member_id || !program_name) {
    return NextResponse.json({ error: 'member_id and program_name required' }, { status: 400 })
  }

  // consent_at is REQUIRED before we send the referral
  if (!consent_at) {
    return NextResponse.json({
      error: 'Member consent (consent_at) is required before creating a referral'
    }, { status: 400 })
  }

  const { data: referral, error } = await supabase
    .from('home_sharing_referrals')
    .insert({
      member_id,
      program_name,
      program_url: program_url ?? null,
      referred_by: user.id,
      consent_at,
      participation_status: 'referred',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create navigator task for warm handoff
  await supabase.from('navigator_tasks').insert({
    member_id,
    task_type: 'home_sharing_referral',
    notes: `Member has consented to home-sharing referral to ${program_name}. Call the partner or help the member call to start their application. Check in at 14 days and 60 days.`,
    priority: 'medium',
    category: 'home_sharing',
    status: 'pending',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    metadata: { referral_id: referral.id, program_name },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  // Schedule 14-day and 60-day check-in tasks
  const day14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const day60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

  await supabase.from('navigator_tasks').insert([
    {
      member_id,
      task_type: 'home_sharing_checkin',
      description: `Check in on the member's home-sharing referral status. Have they applied? Any issues?`,
      priority: 'low',
      category: 'home_sharing',
      status: 'pending',
      due_date: day14.toISOString().split('T')[0],
      metadata: { referral_id: referral.id },
    },
    {
      member_id,
      title: `60-day check-in: Home sharing referral to ${program_name}`,
      description: `60-day follow-up on home-sharing participation. Update status and close the loop.`,
      priority: 'low',
      category: 'home_sharing',
      status: 'pending',
      due_date: day60.toISOString().split('T')[0],
      metadata: { referral_id: referral.id },
    },
  ]).then(({ error: _e }: { error: unknown }) => void _e)

  // Update the interest record if one exists
  await supabase
    .from('home_sharing_interest')
    .update({ status: 'referred', referral_id: referral.id })
    .eq('member_id', member_id)
    .eq('status', 'pending')

  return NextResponse.json({ referral }, { status: 201 })
}
