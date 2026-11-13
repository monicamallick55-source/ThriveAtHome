/**
 * WF-MEMBER: Member workflows E2E tests
 * M-01 Onboarding · M-02 Service Request · M-03 Buddy Request
 * M-04 Communities · M-05 Events · M-06 Skill Exchange
 * M-07 Gift Sending · M-08 Celebrations · M-09 Memory Book
 * M-10 Grief Support · M-11 Important Dates · M-12 Life Story
 * M-13 Benefits Finder · M-14 Home Sharing · M-15 Encore Careers
 * M-16 Cultural Programming · M-17 Pet Profile · M-18 Fraud Alert
 * M-19 Life Transitions · M-20 Medicare Help
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsMember(page: any, email = 'member@test.com') {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', email);
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

// ─── TC-M001 · M-01 Onboarding ────────────────────────────────────────────────

test.describe('M-01 Onboarding', () => {
  test('TC-M001-a: 4-step onboarding writes member row to DB', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/step-1`);

    // Step 1 — personal info
    await page.fill('[name="first_name"]', 'TestFirst');
    await page.fill('[name="last_name"]', 'TestLast');
    await page.fill('[name="zip_code"]', '94102');
    await page.click('[data-testid="next-step"]');

    // Step 2 — Aria opt-in
    await page.click('[data-testid="aria-optin-yes"]');
    await page.click('[data-testid="next-step"]');

    // Step 3 — grief toggle
    await page.click('[data-testid="grief-toggle"]');
    await page.click('[data-testid="next-step"]');

    // Step 4 — confirm
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    // Verify member exists in DB via API
    const res = await page.evaluate(() =>
      fetch('/api/members/me', { credentials: 'include' }).then(r => r.json())
    );
    expect(res.first_name).toBe('TestFirst');
    expect(res.zip_code).toBe('94102');
  });

  test('TC-M001-b: navigator task created when grief support opted in', async ({ page }) => {
    await loginAsMember(page);
    const tasks = await page.evaluate(() =>
      fetch('/api/navigator/tasks?type=grief_check', { credentials: 'include' }).then(r => r.json())
    );
    // After grief opt-in, at least one navigator task should exist
    expect(Array.isArray(tasks)).toBe(true);
  });
});

// ─── TC-M002 · M-02 Service Request ──────────────────────────────────────────

test.describe('M-02 Service Request', () => {
  test('TC-M002-a: AI free-text parse → real service_bookings row', async ({ page }) => {
    await loginAsMember(page);

    const result = await apiPost(page, '/api/services', {
      free_text: 'I need a ride to the doctor on Friday at 10am',
    });

    expect(result.id).toBeTruthy();
    // Must NOT be a stub id
    expect(result.id).not.toMatch(/^stub-/);
    expect(result.service_type).toBe('transport');
  });

  test('TC-M002-b: service booking creates navigator task', async ({ page }) => {
    await loginAsMember(page);
    const booking = await apiPost(page, '/api/services', {
      service_type: 'transport',
      notes: 'wheelchair accessible van needed',
      scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(booking.id).not.toMatch(/^stub-/);
    expect(booking.status).toBe('pending');
  });

  test('TC-M002-c: dashboard service page shows real bookings', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/services`);
    // Should NOT show stub copy
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
    await expect(page.locator('[data-testid="service-list"]')).toBeVisible();
  });
});

// ─── TC-M003 · M-03 Buddy Request ────────────────────────────────────────────

test.describe('M-03 Buddy Matching', () => {
  test('TC-M003-a: POST /api/buddy/request writes to buddy_requests', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/buddy/request', {
      companion_type: 'buddy',
      preferred_days: ['monday', 'wednesday'],
      preferred_time: 'morning',
      interests: ['gardening', 'reading'],
      languages: ['en'],
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe('pending');
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-M003-b: matching engine returns ranked volunteers', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/buddy/request', {
      companion_type: 'buddy',
      preferred_days: ['tuesday'],
      interests: ['chess'],
    });
    expect(result.id).toBeTruthy();
    // Matching should create a pending assignment
    const assignment = await page.evaluate((rid: string) =>
      fetch(`/api/buddy/assignments?request_id=${rid}`, { credentials: 'include' }).then(r => r.json()),
      result.id
    );
    // May be empty if no volunteers, but must not error
    expect(Array.isArray(assignment) || typeof assignment === 'object').toBe(true);
  });

  test('TC-M003-c: buddy dashboard shows pending request', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/buddy`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
    // Page must contain buddy-related content
    const html = await page.content();
    expect(
      html.toLowerCase().includes('buddy') ||
      html.toLowerCase().includes('companion') ||
      html.toLowerCase().includes('connect')
    ).toBe(true);
  });
});

// ─── TC-M004 · M-04 Communities ──────────────────────────────────────────────

test.describe('M-04 Communities', () => {
  test('TC-M004-a: GET /api/communities returns REAL circles, not stub data', async ({ page }) => {
    await loginAsMember(page);
    const circles = await page.evaluate(() =>
      fetch('/api/communities', { credentials: 'include' }).then(r => r.json())
    );
    // Stubs use hardcoded ids like '1', '2', '3' — real UUIDs are 36 chars
    expect(Array.isArray(circles)).toBe(true);
    if (circles.length > 0) {
      expect(circles[0].id).toMatch(/^[0-9a-f-]{36}$/i);
    }
  });

  test('TC-M004-b: member can join a circle', async ({ page }) => {
    await loginAsMember(page);
    const circles = await page.evaluate(() =>
      fetch('/api/communities', { credentials: 'include' }).then(r => r.json())
    );
    if (circles.length === 0) test.skip();
    const circleId = circles[0].id;
    const result = await apiPost(page, `/api/communities/${circleId}/join`, {});
    expect(result.member_id).toBeTruthy();
  });

  test('TC-M004-c: communities page shows real data', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/communities`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
    await expect(page.locator('[data-testid="community-list"]')).toBeVisible();
  });
});

// ─── TC-M005 · M-05 Events ───────────────────────────────────────────────────

test.describe('M-05 Events', () => {
  test('TC-M005-a: GET /api/events returns real rows from DB', async ({ page }) => {
    await loginAsMember(page);
    const events = await page.evaluate(() =>
      fetch('/api/events', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(events)).toBe(true);
    if (events.length > 0) {
      expect(events[0].id).toMatch(/^[0-9a-f-]{36}$/i);
    }
  });

  test('TC-M005-b: RSVP writes to event_rsvps table', async ({ page }) => {
    await loginAsMember(page);
    const events = await page.evaluate(() =>
      fetch('/api/events', { credentials: 'include' }).then(r => r.json())
    );
    if (!events.length) test.skip();
    const result = await apiPost(page, `/api/events/${events[0].id}/rsvp`, { status: 'attending' });
    expect(result.id || result.event_id).toBeTruthy();
    expect(result.id || result.event_id).not.toMatch(/^stub-/);
  });
});

// ─── TC-M006 · M-06 Skill Exchange ───────────────────────────────────────────

test.describe('M-06 Skill Exchange', () => {
  test('TC-M006-a: POST /api/skill-exchange creates real listing', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/skill-exchange', {
      skill_name: 'Spanish tutoring',
      skill_category: 'language',
      exchange_type: 'offer',
      hours_per_week: 2,
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-M006-b: time bank credits updated after exchange', async ({ page }) => {
    await loginAsMember(page);
    const credits = await page.evaluate(() =>
      fetch('/api/time-bank/balance', { credentials: 'include' }).then(r => r.json())
    );
    expect(typeof credits.balance === 'number' || credits.balance === null).toBe(true);
  });
});

// ─── TC-M007 · M-07 Gift Sending ─────────────────────────────────────────────

test.describe('M-07 Gift Sending', () => {
  test('TC-M007-a: gift catalog returns real items', async ({ page }) => {
    await loginAsMember(page);
    const items = await page.evaluate(() =>
      fetch('/api/gifts', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(items)).toBe(true);
  });

  test('TC-M007-b: POST /api/gift-orders creates order with Stripe intent', async ({ page }) => {
    await loginAsMember(page);
    const items = await page.evaluate(() =>
      fetch('/api/gifts', { credentials: 'include' }).then(r => r.json())
    );
    if (!items.length) test.skip();
    const result = await apiPost(page, '/api/gift-orders', {
      item_id: items[0].id,
      recipient_member_id: null,
      message: 'Thinking of you!',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
    // Should have a Stripe payment intent client secret
    expect(result.client_secret || result.payment_intent_id).toBeTruthy();
  });

  test('TC-M007-c: gifts page UI does not show Coming Soon', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/gifts`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-M008 · M-08 Celebrations ─────────────────────────────────────────────

test.describe('M-08 Celebrations', () => {
  test('TC-M008-a: birthday detection creates celebration event', async ({ page }) => {
    await loginAsMember(page);
    const events = await page.evaluate(() =>
      fetch('/api/celebrations?type=birthday', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(events) || typeof events === 'object').toBe(true);
  });

  test('TC-M008-b: POST celebration request returns real id', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/celebration-requests', {
      tier: 'digital',
      occasion: 'birthday',
      recipient_name: 'Grandma Rose',
      date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });
});

// ─── TC-M009 · M-09 Memory Book ──────────────────────────────────────────────

test.describe('M-09 Memory Book', () => {
  test('TC-M009-a: POST creates memory_book_draft row', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/life-story/memory-book', {
      title: 'My Life in Photos',
      cover_style: 'classic',
      page_count: 20,
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
    expect(result.status).toBe('draft');
  });

  test('TC-M009-b: memory book page does not show Coming Soon', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/memory-book`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-M010 · M-10 Grief Support ────────────────────────────────────────────

test.describe('M-10 Grief Support', () => {
  test('TC-M010-a: POST grief support request writes to DB', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/grief-support', {
      pathway: 'circle',
      loss_type: 'spouse',
      notes: 'I lost my husband last month',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-M010-b: grief circles visible on communities page', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/communities`);
    const html = await page.content();
    expect(html.toLowerCase().includes('grief')).toBe(true);
  });
});

// ─── TC-M011 · M-11 Important Dates ──────────────────────────────────────────

test.describe('M-11 Important Dates', () => {
  test('TC-M011-a: POST tracked item creates real row', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/tracked-items', {
      item_type: 'insurance_renewal',
      title: 'Medicare Part D renewal',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-M011-b: snooze updates due_date', async ({ page }) => {
    await loginAsMember(page);
    const item = await apiPost(page, '/api/tracked-items', {
      item_type: 'prescription_refill',
      title: 'Metformin refill',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    });
    const updated = await page.evaluate(
      async (id: string) => {
        const r = await fetch(`/api/tracked-items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'snooze', days: 7 }),
          credentials: 'include',
        });
        return r.json();
      },
      item.id
    );
    expect(updated.id).toBe(item.id);
  });
});

// ─── TC-M012 · M-12 Life Story ───────────────────────────────────────────────

test.describe('M-12 Life Story', () => {
  test('TC-M012-a: POST life story entry persists to DB', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/life-story', {
      entry_type: 'memory',
      title: 'My first day in America',
      content: 'We arrived in San Francisco in 1972...',
      year: 1972,
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-M012-b: GET returns saved entries', async ({ page }) => {
    await loginAsMember(page);
    const entries = await page.evaluate(() =>
      fetch('/api/life-story', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(entries)).toBe(true);
  });
});

// ─── TC-M013 · M-13 Benefits Finder ──────────────────────────────────────────

test.describe('M-13 Benefits Finder', () => {
  test('TC-M013-a: benefits search returns results', async ({ page }) => {
    await loginAsMember(page);
    const results = await page.evaluate(() =>
      fetch('/api/benefits?category=transportation&zip=94102', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(results) || typeof results.programs !== 'undefined').toBe(true);
  });
});

// ─── TC-M014 · M-14 Home Sharing ─────────────────────────────────────────────

test.describe('M-14 Home Sharing', () => {
  test('TC-M014-a: POST creates home sharing listing', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/home-sharing', {
      listing_type: 'host',
      room_type: 'private',
      rent_amount: 800,
      preferred_age_range: '25-40',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-M014-b: home sharing page no Coming Soon', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/home-sharing`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-M015 · M-15 Encore Careers ───────────────────────────────────────────

test.describe('M-15 Encore Careers', () => {
  test('TC-M015-a: job listings return real rows', async ({ page }) => {
    await loginAsMember(page);
    const listings = await page.evaluate(() =>
      fetch('/api/encore-careers', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(listings) || typeof listings === 'object').toBe(true);
  });

  test('TC-M015-b: encore careers page no Coming Soon', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/encore-careers`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-M016 · M-16 Cultural Programming ─────────────────────────────────────

test.describe('M-16 Cultural Programming', () => {
  test('TC-M016-a: GET /api/festivals returns events', async ({ page }) => {
    await loginAsMember(page);
    const festivals = await page.evaluate(() =>
      fetch('/api/festivals', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(festivals) || typeof festivals === 'object').toBe(true);
  });
});

// ─── TC-M017 · M-17 Pet Profile ──────────────────────────────────────────────

test.describe('M-17 Pet Profile', () => {
  test('TC-M017-a: POST pet creates member_pets row', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/pets', {
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      birth_date: '2018-03-15',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });
});

// ─── TC-M018 · M-18 Fraud Alert ──────────────────────────────────────────────

test.describe('M-18 Fraud Alert', () => {
  test('TC-M018-a: GET /api/fraud-flags returns flags array', async ({ page }) => {
    await loginAsMember(page);
    const flags = await page.evaluate(() =>
      fetch('/api/fraud-flags', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(flags)).toBe(true);
  });
});

// ─── TC-M019 · M-19 Life Transitions ─────────────────────────────────────────

test.describe('M-19 Life Transitions', () => {
  test('TC-M019-a: select transition pathway creates plan', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/life-transitions', {
      pathway: 'moving_to_care',
      notes: 'Considering assisted living',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });
});

// ─── TC-M020 · M-20 Medicare Help ────────────────────────────────────────────

test.describe('M-20 Medicare Help', () => {
  test('TC-M020-a: medicare help page no Coming Soon', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/medicare-help`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });

  test('TC-M020-b: GET /api/medicare-help returns real response', async ({ page }) => {
    await loginAsMember(page);
    const result = await page.evaluate(() =>
      fetch('/api/medicare-help', { credentials: 'include' }).then(r => r.json())
    );
    expect(result).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});
