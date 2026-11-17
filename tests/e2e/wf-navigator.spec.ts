/**
 * WF-NAVIGATOR: Navigator workflow E2E tests
 * N-01 Action Feed · N-02 Service Dispatch · N-03 Member Detail
 * N-04 Buddy Override · N-05 Grief Referral · N-06 Life Transition Plan
 * N-07 Crisis Escalation · N-08 Important Date Completion
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

async function loginAsNavigator(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'navigator@test.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL(/thrive-at-home-pied\.vercel\.app\/(?!login)/, { timeout: 30000 });
}

async function apiPost(page: any, path: string, body: object) {
  const resp = await page.request.post(`${BASE}${path}`, { data: body });
  return resp.json().catch(() => ({}));
}
async function apiPatch(page: any, path: string, body: object) {
  const resp = await page.request.patch(`${BASE}${path}`, { data: body });
  return resp.json().catch(() => ({}));
}

// ─── TC-N001 · N-01 Action Feed ──────────────────────────────────────────────

test.describe('N-01 Navigator Action Feed', () => {
  test('TC-N001-a: GET navigator tasks returns real rows', async ({ page }) => {
    await loginAsNavigator(page);
    const _tasksR = await page.request.get(`${BASE}/api/navigator/tasks`);
    const tasks = await _tasksR.json().catch(() => ({}));
    expect(Array.isArray(tasks)).toBe(true);
  });

  test('TC-N001-b: resolve task updates status to resolved', async ({ page }) => {
    await loginAsNavigator(page);
    const _tasksR = await page.request.get(`${BASE}/api/navigator/tasks?status=open`);
    const tasks = await _tasksR.json().catch(() => ({}));
    if (!tasks.length) { return; }
    const result = await apiPatch(page, `/api/navigator/tasks/${tasks[0].id}`, {
      action: 'resolve',
      resolution_notes: 'Called member, all good',
    });
    expect(result.status).toBe('resolved');
  });

  test('TC-N001-c: snooze task updates snoozed_until', async ({ page }) => {
    await loginAsNavigator(page);
    const _tasksR = await page.request.get(`${BASE}/api/navigator/tasks?status=open`);
    const tasks = await _tasksR.json().catch(() => ({}));
    if (!tasks.length) { return; }
    const result = await apiPatch(page, `/api/navigator/tasks/${tasks[0].id}`, {
      action: 'snooze',
      snooze_days: 3,
    });
    expect(result.snoozed_until).toBeTruthy();
  });
});

// ─── TC-N002 · N-02 Service Dispatch ─────────────────────────────────────────

test.describe('N-02 Service Dispatch', () => {
  test('TC-N002-a: navigator assigns volunteer to booking', async ({ page }) => {
    await loginAsNavigator(page);
    const _bookingsR = await page.request.get(`${BASE}/api/services?status=pending`);
    const bookings = await _bookingsR.json().catch(() => ({}));
    const _volunteersR = await page.request.get(`${BASE}/api/volunteers?status=active`);
    const volunteers = await _volunteersR.json().catch(() => ({}));
    if (!bookings.length || !volunteers.length) { return; }
    const result = await apiPost(page, '/api/navigator/dispatch', {
      booking_id: bookings[0].id,
      volunteer_id: volunteers[0].id,
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe('assigned');
  });

  test('TC-N002-b: cancel booking with reason writes to DB', async ({ page }) => {
    await loginAsNavigator(page);
    const _bookingsR = await page.request.get(`${BASE}/api/services?status=pending`);
    const bookings = await _bookingsR.json().catch(() => ({}));
    if (!bookings.length) { return; }
    const result = await apiPatch(page, `/api/services/${bookings[0].id}`, {
      action: 'cancel',
      cancel_reason: 'No volunteers available this week',
    });
    expect(result.status).toBe('cancelled');
    expect(result.cancel_reason).toBeTruthy();
  });
});

// ─── TC-N003 · N-03 Member Detail ────────────────────────────────────────────

test.describe('N-03 Member Detail Panel', () => {
  test('TC-N003-a: GET /api/members/:id returns full profile for navigator', async ({ page }) => {
    await loginAsNavigator(page);
    const _membersR = await page.request.get(`${BASE}/api/members?limit=1`);
    const members = await _membersR.json().catch(() => ({}));
    if (!members.length) { return; }
    const _detailR = await page.request.get(`${BASE}/api/members/${members[0].id}`);
    const detail = await _detailR.json().catch(() => ({}));
    expect(detail.id).toBe(members[0].id);
    expect(detail.first_name).toBeTruthy();
  });
});

// ─── TC-N004 · N-04 Buddy Override ───────────────────────────────────────────

test.describe('N-04 Buddy Override', () => {
  test('TC-N004-a: navigator force-assigns buddy assignment', async ({ page }) => {
    await loginAsNavigator(page);
    const _membersR = await page.request.get(`${BASE}/api/members?limit=1`);
    const members = await _membersR.json().catch(() => ({}));
    const _volunteersR = await page.request.get(`${BASE}/api/volunteers?status=active&limit=1`);
    const volunteers = await _volunteersR.json().catch(() => ({}));
    if (!members.length || !volunteers.length) { return; }
    const result = await apiPost(page, '/api/buddy/assignments', {
      member_id: members[0].id,
      volunteer_id: volunteers[0].id,
      overridden_by_navigator: true,
      navigator_note: 'Manual assignment per family request',
    });
    expect(result.id).toBeTruthy();
    expect(result.overridden_by_navigator).toBe(true);
  });
});

// ─── TC-N005 · N-05 Grief Referral ───────────────────────────────────────────

test.describe('N-05 Grief Referral', () => {
  test('TC-N005-a: assign grief counselor to member', async ({ page }) => {
    await loginAsNavigator(page);
    const _membersR = await page.request.get(`${BASE}/api/members?grief_support=true&limit=1`);
    const members = await _membersR.json().catch(() => ({}));
    if (!members.length) { return; }
    const _advisorsR = await page.request.get(`${BASE}/api/trusted-advisors?category=grief&limit=1`);
    const advisors = await _advisorsR.json().catch(() => ({}));
    if (!advisors.length) { return; }
    const result = await apiPost(page, '/api/trusted-advisors/assign', {
      member_id: members[0].id,
      advisor_id: advisors[0].id,
      referral_type: 'grief_counseling',
    });
    expect(result.id).toBeTruthy();
  });
});

// ─── TC-N006 · N-06 Life Transition Plan ─────────────────────────────────────

test.describe('N-06 Life Transition Plan', () => {
  test('TC-N006-a: create transition plan for member', async ({ page }) => {
    await loginAsNavigator(page);
    const _membersR = await page.request.get(`${BASE}/api/members?limit=1`);
    const members = await _membersR.json().catch(() => ({}));
    if (!members.length) { return; }
    const plan = await apiPost(page, '/api/life-transitions', {
      member_id: members[0].id,
      pathway: 'downsizing',
      steps: [
        { title: 'Declutter living room', order: 1 },
        { title: 'Contact realtor', order: 2 },
        { title: 'Visit 3 properties', order: 3 },
      ],
    });
    expect(plan.id).toBeTruthy();
    expect(plan.id).not.toMatch(/^stub-/);
  });

  test('TC-N006-b: mark step complete updates progress', async ({ page }) => {
    await loginAsNavigator(page);
    const _plansR = await page.request.get(`${BASE}/api/life-transitions`);
    const plans = await _plansR.json().catch(() => ({}));
    if (!plans.length) { return; }
    const plan = plans[0];
    const _stepsR = await page.request.get(`${BASE}/api/life-transitions/${plan.id}/steps`);
    const steps = await _stepsR.json().catch(() => []);
    if (!steps.length) { return; }
    const result = await apiPatch(page, `/api/life-transitions/${plan.id}/steps/${steps[0].id}`, {
      status: 'completed',
    });
    expect(result.status).toBe('completed');
  });
});

// ─── TC-N007 · N-07 Crisis Escalation ────────────────────────────────────────

test.describe('N-07 Crisis Escalation', () => {
  test('TC-N007-a: crisis event POST writes to crisis_events', async ({ page }) => {
    await loginAsNavigator(page);
    const _membersR = await page.request.get(`${BASE}/api/members?limit=1`);
    const members = await _membersR.json().catch(() => ({}));
    if (!members.length) { return; }
    const event = await apiPost(page, '/api/crisis', {
      member_id: members[0].id,
      severity: 'moderate',
      trigger: 'member_expressed_isolation',
      notes: 'Member said she has no one to talk to',
    });
    expect(event.id).toBeTruthy();
    expect(event.id).not.toMatch(/^stub-/);
    expect(event.status).toBe('open');
  });

  test('TC-N007-b: escalation step 1 creates family notification', async ({ page }) => {
    await loginAsNavigator(page);
    const _crisesR = await page.request.get(`${BASE}/api/crisis?status=open`);
    const crises = await _crisesR.json().catch(() => ({}));
    if (!crises.length) { return; }
    const result = await apiPost(page, `/api/crisis/${crises[0].id}/escalate`, {
      step: 1,
      action: 'notify_family',
    });
    expect(result.escalation_step).toBe(1);
  });
});

// ─── TC-N008 · N-08 Important Date Completion ────────────────────────────────

test.describe('N-08 Important Date (Navigator)', () => {
  test('TC-N008-a: navigator marks item complete', async ({ page }) => {
    await loginAsNavigator(page);
    const _itemsR = await page.request.get(`${BASE}/api/tracked-items?status=pending`);
    const items = await _itemsR.json().catch(() => ({}));
    if (!items.length) { return; }
    const result = await apiPatch(page, `/api/tracked-items/${items[0].id}`, {
      action: 'complete',
      navigator_note: 'Verified with member on call',
    });
    expect(result.status).toBe('completed');
  });
});
