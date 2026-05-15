# Thrive@Home — Build Checklist (v1.0)

> **AI maintains this file. Update at end of every session.**
> Human may read but should not edit it.

---

## Status key

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress — code written, tests not yet passed |
| `[A]` | Awaiting human APPROVED — review presented, waiting |
| `[x]` | Complete — test passed AND human replied APPROVED |
| `[!]` | Blocked — needs human input (see Blocked Items below) |

**A phase is `[x]` only when:** every test in `tests.md` produced the expected result AND the user replied APPROVED.

**At start of every session:** read this file top-to-bottom → find first non-`[x]` phase → start there. If `[A]`, wait for APPROVED before any code.

**At end of every session:** update statuses, add blocked items, update env var and npm tables.

---

## Scope: M1–M6 (Phases 1–14)

M7–M12 and M13–M18 are tracked in separate documents appended later.

---

## M1 — Foundation

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 1 | Project Scaffold | `[ ]` | | |
| 2 | Supabase Connection | `[ ]` | | |
| 3 | Database Schema | `[ ]` | | |
| 4 | RLS Verification | `[ ]` | | |

**M1 gate before Phase 5:**
- [ ] Vercel URL loads with zero console errors
- [ ] `.env.local` is untracked by git (`git ls-files | grep .env` produces no output)
- [ ] `npx tsc --noEmit` produces zero errors
- [ ] All 8 interfaces and 8 stubs exist in `/lib/`
- [ ] All placeholder pages return 200 (not 404)
- [ ] Cross-user RLS test: User A cannot read Member B's data

---

## M2 — Member Data

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 5 | Authentication | `[ ]` | | |
| 6 | Member Onboarding Form | `[ ]` | | |
| 7 | App Data Layer & Seed Data | `[ ]` | | |

**M2 gate before Phase 8:**
- [ ] Family member can sign up, enrol a senior, and see the confirmation page
- [ ] `members` row in Supabase with `plan_tier = 'basics'`
- [ ] Signup rollback: failed `family_members` insert deletes the Auth user
- [ ] Seed script creates Margaret Chen with 14 calls; `npx tsx scripts/seed-test-data.ts` prints login credentials

---

## M3 — UI System

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 8 | Primitive UI Components | `[ ]` | | |

**M3 gate before Phase 9:**
- [ ] All 13 components render in all variants
- [ ] Every interactive element reachable by keyboard Tab
- [ ] Test-ui page deleted after approval

---

## M4 — Realtime Notifications

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 9 | Supabase Realtime | `[ ]` | | |

**M4 gate before Phase 10:**
- [ ] Alert inserted in SQL Editor → toast appears in dashboard within 2 seconds, no page refresh
- [ ] Bell count increments and decrements correctly
- [ ] User A cannot see User B's notifications (RLS confirmed)

---

## M5 — Alert Engine

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 10 | Alert Logic & Detection | `[ ]` | | |
| 11 | Crisis Detection | `[ ]` | | |

**M5 gate before Phase 12:**
- [ ] All 8 alert rules create correct severity
- [ ] Deduplication: calling same alert type twice in 24 hours creates only 1 row
- [ ] Crisis transcript → all 5 escalation steps confirmed in stub logs
- [ ] No false positive on "fell asleep watching TV"

---

## M6 — Family Dashboard

| # | Phase | Status | Date | Notes |
|---|-------|--------|------|-------|
| 12 | Dashboard Shell & Health Timeline | `[ ]` | | |
| 13 | Call History Page | `[ ]` | | |
| 14 | Family Coordination Tools | `[ ]` | | |

**M6 gate — V1 complete:**
- [ ] Dashboard loads in < 3 seconds with seed data
- [ ] All 4 health timeline tabs render
- [ ] New alert appears on dashboard within 2 seconds via Realtime, no refresh
- [ ] Document vault: file uploads and retrieves correctly
- [ ] Family task appears for all linked family members in real time
- [ ] `npx axe-cli [URL] --tags wcag2aa` shows zero violations on dashboard
- [ ] Dashboard viewed on real phone at 375px — no horizontal scroll, all text readable

---

## Overall progress

```
M1  Foundation        [ ][ ][ ][ ]         0 / 4
M2  Member Data       [ ][ ][ ]            0 / 3
M3  UI System         [ ]                  0 / 1
M4  Realtime          [ ]                  0 / 1
M5  Alert Engine      [ ][ ]               0 / 2
M6  Family Dashboard  [ ][ ][ ]            0 / 3
─────────────────────────────────────────
TOTAL                                      0 / 14
```

---

## Blocked items

| Phase | Date | Why blocked | Human action needed | Resolved |
|-------|------|------------|---------------------|---------|
| — | — | — | — | — |

---

## Environment variables

| Variable | Required at | `.env.local` | Vercel | Notes |
|----------|------------|-------------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | `[ ]` | `[ ]` | supabase.com → project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | `[ ]` | `[ ]` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | `[ ]` | `[ ]` | ⚠️ Server-only. Bypasses all RLS. |
| `NEXT_PUBLIC_APP_URL` | Phase 1 | `[ ]` | `[ ]` | `http://localhost:3000` locally; Vercel URL in prod |
| `CARE_TEAM_EMAIL` | Phase 1 | `[ ]` | `[ ]` | Your email for now |
| `CRON_SECRET` | Phase 1 | `[ ]` | `[ ]` | `openssl rand -base64 32` |
| Add-On variables (M7–M12) | Later milestones | — | — | Leave blank until those milestones |

---

## npm packages

| Package | Phase installed | Purpose |
|---------|----------------|---------|
| `@supabase/supabase-js` | 2 | Supabase client |
| `@supabase/ssr` | 2 | SSR session handling |
| `date-fns` | 6 | Date validation (DOB age check) |
| `focus-trap-react` | 8 | Accessible Modal focus trapping |
| `recharts` | 12 | Mood trend and health timeline charts |

Add rows as packages are installed. Never install a package not listed here without adding it.

---

## Supabase Edge Functions deployed

| Function | Phase deployed | Status |
|----------|--------------|--------|
| `push-notification` | 9 | `[ ]` |
| `create-alert` | 10 | `[ ]` |
| `check-missed-calls` | 10 | `[ ]` |
| `family-nudge-check` | 14 | `[ ]` |
