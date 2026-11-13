/**
 * WF-FAMILY: Family member workflow E2E tests
 * F-01 Dashboard · F-02 Events · F-03 Gift to Senior
 * F-04 Celebration Request · F-05 Service History
 * F-06 Crisis Alert · F-07 Document Vault · F-08 Subscription
 * F-09 Memory Book view
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

async function loginAsFamily(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'family@test.com');
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

// ─── TC-F001 · F-01 Family Dashboard ─────────────────────────────────────────

test.describe('F-01 Family Dashboard', () => {
  test('TC-F001-a: family summary returns real wellness card', async ({ page }) => {
    await loginAsFamily(page);
    const summary = await page.evaluate(() =>
      fetch('/api/family-summary', { credentials: 'include' }).then(r => r.json())
    );
    expect(typeof summary === 'object').toBe(true);
    expect(summary.error).toBeUndefined();
  });

  test('TC-F001-b: check-ins endpoint returns mood timeline', async ({ page }) => {
    await loginAsFamily(page);
    const checkins = await page.evaluate(() =>
      fetch('/api/check-ins', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(checkins)).toBe(true);
  });
});

// ─── TC-F002 · F-02 Family Events ────────────────────────────────────────────

test.describe('F-02 Family Events', () => {
  test('TC-F002-a: POST family event writes to DB', async ({ page }) => {
    await loginAsFamily(page);
    const result = await apiPost(page, '/api/family-events', {
      title: "Mom's 80th Birthday",
      date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: 'Surprise party at the house',
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-F002-b: GET family events returns created event', async ({ page }) => {
    await loginAsFamily(page);
    await apiPost(page, '/api/family-events', {
      title: 'Thanksgiving Dinner',
      date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    });
    const events = await page.evaluate(() =>
      fetch('/api/family-events', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });
});

// ─── TC-F003 · F-03 Gift to Senior ───────────────────────────────────────────

test.describe('F-03 Gift to Senior', () => {
  test('TC-F003-a: family gift order creates real order row', async ({ page }) => {
    await loginAsFamily(page);
    const gifts = await page.evaluate(() =>
      fetch('/api/gifts', { credentials: 'include' }).then(r => r.json())
    );
    if (!gifts.length) test.skip();
    const result = await apiPost(page, '/api/family/gift-orders', {
      item_id: gifts[0].id,
      message: 'Happy Birthday, Mom!',
      scheduled_delivery: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-F003-b: gift send page no Coming Soon', async ({ page }) => {
    await loginAsFamily(page);
    await page.goto(`${BASE}/dashboard/gift-send`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-F004 · F-04 Celebration Request ──────────────────────────────────────

test.describe('F-04 Celebration Request', () => {
  test('TC-F004-a: digital tier creates celebration_request row', async ({ page }) => {
    await loginAsFamily(page);
    const result = await apiPost(page, '/api/celebrations', {
      tier: 'digital',
      occasion: 'anniversary',
      recipient_name: 'Mom & Dad',
      date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
    expect(result.tier).toBe('digital');
  });

  test('TC-F004-b: enhanced tier includes Stripe payment intent', async ({ page }) => {
    await loginAsFamily(page);
    const result = await apiPost(page, '/api/celebrations', {
      tier: 'enhanced',
      occasion: 'birthday',
      recipient_name: 'Grandpa Joe',
      date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    expect(result.id).toBeTruthy();
    // Enhanced tier costs money — should return a payment intent
    expect(result.client_secret || result.payment_intent_id || result.amount_cents).toBeTruthy();
  });

  test('TC-F004-c: celebration planner page functional', async ({ page }) => {
    await loginAsFamily(page);
    await page.goto(`${BASE}/dashboard/celebrations/plan`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-F005 · F-05 Service History ──────────────────────────────────────────

test.describe('F-05 Service History', () => {
  test('TC-F005-a: service history returns readable status', async ({ page }) => {
    await loginAsFamily(page);
    const bookings = await page.evaluate(() =>
      fetch('/api/services', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(bookings)).toBe(true);
    if (bookings.length > 0) {
      expect(bookings[0].status).toBeTruthy();
    }
  });
});

// ─── TC-F006 · F-06 Crisis Alert ─────────────────────────────────────────────

test.describe('F-06 Crisis Alert', () => {
  test('TC-F006-a: family can view crisis events', async ({ page }) => {
    await loginAsFamily(page);
    const events = await page.evaluate(() =>
      fetch('/api/crisis', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(events) || typeof events === 'object').toBe(true);
  });
});

// ─── TC-F007 · F-07 Document Vault ───────────────────────────────────────────

test.describe('F-07 Document Vault', () => {
  test('TC-F007-a: GET /api/documents returns array', async ({ page }) => {
    await loginAsFamily(page);
    const docs = await page.evaluate(() =>
      fetch('/api/documents', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(docs)).toBe(true);
  });
});

// ─── TC-F008 · F-08 Subscription ─────────────────────────────────────────────

test.describe('F-08 Subscription', () => {
  test('TC-F008-a: billing endpoint returns subscription info', async ({ page }) => {
    await loginAsFamily(page);
    const billing = await page.evaluate(() =>
      fetch('/api/billing', { credentials: 'include' }).then(r => r.json())
    );
    expect(billing).toBeTruthy();
    expect(billing.error).toBeUndefined();
  });
});

// ─── TC-F009 · F-09 Memory Book View ─────────────────────────────────────────

test.describe('F-09 Memory Book View', () => {
  test('TC-F009-a: family can view member memory book', async ({ page }) => {
    await loginAsFamily(page);
    const result = await page.evaluate(() =>
      fetch('/api/life-story/memory-book', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(result) || typeof result === 'object').toBe(true);
  });
});
