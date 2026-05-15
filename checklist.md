# Thrive@Home — Build Checklist (v1.0 — M1–M6)

> **AI maintains this file. Update it at the end of every session.**
> Human reads it but does not edit it.
> This checklist covers Phases 1–14 only. Add-On and Advanced milestones have separate checklists.

---

## Status key

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress — some code written, tests not yet passed |
| `[A]` | Awaiting human APPROVED — review presented, waiting |
| `[x]` | Complete — test passed AND human replied APPROVED |
| `[!]` | Blocked — needs human input before code can proceed |

**A phase is `[x]` only when:** every test in `tests.md` for that phase passed AND the human replied APPROVED.

---

## How the AI uses this file

**Start of session:** Read entire file → find first non-`[x]` phase → that is where to start. If `[A]`, wait for APPROVED before touching code.

**End of session:** Update all phase statuses → add any new blocked items → update env var table → append entry to `progress.md`.

---

## M1 — Foundation

| # | Phase | Status | Completed | Notes |
|---|-------|--------|-----------|-------|
| 1 | Project Scaffold | `[ ]` | | .gitignore, env, interfaces, stubs, providers, placeholders |
| 2 | Supabase Connection | `[ ]` | | 3 clients, middleware, functions helper, connection test |
| 3 | Database Schema | `[ ]` | | All tables, enums, indexes, RLS policies, audit triggers |
| 4 | RLS Verification | `[ ]` | | Cross-user isolation confirmed, admin bypass confirmed |

**M1 Gate — all 4 phases `[x]`:**
- [ ] Vercel URL loads with no console errors
- [ ] `.env.local` is untracked by git (confirmed with `git status`)
- [ ] `npx tsc --noEmit` — zero errors
- [ ] All 43 tables in Supabase Table Editor
- [ ] Realtime enabled for `realtime_notifications` INSERT
- [ ] Cross-user RLS test: User A cannot read Member B's data

---

## M2 — Member Data

| # | Phase | Status | Completed | Notes |
|---|-------|--------|-----------|-------|
| 5 | Authentication | `[ ]` | | Signup (atomic), login, logout, middleware routing, auth.ts |
| 6 | Member Onboarding Form | `[ ]` | | 3 steps, no plan selection, RPC submit, confirmation page |
| 7 | App Data Layer & Seed Data | `[ ]` | | All data functions, types, seed script, clear script |

**M2 Gate — all 3 phases `[x]`:**
- [ ] Signup creates Auth user + family_members row atomically
- [ ] Failed family_members insert → Auth user deleted (no orphans)
- [ ] All 5 routing rules verified with real browser navigation
- [ ] Onboarding: 3 steps complete, member row in Supabase with `plan_tier = 'basics'`
- [ ] Seed script runs: prints "test-family@thriveathome.dev / TestPassword123!"
- [ ] Clear script runs: removes all seeded rows without errors

---

## M3 — UI System

| # | Phase | Status | Completed | Notes |
|---|-------|--------|-----------|-------|
| 8 | Primitive UI Components | `[ ]` | | All 13 components, all variants, accessible, keyboard-navigable |

**M3 Gate — phase 8 `[x]`:**
- [ ] All 13 components render in all variants on test-ui page
- [ ] Every interactive element reachable and activatable by keyboard
- [ ] Focus ring visible on every focused element
- [ ] Test-ui page deleted after approval
- [ ] `npx tsc --noEmit` — zero errors

---

## M4 — Realtime Notifications

| # | Phase | Status | Completed | Notes |
|---|-------|--------|-----------|-------|
| 9 | Supabase Realtime System | `[ ]` | | Edge Function deployed, hook, bell wired, RLS confirmed |

**M4 Gate — phase 9 `[x]`:**
- [ ] Alert inserted via SQL Editor → toast in dashboard tab within 2 seconds (no page refresh)
- [ ] Bell count increments, mark-read clears it
- [ ] RLS: User A cannot see User B's notifications
- [ ] pushRealtimeNotification() failure logs but does not throw

---

## M5 — Alert Engine

| # | Phase | Status | Completed | Notes |
|---|-------|--------|-----------|-------|
| 10 | Alert Logic & Detection | `[ ]` | | Edge Function, all 8 rules, deduplication, wellness drift |
| 11 | Crisis Detection | `[ ]` | | Phrase list, 5 escalation steps, fail-safe, grief extension |

**M5 Gate — phases 10–11 `[x]`:**
- [ ] All 8 alert rules create correct severity
- [ ] Deduplication: second identical alert not created within 24 hours
- [ ] Realtime notification fires after every alert creation
- [ ] Crisis transcript → all 5 escalation steps logged in stub mode (within 60 seconds)
- [ ] Normal transcript → no false positive crisis detection
- [ ] "fell asleep" → no fall flag (false positive test)
- [ ] API failure on disambiguation → defaults to crisis (fail-safe confirmed)

---

## M6 — Family Dashboard

| # | Phase | Status | Completed | Notes |
|---|-------|--------|-----------|-------|
| 12 | Family Dashboard Shell & Health Timeline | `[ ]` | | All sections, realtime alerts, health timeline tabs |
| 13 | Call History Page | `[ ]` | | Load-more pagination, plain English flags, expand row |
| 14 | Family Coordination Tools | `[ ]` | | Task board, messages, document vault, nudge cron |

**M6 Gate — phases 12–14 `[x]`:**
- [ ] Dashboard loads within 3 seconds with seed data
- [ ] All 4 health timeline tabs render with seed data
- [ ] New alert appears within 2 seconds via Realtime (no page refresh)
- [ ] StatusDot updates without page refresh
- [ ] Task created by one family member visible to all others in real time
- [ ] Message sent visible to all linked family members in real time
- [ ] Document uploads and is retrievable via signed URL
- [ ] Dashboard usable on 375px mobile width (no horizontal scroll)
- [ ] All text ≥ 18px, all buttons ≥ 52px height

---

## Overall progress

```
M1  Foundation          [ ][ ][ ][ ]          0/4  phases complete
M2  Member Data         [ ][ ][ ]             0/3  phases complete
M3  UI System           [ ]                   0/1  phases complete
M4  Realtime            [ ]                   0/1  phases complete
M5  Alert Engine        [ ][ ]                0/2  phases complete
M6  Family Dashboard    [ ][ ][ ]             0/3  phases complete
──────────────────────────────────────────────────────────────
TOTAL                                         0/14 phases complete
```

---

## Blocked items log

| Phase | Date blocked | Why | Human action needed | Resolved? |
|-------|-------------|-----|---------------------|-----------|
| — | — | — | — | — |

---

## Environment variables tracker (v1.0 scope)

Only variables needed for M1–M6. Add-On variables exist in `.env.local.example` but are blank.

| Variable | Required at | In .env.local | In Vercel | Notes |
|----------|------------|--------------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | `[ ]` | `[ ]` | supabase.com → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | `[ ]` | `[ ]` | Same location |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | `[ ]` | `[ ]` | ⚠️ Server only. Bypasses RLS. |
| `NEXT_PUBLIC_APP_URL` | Phase 1 | `[ ]` | `[ ]` | localhost:3000 locally; Vercel URL in prod |
| `CARE_TEAM_EMAIL` | Phase 1 | `[ ]` | `[ ]` | Your email for now |
| `CRON_SECRET` | Phase 1 | `[ ]` | `[ ]` | `openssl rand -base64 32` |

---

## Supabase Edge Functions tracker

| Function | Phase | Deployed locally | Deployed to prod | Notes |
|----------|-------|-----------------|-----------------|-------|
| `push-notification` | 9 | `[ ]` | `[ ]` | |
| `create-alert` | 10 | `[ ]` | `[ ]` | |
| `check-missed-calls` | 10 | `[ ]` | `[ ]` | Cron-triggered |
| `family-nudge-check` | 14 | `[ ]` | `[ ]` | Cron-triggered |

---

## npm packages tracker (v1.0 scope)

| Package | Installed at phase | Purpose |
|---------|-------------------|---------|
| `@supabase/supabase-js` | Phase 2 | Supabase database client |
| `@supabase/ssr` | Phase 2 | Supabase SSR helpers for Next.js |
| `recharts` | Phase 12 | Mood trend and health timeline charts |

Add-On packages (installed when reaching those milestones):
- `@anthropic-ai/sdk` — M8
- `twilio` — M8/M10
- `@sendgrid/mail` — M10
- `stripe` — M11
- `next-intl` — M14
- `puppeteer` — M18

---

*Checklist v1.0 — 14 phases, M1–M6 only*
*Add-On milestones (M7–M12) and Advanced (M13–M18) have separate checklists appended later*
