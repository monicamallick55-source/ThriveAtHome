import { test } from '@playwright/test';
const BASE = 'https://thrive-at-home-pied.vercel.app';

test('debug login flow', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, id: i.id }))
  );
  console.log('INPUTS:', JSON.stringify(inputs));
  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({ type: b.type, text: b.innerText.trim().substring(0,30) }))
  );
  console.log('BUTTONS:', JSON.stringify(buttons));
  await page.locator('input[type="email"], input[name="email"], #email').first().fill('member@test.com');
  await page.locator('input[type="password"], input[name="password"], #password').first().fill('TestPass123!');
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForTimeout(5000);
  console.log('URL AFTER:', page.url());
  const cookies = await page.context().cookies();
  console.log('COOKIES:', cookies.map(c => c.name).join(', '));
});

import { test as test2 } from '@playwright/test';
const BASE2 = 'https://thrive-at-home-pied.vercel.app';

test2('debug home-safety after login', async ({ page }) => {
  // Login
  await page.goto(`${BASE2}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('member@test.com');
  await page.locator('input[type="password"]').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log('After login URL:', page.url());
  
  // Now go to home-safety
  await page.goto(`${BASE2}/dashboard/home-safety`);
  await page.waitForLoadState('networkidle');
  console.log('Home safety URL:', page.url());
  const body = await page.evaluate(() => document.body?.innerText?.substring(0, 200) ?? '');
  console.log('Body preview:', body);
});
