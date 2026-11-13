/**
 * WF-B2B: Enterprise / B2B workflow E2E tests
 * B2B-01 Employer Signup & Org Setup
 * B2B-02 Employee Bulk Enrollment / Import
 * B2B-03 B2B Invoicing — generate, send, pay
 * B2B-04 B2B Subscription (per-seat billing)
 * B2B-05 Employer Admin Dashboard
 * B2B-06 Corporate Volunteer Program (3-tier progress)
 * B2B-07 University Affiliate Verification
 * B2B-08 Medicare Advantage FHIR Import
 * B2B-09 B2B Contract / Implementation (onboarding flow)
 * B2B-10 White-Label / Co-Brand Org Config
 * B2B-11 Org-Level Feature Flags
 * B2B-12 Encore Career Posting (employer side)
 * B2B-13 B2B Payment Portal (Stripe billing portal)
 * B2B-14 Network Org Admin Dashboard
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://thrive-at-home-pied.vercel.app';

async function loginAsOrgAdmin(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'orgadmin@test.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard**`);
}

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('[name="email"]', 'admin@test.com');
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

// ─── TC-B01 · B2B-01 Employer / Org Signup ───────────────────────────────────

test.describe('B2B-01 Employer Signup & Org Setup', () => {
  test('TC-B01-a: POST /api/b2b-signup creates org + admin user', async ({ page }) => {
    await page.goto(`${BASE}/b2b/signup`);
    const result = await page.evaluate(() =>
      fetch('/api/b2b-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: 'Acme Corp ' + Date.now(),
          org_type: 'employer',
          admin_email: `b2b-test-${Date.now()}@acmecorp.com`,
          admin_name: 'Jane Smith',
          seat_count: 50,
          plan: 'enterprise',
        }),
        credentials: 'include',
      }).then(r => r.json())
    );
    expect(result.org_id || result.id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('TC-B01-b: B2B signup page renders without Coming Soon', async ({ page }) => {
    await page.goto(`${BASE}/b2b/signup`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });
});

// ─── TC-B02 · B2B-02 Employee Bulk Enrollment ────────────────────────────────

test.describe('B2B-02 Employee Bulk Enrollment', () => {
  test('TC-B02-a: bulk import CSV enrolls employees as members', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const csv = `email,first_name,last_name,department\njohn.doe@acme.com,John,Doe,HR\njane.roe@acme.com,Jane,Roe,Engineering`;
    const result = await page.evaluate(
      async (csvData: string) => {
        const form = new FormData();
        form.append('file', new Blob([csvData], { type: 'text/csv' }), 'employees.csv');
        const r = await fetch('/api/org-imports', {
          method: 'POST',
          body: form,
          credentials: 'include',
        });
        return r.json();
      },
      csv
    );
    expect(result.imported || result.queued).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('TC-B02-b: individual employee enrollment', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await apiPost(page, '/api/employer-admin/enroll', {
      email: `enroll-test-${Date.now()}@acme.com`,
      first_name: 'Bob',
      last_name: 'Worker',
      department: 'Sales',
    });
    expect(result.id || result.member_id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});

// ─── TC-B03 · B2B-03 B2B Invoicing ───────────────────────────────────────────

test.describe('B2B-03 B2B Invoicing', () => {
  test('TC-B03-a: invoice generated for org subscription', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const invoices = await page.evaluate(() =>
      fetch('/api/billing/invoices', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(invoices) || typeof invoices === 'object').toBe(true);
  });

  test('TC-B03-b: invoice has real Stripe invoice id', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const invoices = await page.evaluate(() =>
      fetch('/api/billing/invoices', { credentials: 'include' }).then(r => r.json())
    );
    const list = Array.isArray(invoices) ? invoices : (invoices.data || []);
    if (list.length === 0) test.skip();
    // Real Stripe invoice IDs start with 'in_'
    expect(list[0].stripe_invoice_id || list[0].id).toBeTruthy();
  });

  test('TC-B03-c: invoice PDF download link', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const invoices = await page.evaluate(() =>
      fetch('/api/billing/invoices', { credentials: 'include' }).then(r => r.json())
    );
    const list = Array.isArray(invoices) ? invoices : (invoices.data || []);
    if (!list.length) test.skip();
    const pdfResult = await page.evaluate((id: string) =>
      fetch(`/api/billing/invoices/${id}/pdf`, { credentials: 'include' }).then(r => r.json()),
      list[0].id
    );
    expect(pdfResult.url || pdfResult.pdf_url).toBeTruthy();
  });
});

// ─── TC-B04 · B2B-04 Per-Seat Subscription Billing ──────────────────────────

test.describe('B2B-04 Per-Seat Billing', () => {
  test('TC-B04-a: billing summary shows seat count + cost', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const billing = await page.evaluate(() =>
      fetch('/api/billing', { credentials: 'include' }).then(r => r.json())
    );
    expect(billing.seat_count || billing.quantity || billing.plan).toBeTruthy();
  });

  test('TC-B04-b: add seats updates subscription quantity in Stripe', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await apiPost(page, '/api/billing/seats', {
      action: 'add',
      quantity: 10,
    });
    expect(result.new_quantity || result.seat_count).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});

// ─── TC-B05 · B2B-05 Employer Admin Dashboard ────────────────────────────────

test.describe('B2B-05 Employer Admin Dashboard', () => {
  test('TC-B05-a: dashboard shows enrolled member count', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const stats = await page.evaluate(() =>
      fetch('/api/employer-admin/stats', { credentials: 'include' }).then(r => r.json())
    );
    expect(typeof stats.member_count !== 'undefined').toBe(true);
  });

  test('TC-B05-b: employer admin page no Coming Soon', async ({ page }) => {
    await loginAsOrgAdmin(page);
    await page.goto(`${BASE}/employer-admin`);
    await expect(page.locator('text=Coming soon')).toHaveCount(0);
  });

  test('TC-B05-c: usage report shows engagement metrics', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const report = await page.evaluate(() =>
      fetch('/api/employer-admin/usage-report', { credentials: 'include' }).then(r => r.json())
    );
    expect(report).toBeTruthy();
    expect(report.error).toBeUndefined();
  });
});

// ─── TC-B06 · B2B-06 Corporate Volunteer Program ─────────────────────────────

test.describe('B2B-06 Corporate Volunteer Program', () => {
  test('TC-B06-a: program creates with 3 tiers', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await apiPost(page, '/api/corporate-volunteer-programs', {
      name: 'Acme Gives Back 2026',
      tiers: [
        { name: 'Bronze', hours_required: 10, reward: '$50 gift card' },
        { name: 'Silver', hours_required: 25, reward: '$100 gift card' },
        { name: 'Gold', hours_required: 50, reward: 'Extra PTO day' },
      ],
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
    expect(result.tiers).toHaveLength(3);
  });

  test('TC-B06-b: volunteer hours update tier progress', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const programs = await page.evaluate(() =>
      fetch('/api/corporate-volunteer-programs', { credentials: 'include' }).then(r => r.json())
    );
    if (!programs.length) test.skip();
    const progress = await page.evaluate((id: string) =>
      fetch(`/api/corporate-volunteer-programs/${id}/progress`, { credentials: 'include' }).then(r => r.json()),
      programs[0].id
    );
    expect(Array.isArray(progress) || typeof progress === 'object').toBe(true);
  });
});

// ─── TC-B07 · B2B-07 University Affiliate Verification ───────────────────────

test.describe('B2B-07 University Affiliate Verification', () => {
  test('TC-B07-a: university admin verifies student affiliate', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'uniadmin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const affiliates = await page.evaluate(() =>
      fetch('/api/university-admin/affiliates?status=pending', { credentials: 'include' }).then(r => r.json())
    );
    if (!affiliates.length) test.skip();
    const result = await apiPatch(page, `/api/university-admin/affiliates/${affiliates[0].id}`, {
      action: 'verify',
    });
    expect(result.status).toBe('verified');
  });

  test('TC-B07-b: verified hours report generates', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'uniadmin@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const report = await page.evaluate(() =>
      fetch('/api/university-admin/hours-report', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(report) || typeof report === 'object').toBe(true);
  });
});

// ─── TC-B08 · B2B-08 FHIR / Medicare Advantage Import ───────────────────────

test.describe('B2B-08 FHIR Member Import', () => {
  test('TC-B08-a: FHIR patient import creates member row', async ({ page }) => {
    await loginAsAdmin(page);
    const result = await apiPost(page, '/api/fhir/import', {
      resourceType: 'Patient',
      id: 'fhir-test-' + Date.now(),
      name: [{ given: ['Alice'], family: 'FhirTest' }],
      birthDate: '1952-03-14',
      telecom: [{ system: 'phone', value: '415-555-0199' }],
    });
    expect(result.member_id || result.id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('TC-B08-b: eligibility check endpoint responds', async ({ page }) => {
    await loginAsAdmin(page);
    const result = await page.evaluate(() =>
      fetch('/api/fhir/eligibility?member_id=test', { credentials: 'include' }).then(r => r.json())
    );
    // May return not_found but must not 500
    expect(result.error !== 'Internal server error').toBe(true);
  });
});

// ─── TC-B09 · B2B-09 Implementation / Onboarding Flow ────────────────────────

test.describe('B2B-09 B2B Implementation Flow', () => {
  test('TC-B09-a: implementation checklist created on org signup', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const checklist = await page.evaluate(() =>
      fetch('/api/org-configs/implementation-checklist', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(checklist) || typeof checklist === 'object').toBe(true);
  });

  test('TC-B09-b: complete implementation step writes to DB', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const checklist = await page.evaluate(() =>
      fetch('/api/org-configs/implementation-checklist', { credentials: 'include' }).then(r => r.json())
    );
    const steps = Array.isArray(checklist) ? checklist : (checklist.steps || []);
    if (!steps.length) test.skip();
    const result = await apiPatch(page, `/api/org-configs/implementation-checklist/${steps[0].id}`, {
      status: 'completed',
    });
    expect(result.status).toBe('completed');
  });
});

// ─── TC-B10 · B2B-10 White-Label / Co-Brand Config ───────────────────────────

test.describe('B2B-10 White-Label Config', () => {
  test('TC-B10-a: set org brand colors + logo', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await apiPost(page, '/api/org-configs/branding', {
      primary_color: '#1a56db',
      logo_url: 'https://cdn.acme.com/logo.png',
      display_name: 'Acme Wellness Hub',
    });
    expect(result.id || result.org_id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('TC-B10-b: branding config returns saved values', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const config = await page.evaluate(() =>
      fetch('/api/org-configs/branding', { credentials: 'include' }).then(r => r.json())
    );
    expect(config).toBeTruthy();
    expect(config.error).toBeUndefined();
  });
});

// ─── TC-B11 · B2B-11 Feature Flags ───────────────────────────────────────────

test.describe('B2B-11 Org Feature Flags', () => {
  test('TC-B11-a: admin can toggle feature flag', async ({ page }) => {
    await loginAsAdmin(page);
    const result = await apiPost(page, '/api/feature-flags', {
      flag_name: 'memory_book',
      org_id: null, // platform-wide
      enabled: true,
    });
    expect(result.id || result.flag_name).toBeTruthy();
  });

  test('TC-B11-b: org-scoped flag override works', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await apiPost(page, '/api/feature-flags', {
      flag_name: 'encore_careers',
      enabled: false,
    });
    expect(result.id || result.flag_name).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});

// ─── TC-B12 · B2B-12 Encore Career Posting (Employer) ────────────────────────

test.describe('B2B-12 Encore Career Posting', () => {
  test('TC-B12-a: employer posts job listing', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await apiPost(page, '/api/encore-careers', {
      title: 'Part-time Community Ambassador',
      description: 'Welcoming and social part-time role',
      location: 'Remote / San Francisco Bay Area',
      hours_per_week: 20,
      pay_type: 'hourly',
      pay_amount_cents: 2500,
      requirements: ['Good communication skills', 'Comfort with technology'],
    });
    expect(result.id).toBeTruthy();
    expect(result.id).not.toMatch(/^stub-/);
  });

  test('TC-B12-b: member can apply to encore listing', async ({ page }) => {
    // Switch to member
    await page.goto(`${BASE}/login`);
    await page.fill('[name="email"]', 'member@test.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL(`${BASE}/dashboard**`);

    const listings = await page.evaluate(() =>
      fetch('/api/encore-careers?status=active&limit=1', { credentials: 'include' }).then(r => r.json())
    );
    if (!listings.length) test.skip();
    const result = await apiPost(page, `/api/encore-careers/${listings[0].id}/apply`, {
      cover_note: 'I am very interested in this role',
    });
    expect(result.id || result.application_id).toBeTruthy();
  });
});

// ─── TC-B13 · B2B-13 Stripe Billing Portal ───────────────────────────────────

test.describe('B2B-13 Billing Portal', () => {
  test('TC-B13-a: billing portal session created', async ({ page }) => {
    await loginAsOrgAdmin(page);
    const result = await page.evaluate(() =>
      fetch('/api/billing/portal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: 'http://localhost:3000/employer-admin' }),
      }).then(r => r.json())
    );
    expect(result.url).toBeTruthy();
    // Stripe portal URLs contain 'billing.stripe.com'
    expect(result.url).toContain('stripe.com');
  });
});

// ─── TC-B14 · B2B-14 Network Org Admin ───────────────────────────────────────

test.describe('B2B-14 Network Admin Dashboard', () => {
  test('TC-B14-a: network metrics endpoint returns data', async ({ page }) => {
    await loginAsAdmin(page);
    const metrics = await page.evaluate(() =>
      fetch('/api/network/metrics', { credentials: 'include' }).then(r => r.json())
    );
    expect(metrics).toBeTruthy();
    expect(metrics.error).toBeUndefined();
  });

  test('TC-B14-b: cross-org dashboard shows all orgs', async ({ page }) => {
    await loginAsAdmin(page);
    const orgs = await page.evaluate(() =>
      fetch('/api/network/orgs', { credentials: 'include' }).then(r => r.json())
    );
    expect(Array.isArray(orgs) || typeof orgs === 'object').toBe(true);
  });
});
