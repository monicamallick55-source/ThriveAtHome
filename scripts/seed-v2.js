const https = require('https');

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'qdniskppkfqjmtpkftdt.supabase.co',
      path,
      method,
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation,resolution=ignore-duplicates',
      }
    };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function get(table, query='') {
  return req('GET', `/rest/v1/${table}?${query}&limit=5`);
}

function upsert(table, data) {
  return req('POST', `/rest/v1/${table}`, Array.isArray(data) ? data : [data]);
}

function authGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'qdniskppkfqjmtpkftdt.supabase.co',
      path: `/auth/v1/admin/${path}`,
      method: 'GET',
      headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
    };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    r.on('error', reject);
    r.end();
  });
}

async function main() {
  console.log('🌱 Fetching user IDs...');

  // Get all auth users (paginate)
  let allUsers = [];
  for (let page = 1; page <= 5; page++) {
    const res = await authGet(`users?page=${page}&per_page=50`);
    const batch = res.users || [];
    allUsers = allUsers.concat(batch);
    if (batch.length < 50) break;
  }
  const find = (email) => allUsers.find(u => u.email === email);

  const memberUser    = find('member@test.com');
  const volunteerUser = find('volunteer@test.com');
  const navigatorUser = find('navigator@test.com');
  const adminUser     = find('admin@test.com');

  console.log('Auth users:', {
    member: memberUser?.id?.slice(0,8),
    volunteer: volunteerUser?.id?.slice(0,8),
    navigator: navigatorUser?.id?.slice(0,8),
    admin: adminUser?.id?.slice(0,8),
  });

  // Get DB row IDs using supabase_auth_id
  const mRes = await get('members', `supabase_auth_id=eq.${memberUser?.id}&select=id`);
  const vRes = await get('volunteers', `supabase_auth_id=eq.${volunteerUser?.id}&select=id`);
  const memberId    = mRes.body?.[0]?.id;
  const volunteerId = vRes.body?.[0]?.id;
  console.log('DB row IDs:', { memberId: memberId?.slice(0,8), volunteerId: volunteerId?.slice(0,8) });

  if (!memberId || !volunteerId) {
    console.error('❌ Could not find member/volunteer DB rows — check supabase_auth_id column');
    return;
  }

  let ok = 0, fail = 0;
  async function ins(label, table, data) {
    const r = await upsert(table, data);
    if (r.status >= 200 && r.status < 300) {
      console.log(`  ✅ ${label}`);
      ok++;
    } else {
      console.log(`  ⚠ ${label}: [${r.status}] ${JSON.stringify(r.body).slice(0,120)}`);
      fail++;
    }
  }

  // ── buddy_assignments: 2x pending_volunteer + 1x active ──────────────────
  console.log('\n── buddy_assignments ──');
  const now = new Date().toISOString();
  await ins('assign pending-1', 'buddy_assignments', { member_id: memberId, volunteer_id: volunteerId, status: 'pending_volunteer', assigned_at: now });
  await ins('assign pending-2', 'buddy_assignments', { member_id: memberId, volunteer_id: volunteerId, status: 'pending_volunteer', assigned_at: now });
  await ins('assign active-1',  'buddy_assignments', { member_id: memberId, volunteer_id: volunteerId, status: 'active', assigned_at: now });

  // ── service_bookings: pending + accepted ──────────────────────────────────
  console.log('\n── service_bookings ──');
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  await ins('booking pending', 'service_bookings', { member_id: memberId, service_type: 'transportation', status: 'pending', scheduled_at: tomorrow, notes: 'Seed: doctor appointment' });
  await ins('booking accepted', 'service_bookings', { member_id: memberId, partner_id: volunteerId, service_type: 'transportation', status: 'accepted', scheduled_at: new Date(Date.now() + 172800000).toISOString(), notes: 'Seed: accepted ride' });

  // ── volunteer_training_modules ────────────────────────────────────────────
  console.log('\n── volunteer_training_modules ──');
  await ins('training module', 'volunteer_training_modules', { slug: 'buddy-call-basics', title: 'Buddy Call Best Practices', description: 'How to run effective buddy calls', duration_min: 30, required: true, sort_order: 1, active: true });

  // ── ride_bookings: requested ──────────────────────────────────────────────
  console.log('\n── ride_bookings ──');
  await ins('ride requested', 'ride_bookings', { member_id: memberId, pickup_address: '123 Main St SF', dropoff_address: '456 Oak Ave SF', pickup_time: tomorrow, status: 'requested', notes: 'Seed ride' });

  // ── events ────────────────────────────────────────────────────────────────
  console.log('\n── events ──');
  await ins('event', 'events', { title: 'Weekly Coffee Chat', description: 'Virtual social hour', event_type: 'social', event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], event_time: '10:00', timezone: 'America/Los_Angeles', duration_minutes: 60, format: 'virtual', status: 'published', max_capacity: 50 });

  // ── campaigns: active ─────────────────────────────────────────────────────
  console.log('\n── campaigns ──');
  await ins('campaign active', 'campaigns', { creator_id: adminUser?.id, title: 'Holiday Warmth Fund', description: 'Help seniors stay warm', campaign_type: 'fundraiser', goal_cents: 250000, raised_cents: 12500, status: 'active', starts_at: now, ends_at: new Date(Date.now() + 30*86400000).toISOString(), is_public: true });

  // ── tracked_items: pending ────────────────────────────────────────────────
  console.log('\n── tracked_items ──');
  await ins('tracked item', 'tracked_items', { member_id: memberId, item_type: 'appointment', category: 'health', item_name: 'Annual checkup', expiration_or_appointment_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], status: 'active', created_by: navigatorUser?.id });

  // ── navigator_tasks: open (completed=false) ────────────────────────────────
  console.log('\n── navigator_tasks ──');
  await ins('nav task open-1', 'navigator_tasks', { member_id: memberId, navigator_id: navigatorUser?.id, task_type: 'wellness_check', description: 'Seed: wellness check', priority: 'medium', completed: false, due_by: tomorrow });
  await ins('nav task open-2', 'navigator_tasks', { member_id: memberId, navigator_id: navigatorUser?.id, task_type: 'wellness_check', description: 'Seed: wellness check 2', priority: 'low', completed: false, due_by: tomorrow });

  // ── life_transitions + steps ──────────────────────────────────────────────
  console.log('\n── life_transitions ──');
  const ltRes = await upsert('life_transitions', { member_id: memberId, transition_type: 'retirement', notes: 'Seed retirement plan', status: 'active', pathway: 'encore_career', started_at: now });
  const planId = ltRes.body?.[0]?.id;
  console.log(`  ✅ life_transitions: ${planId?.slice(0,8)}`);
  if (planId) {
    await ins('transition step', 'life_transition_steps', { plan_id: planId });
  }

  // ── crisis_events: open ───────────────────────────────────────────────────
  console.log('\n── crisis_events ──');
  await ins('crisis open', 'crisis_events', { member_id: memberId, source: 'navigator', status: 'open', escalation_step: 1, created_by: navigatorUser?.id });

  // ── trusted_advisors: grief ───────────────────────────────────────────────
  console.log('\n── trusted_advisors ──');
  await ins('advisor grief', 'trusted_advisors', { full_name: 'Dr. Seed Counselor', advisor_type: 'grief_counselor', bio: 'Specialist in bereavement', listing_status: 'active', thrive_verified: true, accepts_new_clients: true });

  // Update member grief_support = true
  console.log('\n── member grief_support ──');
  const upd = await req('PATCH', `/rest/v1/members?id=eq.${memberId}`, { grief_support: true });
  console.log(`  ${upd.status < 300 ? '✅' : '⚠'} grief_support updated [${upd.status}]`);

  // ── billing_invoices ──────────────────────────────────────────────────────
  console.log('\n── billing_invoices ──');
  await ins('invoice', 'billing_invoices', { stripe_invoice_id: 'in_seed_test_001', amount: 49900, status: 'paid', pdf_url: 'https://example.com/seed-invoice.pdf' });

  // ── corporate_volunteer_programs ─────────────────────────────────────────
  console.log('\n── corporate_volunteer_programs ──');
  const corpRes = await get('members', `id=eq.${memberId}&select=corporate_account_id`);
  const corpId = corpRes.body?.[0]?.corporate_account_id;
  if (corpId) {
    await ins('corp vol program', 'corporate_volunteer_programs', { employer_account_id: corpId, program_name: 'Employee Volunteer Initiative', status: 'active', tier: 'standard' });
  } else {
    console.log('  ⚠ no corporate_account_id on member — skipping');
  }

  // ── university_affiliates ─────────────────────────────────────────────────
  console.log('\n── university_affiliates ──');
  await ins('university', 'university_affiliates', { name: 'State University Seed', status: 'active' });

  console.log(`\n🏁 Done: ${ok} inserted, ${fail} failed\n`);
}

main().catch(console.error);
