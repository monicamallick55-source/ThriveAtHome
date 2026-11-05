import { defineConfig, devices } from '@playwright/test';

/**
 * ThriveAtHome — Playwright E2E Configuration
 * Base URL: https://thrive-at-home-pied.vercel.app
 * Run: npx playwright test
 * Run single suite: npx playwright test tests/e2e/public-routes.spec.ts
 */

const BASE_URL = process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Reasonable timeouts for a Vercel production deployment
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },

  projects: [
    // Desktop Chrome — primary
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport — for TC-P071, TC-PERF002
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/public-routes.spec.ts', '**/member-pages.spec.ts'],
    },
  ],

  outputDir: 'test-results/',
});
