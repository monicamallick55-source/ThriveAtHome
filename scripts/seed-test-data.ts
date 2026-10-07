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
const NAV_PASSWORD = 'TestPassword123!'

// Mood arc: 25 calls total (oldest to newest).
// First 11: older historical calls for load-more testing.
// Last 14: the canonical 14-call arc (8,8,7,8,7,6,7,6,5,6,5,5,4,5).
const MOOD_ARC = [9, 8, 9, 8, 7, 9, 8, 8, 7, 9, 8, 8, 8, 7, 8, 7, 6, 7, 6, 5, 6, 5, 5, 4, 5]

async function seed(): Promise<void> {
  console.log('── Seed: ThriveAtHome test data ────────────────────────')

  // ── 1. Auth user ────────────────────────────────────────────────
  console.log('\n1. Auth user')
  let authUserId: string

  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u: any) => u.email === TEST_EMAIL)

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

  if ((existingCallCount ?? 0) >= 25) {
    console.log(`   ↩  Already have ${existingCallCount} calls, skipping`)
  } else {
    const now = new Date()
    const callsToInsert = MOOD_ARC.map((moodScore: any, i: number) => {
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
    console.log(`   ✅ Inserted ${MOOD_ARC.length} calls (mood arc: ${MOOD_ARC.join(',')})`)
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

  // ── 7. navigator auth user, care_navigators row, assignment ────
  console.log('\n7. navigator auth user + care_navigators + assignment')

  // 7a. Navigator auth user
  let navAuthUserId: string
  const existingNavUser = existingUsers?.users.find((u: any) => u.email === NAV_EMAIL)
  if (existingNavUser) {
    navAuthUserId = existingNavUser.id
    console.log(`   ↩  Navigator auth user already exists (${navAuthUserId})`)
  } else {
    const { data: newNavUser, error } = await admin.auth.admin.createUser({
      email: NAV_EMAIL,
      password: NAV_PASSWORD,
      email_confirm: true,
    })
    if (error || !newNavUser.user) throw new Error(`Navigator auth user create failed: ${error?.message}`)
    navAuthUserId = newNavUser.user.id
    console.log(`   ✅ Created navigator auth user: ${NAV_EMAIL} (${navAuthUserId})`)
  }

  // 7b. family_members row with role='navigator'
  const { data: existingNavFm } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', navAuthUserId)
    .maybeSingle()
  if (existingNavFm) {
    console.log(`   ↩  Navigator family_members row exists (${existingNavFm.id})`)
  } else {
    const { error } = await admin.from('family_members').insert({
      supabase_auth_id: navAuthUserId,
      full_name: 'Sarah Williams',
      email: NAV_EMAIL,
      relationship: 'navigator',
      role: 'navigator',
    })
    if (error) throw new Error(`Navigator family_members insert failed: ${error.message}`)
    console.log(`   ✅ Created navigator family_members row`)
  }

  // 7c. care_navigators row linked to auth user
  let navigatorId: string
  const { data: existingNav } = await admin
    .from('care_navigators')
    .select('id, supabase_auth_id')
    .eq('email', NAV_EMAIL)
    .maybeSingle()

  if (existingNav) {
    navigatorId = existingNav.id
    if (!existingNav.supabase_auth_id) {
      await admin
        .from('care_navigators')
        .update({ supabase_auth_id: navAuthUserId })
        .eq('id', navigatorId)
      console.log(`   ✅ Linked care_navigator to auth user (${navigatorId})`)
    } else {
      console.log(`   ↩  care_navigator already exists and linked (${navigatorId})`)
    }
  } else {
    const { data: nav, error } = await admin
      .from('care_navigators')
      .insert({
        supabase_auth_id: navAuthUserId,
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

  // 7d. navigator_assignment
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

  // 7e. navigator_task (for Phase 15 tasks section testing)
  const { count: existingNavTaskCount } = await admin
    .from('navigator_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('navigator_id', navigatorId)
    .eq('completed', false)

  if ((existingNavTaskCount ?? 0) === 0) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const { error } = await admin.from('navigator_tasks').insert([
      {
        member_id: memberId!,
        navigator_id: navigatorId,
        task_type: 'follow_up',
        description: 'Follow up with Margaret about her recent mood decline — schedule a care check-in call.',
        priority: 'high',
        due_by: tomorrow.toISOString(),
        completed: false,
      },
      {
        member_id: memberId!,
        navigator_id: navigatorId,
        task_type: 'medication_review',
        description: 'Confirm Metformin refill was completed — Margaret mentioned supply was running low.',
        priority: 'medium',
        due_by: tomorrow.toISOString(),
        completed: false,
      },
    ])
    if (error) throw new Error(`navigator_tasks insert failed: ${error.message}`)
    console.log('   ✅ Created 2 navigator tasks')
  } else {
    console.log('   ↩  Navigator tasks already exist')
  }

  // 7f. urgent alert for alert queue testing (Phase 15)
  const { count: existingUrgentCount } = await admin
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('severity', 'urgent')
    .eq('acknowledged', false)

  if ((existingUrgentCount ?? 0) === 0) {
    const { error } = await admin.from('alerts').insert({
      member_id: memberId!,
      alert_type: 'wellness_drift',
      severity: 'urgent',
      message: 'Margaret\'s mood scores have fallen below 5 for 3 consecutive calls — immediate follow-up recommended.',
      acknowledged: false,
    })
    if (error) throw new Error(`urgent alert insert failed: ${error.message}`)
    console.log('   ✅ Created urgent alert for alert queue')
  } else {
    console.log('   ↩  Urgent alert already exists')
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

  // ── 9. Test volunteer (Phase 31) ────────────────────────────────
  console.log('\n9. Test volunteer')
  const VOL_EMAIL = 'test-volunteer@thriveathome.dev'
  const VOL_PASSWORD = 'TestPassword123!'

  let volAuthUserId: string
  const existingVolUser = existingUsers?.users.find((u: any) => u.email === VOL_EMAIL)
  if (existingVolUser) {
    volAuthUserId = existingVolUser.id
    console.log(`   ↩  Auth user exists: ${VOL_EMAIL} (${volAuthUserId})`)
  } else {
    const { data: newVolUser, error } = await admin.auth.admin.createUser({
      email: VOL_EMAIL, password: VOL_PASSWORD, email_confirm: true,
    })
    if (error || !newVolUser.user) throw new Error(`Volunteer auth user create failed: ${error?.message}`)
    volAuthUserId = newVolUser.user.id
    console.log(`   ✅ Created volunteer auth user: ${VOL_EMAIL} (${volAuthUserId})`)
  }

  // family_members row with role='volunteer' (middleware looks here for role)
  const { data: existingVolFm } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', volAuthUserId)
    .maybeSingle()
  if (!existingVolFm) {
    const { error } = await admin.from('family_members').insert({
      supabase_auth_id: volAuthUserId,
      full_name: 'James Rivera',
      email: VOL_EMAIL,
      relationship: 'volunteer',
      role: 'volunteer',
    })
    if (error) {
      // Likely needs migration 006_volunteer_role.sql (ALTER TYPE user_role ADD VALUE 'volunteer')
      console.log(`   ⚠️  Skipped family_members row — run migration 006_volunteer_role.sql first: ${error.message}`)
      console.log('   ℹ️  Middleware will route volunteer via volunteers.supabase_auth_id (fallback active)')
    } else {
      console.log('   ✅ Created volunteer family_members row (role=volunteer)')
    }
  } else {
    console.log('   ↩  Volunteer family_members already exists')
  }

  // volunteers table row (active status so they can be matched)
  const { data: existingVol } = await admin
    .from('volunteers')
    .select('id')
    .eq('email', VOL_EMAIL)
    .maybeSingle()
  let volunteerRowId: string
  if (existingVol) {
    volunteerRowId = existingVol.id
    // Ensure supabase_auth_id is linked
    await admin.from('volunteers').update({ supabase_auth_id: volAuthUserId }).eq('id', volunteerRowId)
    console.log(`   ↩  volunteers row already exists (${volunteerRowId})`)
  } else {
    const { data: vol, error } = await admin.from('volunteers').insert({
      supabase_auth_id: volAuthUserId,
      full_name: 'James Rivera',
      email: VOL_EMAIL,
      phone: '+15550003456',
      city: 'Springfield',
      state: 'MA',
      languages: ['english', 'spanish'],
      availability_days: ['saturday', 'sunday'],
      hours_per_week: '3-5',
      service_types: ['phone_call', 'in_person_visit', 'grocery_help'],
      interests: ['gardening', 'cooking', 'music'],
      why_volunteer: 'I want to give back to my community and support seniors living independently.',
      status: 'active',
      total_hours_logged: 0,
      total_seniors_helped: 0,
    }).select('id').maybeSingle()
    if (error || !vol) throw new Error(`volunteers insert failed: ${error?.message}`)
    volunteerRowId = vol.id
    console.log(`   ✅ Created active volunteer James Rivera (${volunteerRowId})`)
  }

  // volunteer_match: connect James to Margaret
  const { count: existingMatchCount } = await admin
    .from('volunteer_matches')
    .select('*', { count: 'exact', head: true })
    .eq('volunteer_id', volunteerRowId)
    .eq('member_id', memberId!)
  if ((existingMatchCount ?? 0) === 0) {
    const { error } = await admin.from('volunteer_matches').insert({
      member_id: memberId!,
      volunteer_id: volunteerRowId,
      match_score: 65,
      match_reasons: ['Same city', 'Shared interests: gardening, cooking, music'],
      status: 'matched',
      matched_at: new Date().toISOString(),
    })
    if (error) throw new Error(`volunteer_matches insert failed: ${error.message}`)
    console.log('   ✅ Created volunteer_match: James ↔ Margaret')
  } else {
    console.log('   ↩  volunteer_match already exists')
  }

  // ── 10. Test student volunteer (Phase 32) ───────────────────────
  console.log('\n10. Test student volunteer')
  const STUDENT_EMAIL = 'test-student@thriveathome.dev'
  const STUDENT_PASSWORD = 'TestPassword123!'

  let studentAuthUserId: string | undefined
  const existingStudentUser = existingUsers?.users.find((u: any) => u.email === STUDENT_EMAIL)
  if (existingStudentUser) {
    studentAuthUserId = existingStudentUser.id
    console.log(`   ↩  Auth user exists: ${STUDENT_EMAIL} (${studentAuthUserId})`)
  } else {
    const { data: newStudentUser, error } = await admin.auth.admin.createUser({
      email: STUDENT_EMAIL, password: STUDENT_PASSWORD, email_confirm: true,
    })
    if (error || !newStudentUser.user) {
      console.log(`   ⚠️  Student auth user create failed: ${error?.message}`)
    } else {
      studentAuthUserId = newStudentUser.user.id
      console.log(`   ✅ Created student auth user: ${STUDENT_EMAIL} (${studentAuthUserId})`)
    }
  }

  if (studentAuthUserId) {
    const { data: existingSv } = await admin
      .from('student_volunteers')
      .select('id')
      .eq('supabase_auth_id', studentAuthUserId)
      .maybeSingle()
    if (!existingSv) {
      const { error } = await admin.from('student_volunteers').insert({
        supabase_auth_id: studentAuthUserId,
        full_name: 'Priya Patel',
        email: STUDENT_EMAIL,
        university_name: 'State University',
        major: 'Social Work',
        graduation_year: 2027,
        interests: ['gardening', 'cooking'],
        languages: ['english', 'hindi'],
        total_hours_logged: 0,
        status: 'active',
      })
      if (error) {
        console.log(`   ⚠️  student_volunteers insert failed (run migration 008_students.sql first): ${error.message}`)
      } else {
        console.log('   ✅ Created student volunteer: Priya Patel (State University)')
      }
    } else {
      console.log('   ↩  student_volunteers row already exists')
    }
  }

  // ── Done ────────────────────────────────────────────────────────
  console.log('\n── Seed complete ────────────────────────────────────────')
  console.log(`   Member:  Margaret Chen (${memberId})`)
  console.log(`   Family login:    ${TEST_EMAIL} / ${TEST_PASSWORD}`)
  console.log(`   Navigator login: ${NAV_EMAIL} / ${NAV_PASSWORD}`)
  console.log(`   Volunteer login: ${VOL_EMAIL} / ${VOL_PASSWORD}`)
  console.log(`   Student login:   ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`)
}

seed().catch((e) => {
  console.error('\n❌ Seed failed:', e.message ?? e)
  process.exit(1)
})
