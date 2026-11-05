# ThriveAtHome — Automated Test Suite

> Version 1.0 · Tests v5.5 · November 2026

## Quick Start

```bash
# 1. Install dependencies
npm ci

# 2. Set env vars (copy from Vercel)
cp .env.local.example .env.local   # fill in your values

# 3. Run all tests
npm test

# 4. Or run a quick public-routes check (no auth needed, ~2 min)
npm run test:e2e:quick
```

## Test Structure

```
tests/
├── e2e/                        # Playwright browser tests
│   ├── helpers.ts              # Shared login helpers, test accounts
│   ├── public-routes.spec.ts   # TC-P070/P071 — 27 public routes + mobile
│   ├── auth-roles.spec.ts      # TC-A004 — 21 role login smoke tests
│   ├── feature-flags.spec.ts   # TC-B005/REG002/REG005/REG006 — flags
│   ├── member-pages.spec.ts    # TC-M001–M034 — all member dashboard pages
│   ├── family-portal.spec.ts   # TC-F001–F007 — family portal
│   ├── navigator-portal.spec.ts # TC-N001–N008 — navigator + admin
│   └── billing.spec.ts         # TC-B001–B042 — billing flows
├── api/                        # Node.js API assertion scripts
│   ├── fhir.test.ts            # TC-FH001–FH003 — FHIR R4 endpoint
│   └── cron.test.ts            # TC-V010/INF003/CH003 — cron auth
└── db/                         # Supabase SQL assertions
    ├── assertions.sql          # All SQL checks (run via psql)
    ├── run-assertions.ts       # Node.js runner for CI
    └── seed-accounts.sql       # One-time setup: seed 28 test accounts

scripts/
├── check-env.ts                # TC-INF005 — env var presence check
└── run-tests.sh                # Full suite orchestrator

.github/workflows/test.yml      # GitHub Actions CI pipeline
playwright.config.ts            # Playwright configuration
```

## Running Individual Suites

```bash
# Environment variable check
npm run test:env

# Database assertions (requires SUPABASE_SERVICE_ROLE_KEY)
npm run test:db

# API tests (requires FHIR_API_KEY + CRON_SECRET)
npm run test:api

# All Playwright E2E
npm run test:e2e

# Fast public routes + feature flags only (no login needed, ~2 min)
npm run test:e2e:quick

# Member dashboard pages
npm run test:e2e:member

# 21 role login smoke tests
npm run test:e2e:auth

# View HTML test report
npm run test:e2e:report
```

## Required Environment Variables

Copy these from Vercel Project Settings → Environment Variables → Production.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qdniskppkfqjmtpkftdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # For DB assertions (never expose publicly)

# Retell AI (13 vars)
RETELL_API_KEY=...
RETELL_AGENT_ID=...               # Aria
RETELL_ROSA_AGENT_ID=...
RETELL_JOY_AGENT_ID=...
RETELL_GRACE_AGENT_ID=...
RETELL_HOPE_AGENT_ID=...
RETELL_CLAIRE_AGENT_ID=...
RETELL_SAM_AGENT_ID=...
RETELL_MORGAN_AGENT_ID=...
RETELL_NOVA_AGENT_ID=...
RETELL_ALEX_AGENT_ID=...
RETELL_QUINN_AGENT_ID=...         # Deferred M9 — still must be set
RETELL_JORDAN_AGENT_ID=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TWILIO_INBOUND_NUMBER=...

# Stripe
NEXT_PUBLIC_BASIC_PRICE_ID=...
NEXT_PUBLIC_COMPLETE_PRICE_ID=...
NEXT_PUBLIC_BASIC_ANNUAL_PRICE_ID=...
NEXT_PUBLIC_COMPLETE_ANNUAL_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=...

# Other
ANTHROPIC_API_KEY=...
FHIR_API_KEY=...
CRON_SECRET=...
RESEND_API_KEY=...                # New key — old re_SYD4Fgko revoked
```

## First-Time Setup — Seed Test Accounts

Before running auth and member tests, seed the 28 test accounts:

```bash
# 1. Create users in Supabase Auth (Dashboard → Authentication → Users)
#    OR use the Supabase CLI:
for email in member complete premier family navigator admin volunteer student veteran \
  retired_pro corporate neighbor faith k12student agency employer network \
  seniorcenter aaa orgadmin vsoadmin uniadmin k12admin careworker \
  medicare_member grief_member opt_out_member b2b_new_org; do
  supabase auth users create --email "${email}@test.com" --password "TestPass123!" 2>/dev/null || true
done

# 2. After users are created, run the seed SQL to set roles and plan_tiers:
psql "$DATABASE_URL" -f tests/db/seed-accounts.sql
```

## CI — GitHub Actions

The workflow in `.github/workflows/test.yml` runs automatically on every push to `main`.

**GitHub Secrets to add** (Settings → Secrets → Actions):

Add all 30 env vars listed above as repository secrets. The workflow uses them directly.

The pipeline has 4 stages:
1. `env-check` — TC-INF005: validates all required env vars are set
2. `db-assertions` — TC-INF002/M054/VOL061/REG001/PD001: Supabase SQL checks
3. `api-tests` — TC-FH001/V010/INF003: FHIR + cron endpoint auth
4. `e2e-public`, `e2e-auth`, `e2e-member` — Playwright suites (run in parallel)

Playwright HTML reports are uploaded as CI artifacts (7-day retention).

## Test Accounts — Password

All 28 seed accounts use: **TestPass123!**

## Blockers

Some tests are **skipped** when env vars are missing (graceful degradation):
- FHIR tests → skipped if `FHIR_API_KEY` not set
- Cron tests → skipped if `CRON_SECRET` not set
- DB assertions → skipped if `SUPABASE_SERVICE_ROLE_KEY` not set
- Role login tests → fail fast if seed accounts don't exist

## Known Limitations

| Test | Limitation | Workaround |
|------|-----------|------------|
| TC-M040 Birthday arc | Needs date-mocking | Seed member with DOB = today - N days, then run cron |
| TC-CH003 Metro auto-activation | Needs 50 Bay Area members | Run seed script first |
| TC-MED008 Backfill script | Uses real Anthropic API | Run manually on staging, not in CI |
| TC-V081 10DLC | Manual Twilio Console check | Check dashboard directly |
| TC-B042 Gift webhook | Needs payment_intent.succeeded | Stripe CLI: `stripe trigger payment_intent.succeeded` |
| Stripe Checkout flows | Stripe hosted page (cross-origin) | Use Stripe CLI + webhook forwarding for full flow |
