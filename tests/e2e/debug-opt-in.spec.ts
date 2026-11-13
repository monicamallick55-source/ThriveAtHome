import { test, expect } from '@playwright/test';
const BASE = 'https://thrive-at-home-pied.vercel.app';
test('debug opt-in', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'member@test.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard**`);
  const result = await page.evaluate(async () => {
    const r = await fetch('/api/retell/opt-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opted_in: true }), credentials: 'include' });
    return { status: r.status, body: await r.text() };
  });
  console.log('RESULT:', JSON.stringify(result));
  expect(result.status).toBe(200);
});

test('debug webhook', async ({ page }) => {
  await page.goto('https://thrive-at-home-pied.vercel.app/login');
  await page.fill('[name="email"]', 'member@test.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL('https://thrive-at-home-pied.vercel.app/dashboard**');
  const r1 = await page.evaluate(async () => {
    const r = await fetch('/api/retell/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: 'test-123', mood: 'happy' }), credentials: 'include' });
    return { status: r.status, body: await r.text() };
  });
  console.log('WEBHOOK:', JSON.stringify(r1));
  const r2 = await page.evaluate(async () => {
    const r = await fetch('/api/check-ins', { credentials: 'include' });
    return { status: r.status, body: await r.text() };
  });
  console.log('CHECKINS:', JSON.stringify(r2));
  const r3 = await page.evaluate(async () => {
    const r = await fetch('/api/buddy/brief', { credentials: 'include' });
    return { status: r.status, body: await r.text() };
  });
  console.log('BUDDY:', JSON.stringify(r3));
  const r4 = await page.evaluate(async () => {
    const r = await fetch('/api/b2b-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ org_name: 'Test Corp', admin_email: 'admin@test.com' }) });
    return { status: r.status, body: await r.text() };
  });
  console.log('B2B:', JSON.stringify(r4));
  expect(r1.status).toBe(201);
});
