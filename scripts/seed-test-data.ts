// Seed script — creates a test family user and member (Margaret Chen) with 14 calls,
// 2 alerts, 2 notifications, a navigator assignment, and 3 tasks.
// Idempotent: checks by email before every insert. Safe to run twice.

import { createClient } from '@supabase/supabase-js'
import { requireEnv, requireServerEnv } from '../lib/env'

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'test-family@thriveathome.dev'
const TEST_PASSWORD = 'TestPassword123!'
const NAV_EMAIL = 'test-navigator@thriveathome.dev'

// Mood arc: 8,8,7,8,7,6,7,6,5,6,5,5,4,5 (14 calls, oldest to newest)
const MOOD_ARC = [8, 8, 7, 8, 7, 6, 7, 6, 5, 6, 5, 5, 4, 5]

async function seed(): Promise<void> {
  console.log('── Seed: ThriveAtHome test data ────────────────────────')

  // ── 1. Auth user ────────────────────────────────────────────────
  console.log('\n1. Auth user')
  let authUserId: string

  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === TEST_EMAIL)

  if (existingUser) {
    authUserId = existingUser.id
    console.log(`   ↩  Already exists: ${TEST_EMAIL} (${authUserId})`)
  } else {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error || !newUser.user) throw new Error(`Auth user create failed: ${error?.message}`)
    authUserId = newUser.user.id
    console.log(`   ✅ Created auth user: ${TEST_EMAIL} (${authUserId})`)
  }

  // ── 2. family_members row ────────────────────────────────────────
  console.log('\n2. family_members row')
  let familyMemberId: string
  let memberId: string | null = null

  const { data: existingFm } = await admin
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle()

  if (existingFm) {
    familyMemberId = existingFm.id
    memberId = existingFm.member_id
    console.log(`   ↩  Already exists: family_members (${familyMemberId})`)
  } else {
    const { data: fm, error } = await admin
      .from('family_members')
      .insert({
        supabase_auth_id: authUserId,
        full_name: 'Alex Chen',
        email: TEST_EMAIL,
        relationship: 'child',
        role: 'family',
      })
      .select('id, member_id')
      .maybeSingle()
    if (error || !fm) throw new Error(`family_members insert failed: ${error?.message}`)
    familyMemberId = fm.id
    memberId = fm.member_id
    console.log(`   ✅ Created family_members (${familyMemberId})`)
  }

  // ── 3. members row (Margaret Chen) ──────────────────────────────
  console.log('\n3. members row')

  if (memberId) {
    console.log(`   ↩  Already linked: members (${memberId})`)
  } else {
    const { data: member, error } = await admin
      .from('members')
      .insert({
        full_name: 'Margaret Chen',
        preferred_name: 'Margaret',
        date_of_birth: '1945-03-15',
        phone_number: '+15550001234',
        preferred_language: 'english',
        preferred_call_time: 'morning',
        check_in_frequency: 'daily',
        topics_enjoy: ['gardening', 'family stories', 'music', 'cooking'],
        lives_alone: true,
        health_conditions: 'Type 2 diabetes, mild arthritis',
        medications: 'Metformin 500mg twice daily, Aspirin 81mg daily',
        address: '42 Maple Street, Springfield, MA 01101',
        emergency_contact_1_name: 'Alex Chen',
        emergency_contact_1_phone: '+15550005678',
        emergency_contact_1_rel: 'child',
        doctor_name: 'Dr. Patricia Lin',
        doctor_phone: '+15550009012',
        plan_tier: 'basics',
        status: 'active',
      })
      .select('id')
      .maybeSingle()
    if (error || !member) throw new Error(`members insert failed: ${error?.message}`)
    memberId = member.id

    // Link family_members.member_id
    const { error: linkErr } = await admin
      .from('family_members')
      .update({ member_id: memberId })
      .eq('id', familyMemberId)
    if (linkErr) throw new Error(`family_members link failed: ${linkErr.message}`)
    console.log(`   ✅ Created Margaret Chen (${memberId})`)
  }

  // ── 4. check_in_calls (14 calls, mood arc) ─────────────────────
  console.log('\n4. check_in_calls')

  const { count: existingCallCount } = await admin
    .from('check_in_calls')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  if ((existingCallCount ?? 0) >= 14) {
    console.log(`   ↩  Already have ${existingCallCount} calls, skipping`)
  } else {
    const now = new Date()
    const callsToInsert = MOOD_ARC.map((moodScore, i) => {
      const daysAgo = MOOD_ARC.length - 1 - i
      const scheduledAt = new Date(now)
      scheduledAt.setDate(scheduledAt.getDate() - daysAgo)
      scheduledAt.setHours(9, 0, 0, 0)
      const startedAt = new Date(scheduledAt)
      const endedAt = new Date(startedAt.getTime() + 18 * 60 * 1000) // 18 min call
      return {
        member_id: memberId!,
        call_type: 'check_in' as const,
        scheduled_at: scheduledAt.toISOString(),
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: 18 * 60,
        status: 'completed' as const,
        mood_score: moodScore,
        energy_score: Math.max(1, moodScore - 1 + Math.floor(Math.random() * 3)),
        pain_score: 10 - moodScore + Math.floor(Math.random() * 2),
        medication_taken: i % 5 !== 3, // mostly true, one miss at index 3
        ai_summary: `Margaret sounded ${moodScore >= 7 ? 'upbeat' : moodScore >= 5 ? 'a bit tired' : 'subdued'} today. She mentioned her garden and asked about her grandchildren.`,
        alert_flags: moodScore <= 5 ? ['low_mood'] : [],
      }
    })

    const { error } = await admin.from('check_in_calls').insert(callsToInsert)
    if (error) throw new Error(`check_in_calls insert failed: ${error.message}`)
    console.log(`   ✅ Inserted 14 calls (mood arc: ${MOOD_ARC.join(',')})`)
  }

  // ── 5. alerts ───────────────────────────────────────────────────
  console.log('\n5. alerts')

  const { count: existingAlertCount } = await admin
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  if ((existingAlertCount ?? 0) >= 2) {
    console.log(`   ↩  Already have ${existingAlertCount} alerts, skipping`)
  } else {
    const { error } = await admin.from('alerts').insert([
      {
        member_id: memberId!,
        alert_type: 'mood_drop',
        severity: 'concern',
        message: 'Margaret\'s mood score has declined from 8 to 4 over the past 2 weeks.',
        acknowledged: false,
      },
      {
        member_id: memberId!,
        alert_type: 'medication_miss',
        severity: 'informational',
        message: 'Margaret did not confirm medication taken during the 10/3 call.',
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      },
    ])
    if (error) throw new Error(`alerts insert failed: ${error.message}`)
    console.log('   ✅ Inserted 2 alerts')
  }

  // ── 6. realtime_notifications ───────────────────────────────────
  console.log('\n6. realtime_notifications')

  const { count: existingNotifCount } = await admin
    .from('realtime_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  if ((existingNotifCount ?? 0) >= 2) {
    console.log(`   ↩  Already have ${existingNotifCount} notifications, skipping`)
  } else {
    const { error } = await admin.from('realtime_notifications').insert([
      {
        member_id: memberId!,
        type: 'new_alert',
        title: 'Mood Drop Alert',
        body: 'Margaret\'s mood has been declining. Consider scheduling a video call.',
        severity: 'concern',
        read: false,
      },
      {
        member_id: memberId!,
        type: 'call_completed',
        title: 'Call Completed',
        body: 'Today\'s check-in call with Margaret has completed.',
        severity: 'info',
        read: true,
        read_at: new Date().toISOString(),
      },
    ])
    if (error) throw new Error(`realtime_notifications insert failed: ${error.message}`)
    console.log('   ✅ Inserted 2 notifications')
  }

  // ── 7. care navigator + assignment ─────────────────────────────
  console.log('\n7. care navigator + assignment')

  let navigatorId: string
  const { data: existingNav } = await admin
    .from('care_navigators')
    .select('id')
    .eq('email', NAV_EMAIL)
    .maybeSingle()

  if (existingNav) {
    navigatorId = existingNav.id
    console.log(`   ↩  Navigator already exists (${navigatorId})`)
  } else {
    const { data: nav, error } = await admin
      .from('care_navigators')
      .insert({
        full_name: 'Sarah Williams',
        email: NAV_EMAIL,
        phone: '+15550007890',
        certifications: ['RN', 'Geriatric Care Manager'],
        caseload_limit: 150,
        is_active: true,
      })
      .select('id')
      .maybeSingle()
    if (error || !nav) throw new Error(`care_navigators insert failed: ${error?.message}`)
    navigatorId = nav.id
    console.log(`   ✅ Created navigator Sarah Williams (${navigatorId})`)
  }

  const { count: existingAssignCount } = await admin
    .from('navigator_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('navigator_id', navigatorId)

  if ((existingAssignCount ?? 0) === 0) {
    const { error } = await admin.from('navigator_assignments').insert({
      member_id: memberId!,
      navigator_id: navigatorId,
      is_primary: true,
    })
    if (error) throw new Error(`navigator_assignments insert failed: ${error.message}`)
    console.log('   ✅ Created navigator assignment')
  } else {
    console.log('   ↩  Assignment already exists')
  }

  // ── 8. family_task_items (3 tasks) ──────────────────────────────
  console.log('\n8. family_task_items')

  const { count: existingTaskCount } = await admin
    .from('family_task_items')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  if ((existingTaskCount ?? 0) >= 3) {
    console.log(`   ↩  Already have ${existingTaskCount} tasks, skipping`)
  } else {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const { error } = await admin.from('family_task_items').insert([
      {
        member_id: memberId!,
        created_by: familyMemberId,
        title: 'Schedule follow-up with Dr. Lin about mood changes',
        task_type: 'medical',
        due_date: tomorrow.toISOString().split('T')[0],
        completed: false,
      },
      {
        member_id: memberId!,
        created_by: familyMemberId,
        title: 'Check medication supply — refill needed by end of week',
        task_type: 'medication',
        due_date: nextWeek.toISOString().split('T')[0],
        completed: false,
      },
      {
        member_id: memberId!,
        created_by: familyMemberId,
        title: 'Plan family video call — Margaret asked about grandchildren',
        task_type: 'social',
        due_date: nextWeek.toISOString().split('T')[0],
        completed: true,
        completed_at: new Date().toISOString(),
      },
    ])
    if (error) throw new Error(`family_task_items insert failed: ${error.message}`)
    console.log('   ✅ Inserted 3 tasks')
  }

  // ── Done ────────────────────────────────────────────────────────
  console.log('\n── Seed complete ────────────────────────────────────────')
  console.log(`   Member:  Margaret Chen (${memberId})`)
  console.log(`   Login:   ${TEST_EMAIL}`)
  console.log(`   Password: ${TEST_PASSWORD}`)
}

seed().catch((e) => {
  console.error('\n❌ Seed failed:', e.message ?? e)
  process.exit(1)
})
