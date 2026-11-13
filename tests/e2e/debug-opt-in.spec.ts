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
