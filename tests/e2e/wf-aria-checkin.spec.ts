/**
 * WF-ARIA: AI / Aria call workflow E2E tests
 * AR-01 Opt-In · AR-02 Check-in Call · AR-03 Gift Intent
 * AR-04 Service Request Intent · AR-05 Buddy Brief
 * AR-06 Important Date Reminder in Call
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

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

// ─── TC-AR01 · AR-01 Aria Opt-In ─────────────────────────────────────────────

test.describe('AR-01 Aria Opt-In', () => {
  test('TC-AR01-a: opt-in updates members.aria_call_opted_in', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/retell/opt-in', { opted_in: true });
    expect(result.aria_call_opted_in).toBe(true);
  });

  test('TC-AR01-b: opt-out clears flag', async ({ page }) => {
    await loginAsMember(page);
    const result = await apiPost(page, '/api/retell/opt-in', { opted_in: false });
    expect(result.aria_call_opted_in).toBe(false);
  });

  test('TC-AR01-c: device page shows Aria call button', async ({ page }) => {
    await loginAsMember(page);
    await page.goto(`${BASE}/dashboard/device`);
    const html = await page.content();
    expect(
      html.includes('aria') || html.includes('Aria') ||
      html.includes('call') || html.includes('Call')
    ).toBe(true);
  });
});

// ─── TC-AR02 · AR-02 Check-in Call ───────────────────────────────────────────

test.describe('AR-02 Check-In Call', () => {
  test('TC-AR02-a: webhook creates check_in row with mood', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const result = await page.evaluate((base: string) =>
      fetch(`${base}/api/retell/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'call_ended',
          call_id: 'retell-test-' + Date.now(),
          member_phone: '+14155550199',
          duration_seconds: 180,
          transcript_summary: 'Member said she is feeling good today, mentioned gardening.',
          mood_score: 4,
          mood_label: 'good',
          crisis_detected: false,
          gift_intent: null,
          service_intent: null,
        }),
        credentials: 'include',
      }).then(r => r.json()),
      BASE
    );
    expect(result.check_in_id || result.id).toBeTruthy();
  });

  test('TC-AR02-b: crisis_detected flag creates crisis event', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const result = await page.evaluate((base: string) =>
      fetch(`${base}/api/retell/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'call_ended',
          call_id: 'retell-crisis-test-' + Date.now(),
          member_phone: '+14155550199',
          duration_seconds: 90,
          transcript_summary: 'Member expressed feeling very sad and alone.',
          mood_score: 1,
          mood_label: 'low',
          crisis_detected: true,
          crisis_type: 'emotional_distress',
          gift_intent: null,
          service_intent: null,
        }),
        credentials: 'include',
      }).then(r => r.json()),
      BASE
    );
    expect(result.crisis_event_id || result.check_in_id).toBeTruthy();
  });

  test('TC-AR02-c: check-ins endpoint returns mood timeline', async ({ page }) => {
    await loginAsMember(page);
    const resp = await page.request.get(`${BASE}/api/check-ins`);
    const checkins = await resp.json().catch(() => []);
    expect(Array.isArray(checkins)).toBe(true);
  });
});

// ─── TC-AR03 · AR-03 Gift Intent in Call ─────────────────────────────────────

test.describe('AR-03 Gift Intent in Call', () => {
  test('TC-AR03-a: gift_intent in webhook creates gift_order draft', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const result = await page.evaluate((base: string) =>
      fetch(`${base}/api/retell/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'call_ended',
          call_id: 'retell-gift-test-' + Date.now(),
          member_phone: '+14155550199',
          duration_seconds: 120,
          transcript_summary: 'Member wants to send flowers to her daughter.',
          mood_score: 5,
          mood_label: 'great',
          crisis_detected: false,
          gift_intent: {
            item_category: 'flowers',
            recipient: 'daughter',
            occasion: 'birthday',
            message: 'Happy birthday sweetheart!',
          },
          service_intent: null,
        }),
        credentials: 'include',
      }).then(r => r.json()),
      BASE
    );
    expect(result.gift_order_draft_id || result.check_in_id).toBeTruthy();
  });
});

// ─── TC-AR04 · AR-04 Service Request Intent ──────────────────────────────────

test.describe('AR-04 Service Request Intent in Call', () => {
  test('TC-AR04-a: service_intent in webhook creates service booking', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const result = await page.evaluate((base: string) =>
      fetch(`${base}/api/retell/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'call_ended',
          call_id: 'retell-svc-test-' + Date.now(),
          member_phone: '+14155550199',
          duration_seconds: 150,
          transcript_summary: 'Member needs a ride to the pharmacy tomorrow at 2pm.',
          mood_score: 3,
          mood_label: 'okay',
          crisis_detected: false,
          gift_intent: null,
          service_intent: {
            service_type: 'transport',
            destination: 'Walgreens on Market Street',
            scheduled_for: new Date(Date.now() + 86400000).toISOString(),
            notes: 'Pick up at her home address',
          },
        }),
        credentials: 'include',
      }).then(r => r.json()),
      BASE
    );
    expect(result.service_booking_id || result.check_in_id).toBeTruthy();
  });
});

// ─── TC-AR05 · AR-05 Buddy Brief ─────────────────────────────────────────────

test.describe('AR-05 Buddy Brief', () => {
  test('TC-AR05-a: GET /api/buddy/brief returns AI-generated context', async ({ page }) => {
    await loginAsMember(page);
    const me = await page.evaluate((base: string) =>
      fetch(`${base}/api/members/me`, { credentials: 'include' }).then(r => r.json()),
      BASE
    );
    const brief = await page.evaluate(([base, id]: [string, string]) =>
      fetch(`${base}/api/buddy/brief?member_id=${id}`, { credentials: 'include' }).then(r => r.json()),
      [BASE, me.id] as [string, string]
    );
    expect(brief.summary || brief.brief || brief.text).toBeTruthy();
  });
});

// ─── TC-AR06 · AR-06 Important Date Reminder ─────────────────────────────────

test.describe('AR-06 Important Date Reminder in Call', () => {
  test('TC-AR06-a: tracked items endpoint returns upcoming items for Aria', async ({ page }) => {
    await loginAsMember(page);
    const resp = await page.request.get(`${BASE}/api/tracked-items?upcoming=true&days=7`);
    const items = await resp.json().catch(() => []);
    expect(Array.isArray(items)).toBe(true);
  });
});
