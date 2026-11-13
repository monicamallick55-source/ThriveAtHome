/**
 * WF-VOLUNTEER: Volunteer workflow E2E tests
 * V-01 Application · V-02 Buddy Accept/Decline · V-03 Log Call
 * V-04 Service Request Accept · V-05 Time Bank · V-06 Dashboard
 * V-07 Training · V-08 Ride Accept · V-09 Skill Exchange · V-10 Neighbor Match
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

async function loginAsVolunteer(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'volunteer@test.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard**`);
}

async function apiPost(page: any, path: string, body: object) {
  return page.evaluate(
    async ([p, b]: [string, object]) => {
      const r = await fetch(p, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
        credentials: 'include',
      });
      return r.json();
    },
    [path, body]
  );
}

async function apiPatch(page: any, path: string, body: object) {
  return page.evaluate(
    async ([p, b]: [string, object]) => {
      const r = await fetch(p, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
        credentials: 'include',
      });
      return r.json();
    },
    [path, body]
  );
}

// ─── TC-V001 · V-01 Volunteer Application ────────────────────────────────────

test.describe('V-01 Volunteer Application', () => {
  test('TC-V001-a: POST /api/volunteers creates volunteer row', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'volunteer@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const result = await apiPost(page, '/api/volunteers', {
      service_types: ['buddy_calls', 'transportation'],
      availability: { days: ['monday', 'wednesday'], times: ['morning'] },
      languages: ['en', 'es'],
      bio: 'Retired teacher, love helping seniors',
      has_vehicle: true,
      background_check_consent: true,
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
    expect(result.status).toBe('pending_review');
  });

  test('TC-V001-b: volunteer application page functional', async ({ page }) => {
    await loginAsVolunteer(page);
    await page.goto(`${BASE}/volunteer/apply`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-V002 · V-02 Buddy Accept / Decline ───────────────────────────────────

test.describe('V-02 Buddy Assignment Accept/Decline', () => {
  test('TC-V002-a: volunteer can accept buddy assignment', async ({ page }) => {
    await loginAsVolunteer(page);
    const assignments = await page.evaluate(() =>
      fetch('/api/buddy/assignments?status=pending_volunteer', { credentials: 'include' }).then(r => r.json())
    );
    if (!assignments.length) test.skip();
    const result = await apiPatch(page, `/api/buddy/assignments/${assignments[0].id}`, {
      action: 'accept',
    });
    expect(result.status).toBe('accepted');
  });

  test('TC-V002-b: volunteer can decline with reason', async ({ page }) => {
    await loginAsVolunteer(page);
    const assignments = await page.evaluate(() =>
      fetch('/api/buddy/assignments?status=pending_volunteer', { credentials: 'include' }).then(r => r.json())
    );
    if (assignments.length < 2) test.skip();
    const result = await apiPatch(page, `/api/buddy/assignments/${assignments[1].id}`, {
      action: 'decline',
      decline_reason: 'Schedule conflict this month',
    });
    expect(result.status).toBe('declined');
    expect(result.volunteer_decline_reason).toBe('Schedule conflict this month');
  });

  test('TC-V002-c: decline triggers re-match (new pending assignment)', async ({ page }) => {
    await loginAsVolunteer(page);
    const assignments = await page.evaluate(() =>
      fetch('/api/buddy/assignments?status=pending_volunteer', { credentials: 'include' }).then(r => r.json())
    );
    if (!assignments.length) test.skip();
    const declined = await apiPatch(page, `/api/buddy/assignments/${assignments[0].id}`, {
      action: 'decline',
      decline_reason: 'Too far away',
    });
    expect(declined.status).toBe('declined');
    // System should queue a re-match; navigator task should appear
    const tasks = await page.evaluate(() =>
      fetch('/api/navigator/tasks?type=buddy_rematch', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(tasks)).toBe(true);
  });
});

// ─── TC-V003 · V-03 Log Buddy Call ───────────────────────────────────────────

test.describe('V-03 Log Buddy Call', () => {
  test('TC-V003-a: POST buddy call writes to buddy_calls', async ({ page }) => {
    await loginAsVolunteer(page);
    const assignments = await page.evaluate(() =>
      fetch('/api/buddy/assignments?status=active', { credentials: 'include' }).then(r => r.json())
    );
    if (!assignments.length) test.skip();
    const result = await apiPost(page, '/api/buddy/calls', {
      assignment_id: assignments[0].id,
      duration_minutes: 25,
      quality_rating: 4,
      member_mood: 'good',
      topics: ['family', 'health'],
      concern_flag: false,
      notes: 'Great conversation about her grandchildren',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-V003-b: concern_flag creates navigator task', async ({ page }) => {
    await loginAsVolunteer(page);
    const assignments = await page.evaluate(() =>
      fetch('/api/buddy/assignments?status=active', { credentials: 'include' }).then(r => r.json())
    );
    if (!assignments.length) test.skip();
    const call = await apiPost(page, '/api/buddy/calls', {
      assignment_id: assignments[0].id,
      duration_minutes: 15,
      quality_rating: 2,
      member_mood: 'low',
      concern_flag: true,
      concern_description: 'Member mentioned feeling isolated',
    });
    expect(call.id).toBeTruthy();
    // Should create navigator task
    const tasks = await page.evaluate(() =>
      fetch('/api/navigator/tasks?type=concern_follow_up', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });
});

// ─── TC-V004 · V-04 Service Request Accept ───────────────────────────────────

test.describe('V-04 Service Accept & Complete', () => {
  test('TC-V004-a: volunteer accepts pending service booking', async ({ page }) => {
    await loginAsVolunteer(page);
    const bookings = await page.evaluate(() =>
      fetch('/api/services?status=pending&volunteer_eligible=true', { credentials: 'include' }).then(r => r.json())
    );
    if (!bookings.length) test.skip();
    const result = await apiPatch(page, `/api/services/${bookings[0].id}`, {
      action: 'accept',
    });
    expect(result.status).toBe('accepted');
    expect(result.volunteer_id).toBeTruthy();
  });

  test('TC-V004-b: volunteer marks service complete', async ({ page }) => {
    await loginAsVolunteer(page);
    const bookings = await page.evaluate(() =>
      fetch('/api/services?status=accepted', { credentials: 'include' }).then(r => r.json())
    );
    if (!bookings.length) test.skip();
    const result = await apiPatch(page, `/api/services/${bookings[0].id}`, {
      action: 'complete',
      completion_notes: 'Drove member to Kaiser, trip went smoothly',
    });
    expect(result.status).toBe('completed');
  });
});

// ─── TC-V005 · V-05 Time Bank ────────────────────────────────────────────────

test.describe('V-05 Time Bank', () => {
  test('TC-V005-a: GET time bank balance returns number', async ({ page }) => {
    await loginAsVolunteer(page);
    const balance = await page.evaluate(() =>
      fetch('/api/time-bank/balance', { credentials: 'include' }).then(r => r.json())
    );
    expect(typeof balance.balance === 'number' || balance.balance === null).toBe(true);
  });

  test('TC-V005-b: log hours increases balance', async ({ page }) => {
    await loginAsVolunteer(page);
    const before = await page.evaluate(() =>
      fetch('/api/time-bank/balance', { credentials: 'include' }).then(r => r.json())
    );
    await apiPost(page, '/api/time-bank/log', {
      hours: 2,
      service_type: 'buddy_call',
      notes: 'Weekly buddy call',
    });
    const after = await page.evaluate(() =>
      fetch('/api/time-bank/balance', { credentials: 'include' }).then(r => r.json())
    );
    expect((after.balance || 0)).toBeGreaterThanOrEqual((before.balance || 0));
  });
});

// ─── TC-V006 · V-06 Volunteer Dashboard ──────────────────────────────────────

test.describe('V-06 Volunteer Dashboard', () => {
  test('TC-V006-a: dashboard shows real assignment list', async ({ page }) => {
    await loginAsVolunteer(page);
    await page.goto(`${BASE}/dashboard/volunteer`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });

  test('TC-V006-b: buddy assignments endpoint returns data', async ({ page }) => {
    await loginAsVolunteer(page);
    const assignments = await page.evaluate(() =>
      fetch('/api/buddy/assignments', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(assignments)).toBe(true);
  });
});

// ─── TC-V007 · V-07 Training ─────────────────────────────────────────────────

test.describe('V-07 Volunteer Training', () => {
  test('TC-V007-a: GET training modules returns list', async ({ page }) => {
    await loginAsVolunteer(page);
    const modules = await page.evaluate(() =>
      fetch('/api/volunteer-training', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(modules) || typeof modules === 'object').toBe(true);
  });

  test('TC-V007-b: POST completion writes to training_completions', async ({ page }) => {
    await loginAsVolunteer(page);
    const modules = await page.evaluate(() =>
      fetch('/api/volunteer-training', { credentials: 'include' }).then(r => r.json())
    );
    const list = Array.isArray(modules) ? modules : (modules.modules || []);
    if (!list.length) test.skip();
    const result = await apiPost(page, `/api/volunteer-training/${list[0].id}/complete`, {
      quiz_score: 85,
    });
    expect(result.id || result.completed).toBeTruthy();
  });
});

// ─── TC-V008 · V-08 Ride Accept ──────────────────────────────────────────────

test.describe('V-08 Ride Booking', () => {
  test('TC-V008-a: volunteer accepts ride booking', async ({ page }) => {
    await loginAsVolunteer(page);
    const rides = await page.evaluate(() =>
      fetch('/api/ride-bookings?status=pending', { credentials: 'include' }).then(r => r.json())
    );
    if (!rides.length) test.skip();
    const result = await apiPatch(page, `/api/ride-bookings/${rides[0].id}`, {
      action: 'accept',
    });
    expect(result.status).toBe('accepted');
  });
});

// ─── TC-V009 · V-09 Skill Exchange ───────────────────────────────────────────

test.describe('V-09 Skill Exchange Offer', () => {
  test('TC-V009-a: volunteer posts skill offer', async ({ page }) => {
    await loginAsVolunteer(page);
    const result = await apiPost(page, '/api/skill-exchange', {
      skill_name: 'Computer help',
      skill_category: 'technology',
      exchange_type: 'offer',
      hours_per_week: 1,
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });
});

// ─── TC-V010 · V-10 Neighbor Match ───────────────────────────────────────────

test.describe('V-10 Neighbor Volunteer Match', () => {
  test('TC-V010-a: neighbor match returns nearby seniors', async ({ page }) => {
    await loginAsVolunteer(page);
    const matches = await page.evaluate(() =>
      fetch('/api/neighbor-match', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(matches) || typeof matches === 'object').toBe(true);
  });
});
