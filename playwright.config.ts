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
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
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
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/public-routes.spec.ts', '**/member-pages.spec.ts'],
    },
  ],

  outputDir: 'test-results/',
});
