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
  await page.waitForURL(`${BASE}/dashboard**`);
}

async function apiPost(page: any, path: string, body: object) {
  return page.evaluate(
    async ([p, b]: [string, object]) => {
      const r = await fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b), credentials: 'include' });
      return r.json();
    }, [path, body]
  );
}
async function apiPatch(page: any, path: string, body: object) {
  return page.evaluate(
    async ([p, b]: [string, object]) => {
      const r = await fetch(p, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b), credentials: 'include' });
      return r.json();
    }, [path, body]
  );
}

// ─── TC-N001 · N-01 Action Feed ──────────────────────────────────────────────

test.describe('N-01 Navigator Action Feed', () => {
  test('TC-N001-a: GET navigator tasks returns real rows', async ({ page }) => {
    await loginAsNavigator(page);
    const tasks = await page.evaluate(() =>
      fetch('/api/navigator/tasks', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(tasks)).toBe(true);
  });

  test('TC-N001-b: resolve task updates status to resolved', async ({ page }) => {
    await loginAsNavigator(page);
    const tasks = await page.evaluate(() =>
      fetch('/api/navigator/tasks?status=open', { credentials: 'include' }).then(r => r.json())
    );
    if (!tasks.length) test.skip();
    const result = await apiPatch(page, `/api/navigator/tasks/${tasks[0].id}`, {
      action: 'resolve',
      resolution_notes: 'Called member, all good',
    });
    expect(result.status).toBe('resolved');
  });

  test('TC-N001-c: snooze task updates snoozed_until', async ({ page }) => {
    await loginAsNavigator(page);
    const tasks = await page.evaluate(() =>
      fetch('/api/navigator/tasks?status=open', { credentials: 'include' }).then(r => r.json())
    );
    if (!tasks.length) test.skip();
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
    const bookings = await page.evaluate(() =>
      fetch('/api/services?status=pending', { credentials: 'include' }).then(r => r.json())
    );
    const volunteers = await page.evaluate(() =>
      fetch('/api/volunteers?status=active', { credentials: 'include' }).then(r => r.json())
    );
    if (!bookings.length || !volunteers.length) test.skip();
    const result = await apiPost(page, '/api/navigator/dispatch', {
      booking_id: bookings[0].id,
      volunteer_id: volunteers[0].id,
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe('assigned');
  });

  test('TC-N002-b: cancel booking with reason writes to DB', async ({ page }) => {
    await loginAsNavigator(page);
    const bookings = await page.evaluate(() =>
      fetch('/api/services?status=pending', { credentials: 'include' }).then(r => r.json())
    );
    if (!bookings.length) test.skip();
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
    const members = await page.evaluate(() =>
      fetch('/api/members?limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!members.length) test.skip();
    const detail = await page.evaluate((id: string) =>
      fetch(`/api/members/${id}`, { credentials: 'include' }).then(r => r.json()),
      members[0].id
    );
    expect(detail.id).toBe(members[0].id);
    expect(detail.first_name).toBeTruthy();
  });
});

// ─── TC-N004 · N-04 Buddy Override ───────────────────────────────────────────

test.describe('N-04 Buddy Override', () => {
  test('TC-N004-a: navigator force-assigns buddy assignment', async ({ page }) => {
    await loginAsNavigator(page);
    const members = await page.evaluate(() =>
      fetch('/api/members?limit=1', { credentials: 'include' }).then(r => r.json())
    );
    const volunteers = await page.evaluate(() =>
      fetch('/api/volunteers?status=active&limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!members.length || !volunteers.length) test.skip();
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
    const members = await page.evaluate(() =>
      fetch('/api/members?grief_support=true&limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!members.length) test.skip();
    const advisors = await page.evaluate(() =>
      fetch('/api/trusted-advisors?category=grief&limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!advisors.length) test.skip();
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
    const members = await page.evaluate(() =>
      fetch('/api/members?limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!members.length) test.skip();
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
    const plans = await page.evaluate(() =>
      fetch('/api/life-transitions', { credentials: 'include' }).then(r => r.json())
    );
    if (!plans.length) test.skip();
    const plan = plans[0];
    const steps = await page.evaluate((id: string) =>
      fetch(`/api/life-transitions/${id}/steps`, { credentials: 'include' }).then(r => r.json()),
      plan.id
    );
    if (!steps.length) test.skip();
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
    const members = await page.evaluate(() =>
      fetch('/api/members?limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!members.length) test.skip();
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
    const crises = await page.evaluate(() =>
      fetch('/api/crisis?status=open', { credentials: 'include' }).then(r => r.json())
    );
    if (!crises.length) test.skip();
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
    const items = await page.evaluate(() =>
      fetch('/api/tracked-items?status=pending', { credentials: 'include' }).then(r => r.json())
    );
    if (!items.length) test.skip();
    const result = await apiPatch(page, `/api/tracked-items/${items[0].id}`, {
      action: 'complete',
      navigator_note: 'Verified with member on call',
    });
    expect(result.status).toBe('completed');
  });
});
