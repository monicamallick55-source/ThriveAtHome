/**
 * seed-test-data.ts
 * Seeds all data needed to convert 19 skipped E2E tests to passing.
 * Run: npx ts-node --project tsconfig.json scripts/seed-test-data.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function upsertOrSkip(table: string, data: object, conflictCol = 'id') {
  const { data: res, error } = await sb.from(table).upsert(data, { onConflict: conflictCol, ignoreDuplicates: true }).select().single();
  if (error) console.warn(`  ⚠ ${table}:`, error.message);
  else console.log(`  ✅ ${table}: ${(res as any)?.id || JSON.stringify(res).slice(0, 60)}`);
  return res;
}

async function main() {
  console.log('\n🌱 Seeding test data for skipped E2E tests...\n');

  // ── 1. Lookup user IDs we need ─────────────────────────────────────────────
  const { data: { users } } = await (sb.auth.admin as any).listUsers({ page: 1, perPage: 200 });
  const find = (email: string) => users?.find((u: any) => u.email === email);

  const memberUser   = find('member@test.com');
  const volunteerUser = find('volunteer@test.com');
  const navigatorUser = find('navigator@test.com');
  const adminUser    = find('admin@test.com');

  console.log('Found users:', {
    member: memberUser?.id?.slice(0,8),
    volunteer: volunteerUser?.id?.slice(0,8),
    navigator: navigatorUser?.id?.slice(0,8),
    admin: adminUser?.id?.slice(0,8),
  });

  // Get member row id
  const { data: memberRow } = await sb.from('members').select('id').eq('auth_id', memberUser?.id).single();
  const memberId = memberRow?.id;
  console.log('member row id:', memberId?.slice(0,8));

  // Get volunteer row id
  const { data: volRow } = await sb.from('volunteers').select('id').eq('auth_id', volunteerUser?.id).single();
  const volunteerId = volRow?.id;
  console.log('volunteer row id:', volunteerId?.slice(0,8));

  // ── 2. buddy_assignments: need pending_volunteer (×2) + active (×1) ────────
  console.log('\n── buddy_assignments ──');
  for (let i = 0; i < 3; i++) {
    await upsertOrSkip('buddy_assignments', {
      id: `seed-assign-${i + 1}`,
      volunteer_id: volunteerId,
      member_id: memberId,
      status: i < 2 ? 'pending_volunteer' : 'active',
      assigned_at: new Date().toISOString(),
    });
  }

  // ── 3. services (service_bookings): pending + accepted ────────────────────
  console.log('\n── service_bookings ──');
  await upsertOrSkip('service_bookings', {
    id: 'seed-booking-pending-1',
    member_id: memberId,
    service_type: 'transportation',
    status: 'pending',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Seed: doctor appointment',
  });
  await upsertOrSkip('service_bookings', {
    id: 'seed-booking-accepted-1',
    member_id: memberId,
    volunteer_id: volunteerId,
    service_type: 'transportation',
    status: 'accepted',
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    notes: 'Seed: accepted ride',
  });

  // ── 4. volunteer_training modules ─────────────────────────────────────────
  console.log('\n── volunteer_training ──');
  await upsertOrSkip('volunteer_training', {
    id: 'seed-training-1',
    title: 'Buddy Call Best Practices',
    description: 'How to run effective buddy calls',
    duration_minutes: 30,
    module_order: 1,
    is_required: true,
  });

  // ── 5. ride_bookings: requested ───────────────────────────────────────────
  console.log('\n── ride_bookings ──');
  await upsertOrSkip('ride_bookings', {
    id: 'seed-ride-requested-1',
    member_id: memberId,
    status: 'requested',
    pickup_address: '123 Main St, San Francisco CA',
    dropoff_address: '456 Oak Ave, San Francisco CA',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  });

  // ── 6. communities (circles) ──────────────────────────────────────────────
  console.log('\n── communities ──');
  await upsertOrSkip('communities', {
    id: 'seed-community-1',
    name: 'Morning Walkers',
    description: 'Daily walking group for seniors',
    type: 'social',
    is_active: true,
    max_members: 20,
  }, 'id');

  // ── 7. events ─────────────────────────────────────────────────────────────
  console.log('\n── events ──');
  await upsertOrSkip('events', {
    id: 'seed-event-1',
    title: 'Weekly Coffee Chat',
    description: 'Virtual social hour',
    event_type: 'social',
    starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 90000000).toISOString(),
    is_virtual: true,
    max_attendees: 50,
    status: 'published',
  });

  // ── 8. gifts catalog ──────────────────────────────────────────────────────
  console.log('\n── gifts ──');
  await upsertOrSkip('gifts', {
    id: 'seed-gift-1',
    name: 'Greeting Card Pack',
    description: 'Set of 10 handwritten-style cards',
    price_cents: 1500,
    category: 'cards',
    is_active: true,
    stock_count: 100,
  });

  // ── 9. campaigns (active) ─────────────────────────────────────────────────
  console.log('\n── campaigns ──');
  await upsertOrSkip('campaigns', {
    id: 'seed-campaign-active-1',
    title: 'Holiday Warmth Fund',
    description: 'Help seniors stay warm this winter',
    goal_cents: 250000,
    raised_cents: 12500,
    status: 'active',
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    created_by: adminUser?.id,
  });

  // ── 10. tracked_items (pending) ────────────────────────────────────────────
  console.log('\n── tracked_items ──');
  await upsertOrSkip('tracked_items', {
    id: 'seed-tracked-1',
    member_id: memberId,
    item_type: 'birthday',
    title: "Member's Birthday",
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  // ── 11. navigator tasks (open) ─────────────────────────────────────────────
  console.log('\n── navigator_tasks ──');
  await upsertOrSkip('navigator_tasks', {
    id: 'seed-nav-task-open-1',
    member_id: memberId,
    task_type: 'wellness_check',
    status: 'open',
    priority: 'medium',
    title: 'Seed: wellness check',
    created_at: new Date().toISOString(),
  });

  // ── 12. life_transitions + steps ──────────────────────────────────────────
  console.log('\n── life_transitions ──');
  const { data: plan } = await sb.from('life_transitions').upsert({
    id: 'seed-transition-plan-1',
    member_id: memberId,
    transition_type: 'retirement',
    title: 'Seed: Retirement Transition Plan',
    status: 'active',
    created_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: true }).select().single();
  console.log('  ✅ life_transitions:', plan?.id?.slice(0,8));

  await upsertOrSkip('life_transition_steps', {
    id: 'seed-transition-step-1',
    plan_id: 'seed-transition-plan-1',
    title: 'Seed: Set up automatic bill pay',
    description: 'Enroll in automatic payments for utilities',
    step_order: 1,
    status: 'pending',
  });

  // ── 13. crisis_events (open) ───────────────────────────────────────────────
  console.log('\n── crisis_events ──');
  await upsertOrSkip('crisis_events', {
    id: 'seed-crisis-1',
    member_id: memberId,
    crisis_type: 'fall',
    severity: 'medium',
    status: 'open',
    description: 'Seed: reported a minor fall',
    reported_at: new Date().toISOString(),
  });

  // ── 14. trusted_advisors (grief category) ─────────────────────────────────
  console.log('\n── trusted_advisors ──');
  await upsertOrSkip('trusted_advisors', {
    id: 'seed-advisor-grief-1',
    name: 'Dr. Seed Counselor',
    category: 'grief',
    specialization: 'Bereavement support',
    is_active: true,
    contact_email: 'grief-counselor@seed.test',
  });

  // Update member to have grief_support flag
  if (memberId) {
    await sb.from('members').update({ grief_support: true }).eq('id', memberId);
    console.log('  ✅ members: grief_support=true for member');
  }

  // ── 15. vso_programs hours (pending_approval) ─────────────────────────────
  console.log('\n── vso_program_hours ──');
  await upsertOrSkip('vso_program_hours', {
    id: 'seed-vso-hours-1',
    volunteer_id: volunteerId,
    program_id: 'seed-vso-program-1',
    hours: 4,
    service_date: new Date().toISOString().split('T')[0],
    status: 'pending_approval',
    description: 'Seed: veteran outreach session',
  });

  // ── 16. transitions (PORT-04-b) ───────────────────────────────────────────
  console.log('\n── transitions ──');
  await upsertOrSkip('transitions', {
    id: 'seed-port-transition-1',
    member_id: memberId,
    pathway: 'part_time_work',
    goals: ['Part-time work', 'Meaningful impact'],
    status: 'active',
    created_at: new Date().toISOString(),
  });

  // ── 17. corporate_volunteer_programs ─────────────────────────────────────
  console.log('\n── corporate_volunteer_programs ──');
  await upsertOrSkip('corporate_volunteer_programs', {
    id: 'seed-corp-vol-program-1',
    org_id: 'seed-org-1',
    program_name: 'Employee Volunteer Initiative',
    target_hours: 1000,
    current_hours: 250,
    status: 'active',
    created_at: new Date().toISOString(),
  });

  // ── 18. encore_careers listings ───────────────────────────────────────────
  console.log('\n── encore_careers ──');
  await upsertOrSkip('encore_careers', {
    id: 'seed-encore-1',
    title: 'Part-Time Library Assistant',
    organization: 'San Francisco Public Library',
    description: 'Help seniors navigate digital resources',
    type: 'part_time',
    location: 'San Francisco, CA',
    status: 'active',
    posted_at: new Date().toISOString(),
  });

  // ── 19. billing/invoices for org admin ────────────────────────────────────
  console.log('\n── billing_invoices ──');
  await upsertOrSkip('billing_invoices', {
    id: 'seed-invoice-1',
    org_id: 'seed-org-1',
    stripe_invoice_id: 'in_seed_test_invoice_001',
    amount_cents: 49900,
    status: 'paid',
    invoice_date: new Date().toISOString().split('T')[0],
    pdf_url: 'https://files.stripe.com/seed-invoice.pdf',
  });

  // ── 20. org implementation checklist steps ────────────────────────────────
  console.log('\n── org_implementation_checklist ──');
  await upsertOrSkip('org_implementation_checklist', {
    id: 'seed-checklist-step-1',
    org_id: 'seed-org-1',
    step_name: 'Configure member portal',
    step_key: 'member_portal',
    status: 'pending',
    order_index: 1,
  });

  // ── 21. university affiliates (pending) ───────────────────────────────────
  console.log('\n── university_affiliates ──');
  await upsertOrSkip('university_affiliates', {
    id: 'seed-univ-affiliate-1',
    university_id: 'seed-university-1',
    student_id: volunteerUser?.id,
    affiliation_type: 'student_volunteer',
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  console.log('\n✅ All seed data inserted. Run the full test suite now.\n');
}

main().catch(console.error);
