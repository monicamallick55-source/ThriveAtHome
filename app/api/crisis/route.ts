/**
 * app/api/crisis/route.ts — G7.21 Crisis Line Embedding
 *
 * GET /api/crisis — returns crisis resources for the current user context.
 *   - 988 Suicide & Crisis Lifeline (call or text 988)
 *   - SAMHSA National Helpline (substance use & mental health)
 *   - Senior-specific resources (Friendship Line, local crisis)
 *   - Flags a crisis event for navigator review if ?flag=true
 *
 * POST /api/crisis/flag — member or family flags a crisis concern;
 *   creates an urgent navigator task and schedules a Grace check-in call.
 *
 * IMPORTANT: This endpoint returns resources only. It does NOT perform
 * risk assessment and does NOT replace professional crisis services.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CRISIS_RESOURCES = [
  {
    id: '988',
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential support for people in distress. Call or text 988, available 24/7.',
    phone: '988',
    text: '988',
    chat_url: 'https://988lifeline.org/chat/',
    available: '24/7',
    languages: ['English', 'Spanish', 'Other (via interpreter)'],
    notes: 'Dedicated Veterans line: press 1',
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    description: 'Free, confidential, 24/7 treatment referral and information service for substance use and mental health disorders.',
    phone: '1-800-662-4357',
    chat_url: null,
    available: '24/7',
    languages: ['English', 'Spanish'],
    notes: 'Free treatment referrals — not a crisis line; call 988 for immediate crisis support',
  },
  {
    id: 'friendship_line',
    name: 'Friendship Line (Institute on Aging)',
    description: 'The only 24-hour crisis line and "warmline" specifically for people 60+ and adults with disabilities.',
    phone: '1-800-971-0016',
    available: '24/7',
    languages: ['English'],
    notes: 'You can call just to talk — not only in crisis',
  },
  {
    id: 'crisis_text',
    name: 'Crisis Text Line',
    description: 'Text HOME to 741741 to connect with a crisis counselor.',
    phone: null,
    text: 'HOME to 741741',
    available: '24/7',
    languages: ['English'],
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const flag = searchParams.get('flag') === 'true'

  if (flag) {
    // Log that the crisis page was accessed with flag — navigator will follow up
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('navigator_tasks').insert({
        task_type: 'crisis_flag',
        notes: 'A member or family member flagged a crisis concern by accessing the crisis page with flag=true. Please reach out immediately.',
        priority: 'urgent',
        category: 'crisis',
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
        metadata: { user_id: user.id, flagged_at: new Date().toISOString() },
      }).then(({ error: _e }: { error: unknown }) => void _e)
    }
  }

  return NextResponse.json({
    resources: CRISIS_RESOURCES,
    immediate_message: 'If you or someone you know is in immediate danger, call 911.',
    navigator_note: 'Your navigator is here to support you. You can also reach out to them directly through ThriveAtHome.',
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, concern_type, description, reported_by_family_member_id } = body

  if (!member_id) {
    return NextResponse.json({ error: 'member_id required' }, { status: 400 })
  }

  // Create urgent navigator task
  const { data: task, error } = await supabase.from('navigator_tasks').insert({
    member_id,
    task_type: 'crisis_flag',
    notes: description ?? 'A crisis concern has been flagged. Please reach out to the member immediately.',
    priority: 'urgent',
    category: 'crisis',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    metadata: {
      concern_type,
      flagged_by: reported_by_family_member_id ?? user.id,
      flagged_at: new Date().toISOString(),
    },
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Schedule a Grace check-in call for within 2 hours
  const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000)
  await supabase.from('scheduled_calls').insert({
    member_id,
    call_type: 'crisis_check_in',
    scheduled_at: inTwoHours.toISOString(),
    status: 'scheduled',
    notes: `Crisis flag: ${concern_type ?? 'General concern'}. ${description ?? ''}`,
    metadata: { navigator_task_id: task.id },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  return NextResponse.json({
    flagged: true,
    navigator_task_id: task.id,
    message: 'Your concern has been flagged. Your navigator will reach out shortly. If this is an emergency, please call 911.',
    crisis_resources: CRISIS_RESOURCES.slice(0, 2), // return 988 and SAMHSA
  }, { status: 201 })
}
