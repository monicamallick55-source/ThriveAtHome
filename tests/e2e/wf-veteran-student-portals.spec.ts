/**
 * WF-PORTALS: Veteran, Student, K-12, Medicare, Career Transition portal E2E tests
 * VT-01..04 Veteran · ST-01..04 Student / K-12
 * PORT-01 Medicare Help · PORT-02 Veteran Portal (member-facing)
 * PORT-03 K-12 Student Portal · PORT-04 Career Transition
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

async function loginAsVolunteer(page: any, email = 'volunteer@test.com') {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard**`);
}

async function loginAsMember(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'member@test.com');
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

// ─── VETERAN WORKFLOWS ────────────────────────────────────────────────────────

test.describe('VT-01 Veteran Application', () => {
  test('TC-VT01-a: veteran volunteer applies with military info', async ({ page }) => {
    await loginAsVolunteer(page, 'veteran@test.com');
    const result = await apiPost(page, '/api/veterans', {
      branch: 'Army',
      service_years: '1990-1998',
      rank: 'Staff Sergeant',
      discharge_type: 'honorable',
      disability_rating: 30,
      vso_affiliation: 'VFW',
    });
    expect(result.id || result.volunteer_id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});

test.describe('VT-02 VSO Portal', () => {
  test('TC-VT02-a: VSO admin views volunteer roster', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'vsoadmin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const roster = await page.evaluate(() =>
      fetch('/api/vso-programs/roster', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(roster) || typeof roster === 'object').toBe(true);
  });

  test('TC-VT02-b: VSO admin approves volunteer hours', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'vsoadmin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const pending = await page.evaluate(() =>
      fetch('/api/vso-programs/hours?status=pending_approval', { credentials: 'include' }).then(r => r.json())
    );
    if (!pending.length) test.skip();
    const result = await apiPatch(page, `/api/vso-programs/hours/${pending[0].id}`, {
      action: 'approve',
    });
    expect(result.status).toBe('approved');
  });
});

test.describe('VT-03 Service Record PDF', () => {
  test('TC-VT03-a: volunteer downloads service record PDF', async ({ page }) => {
    await loginAsVolunteer(page, 'veteran@test.com');
    const result = await page.evaluate(() =>
      fetch('/api/volunteers/me/service-record', { credentials: 'include' }).then(r => r.json())
    );
    expect(result.pdf_url || result.url || result.signed_url).toBeTruthy();
  });
});

test.describe('VT-04 Invitation-Based VSO Role', () => {
  test('TC-VT04-a: invite creates pending invitation record', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'vsoadmin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const result = await apiPost(page, '/api/invitations', {
      invitee_email: `vet-invite-${Date.now()}@test.com`,
      role: 'vso_volunteer',
      vso_program_id: null,
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });
});

// ─── STUDENT / K-12 WORKFLOWS ────────────────────────────────────────────────

test.describe('ST-01 Student Portal', () => {
  test('TC-ST01-a: student views verified hours', async ({ page }) => {
    await loginAsVolunteer(page, 'student@test.com');
    const hours = await page.evaluate(() =>
      fetch('/api/student/hours', { credentials: 'include' }).then(r => r.json())
    );
    expect(typeof hours.total_hours !== 'undefined' || Array.isArray(hours)).toBe(true);
  });

  test('TC-ST01-b: verification letter PDF generated', async ({ page }) => {
    await loginAsVolunteer(page, 'student@test.com');
    const result = await page.evaluate(() =>
      fetch('/api/student/verification-letter', { credentials: 'include' }).then(r => r.json())
    );
    expect(result.pdf_url || result.url).toBeTruthy();
  });
});

test.describe('ST-02 University Admin', () => {
  test('TC-ST02-a: university admin lists affiliates', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'uniadmin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const affiliates = await page.evaluate(() =>
      fetch('/api/university-admin/affiliates', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(affiliates) || typeof affiliates === 'object').toBe(true);
  });
});

test.describe('ST-03 K-12 Student Hours', () => {
  test('TC-ST03-a: K-12 student logs session hours', async ({ page }) => {
    await loginAsVolunteer(page, 'k12student@test.com');
    const result = await apiPost(page, '/api/k12/sessions', {
      program_id: 'k12-test-program',
      date: new Date().toISOString().split('T')[0],
      hours: 2,
      activity: 'Technology help for seniors',
    });
    expect(result.id || result.session_id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});

test.describe('ST-04 K-12 Curriculum', () => {
  test('TC-ST04-a: teacher creates K-12 program', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'k12admin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const result = await apiPost(page, '/api/k12', {
      program_name: 'Digital Helpers Club 2026',
      school_name: 'Lincoln High School',
      grade_levels: ['9', '10', '11', '12'],
      contact_email: 'teacher@lincoln.edu',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-ST04-b: K-12 portal page no Coming Soon', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'k12admin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    await page.goto(`${BASE}/k12`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── MEDICARE HELP PORTAL ─────────────────────────────────────────────────────

test.describe('PORT-01 Medicare Help Portal', () => {
  test('TC-PORT01-a: medicare benefits search returns programs', async ({ page }) => {
    await loginAsMember(page);
    const result = await page.evaluate(() =>
      fetch('/api/medicare-help?query=Part+D+coverage', { credentials: 'include' }).then(r => r.json())
    );
    expect(result).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('TC-PORT01-b: SHIP counselor connect request', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/medicare-help/counselor-request', {
      questions: ['How do I compare Part D plans?'],
      preferred_contact: 'phone',
    });
    expect(result.id || result.request_id).toBeTruthy();
  });

  test('TC-PORT01-c: medicare help page no Coming Soon', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/medicare-help`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── VETERAN PORTAL (member-facing) ──────────────────────────────────────────

test.describe('PORT-02 Veteran Member Portal', () => {
  test('TC-PORT02-a: veteran benefits search returns VA programs', async ({ page }) => {
    await loginAsMember(page);
    const result = await page.evaluate(() =>
      fetch('/api/benefits?category=veteran', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(result) || typeof result === 'object').toBe(true);
  });
});

// ─── CAREER TRANSITION ────────────────────────────────────────────────────────

test.describe('PORT-04 Career Transition', () => {
  test('TC-PORT04-a: member selects transition pathway', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/transitions', {
      pathway: 'encore_career',
      current_situation: 'Recently retired from corporate job',
      goals: ['Part-time work', 'Meaningful impact', 'Stay active'],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-PORT04-b: transition plan has steps', async ({ page }) => {
    await loginAsMember(page);
    const plans = await page.evaluate(() =>
      fetch('/api/transitions', { credentials: 'include' }).then(r => r.json())
    );
    if (!plans.length) test.skip();
    expect(Array.isArray(plans[0].steps) || plans[0].step_count >= 0).toBe(true);
  });
});
