# Thrive@Home — Build Checklist (v1.0)

> **The agent updates this file in place as work progresses.**
> **The human can inspect it at any time to see exactly what has been verified.**
>
> An item marked `[x]` is a claim that its specific verification was run and passed.
> Never mark `[x]` on an item that was not personally verified.

---

## Status key

| Symbol | Meaning |
|--------|---------|
| `[ ]` | PENDING — not yet attempted |
| `[~]` | IN PROGRESS — implementation started, verification not yet run |
| `[x]` | PASSED — verification run, expected result confirmed |
| `[!]` | BLOCKED — failed 3 hypotheses, needs human input |

**STATUS field values:** `NOT STARTED` → `IN PROGRESS` → `COMPLETE` or `BLOCKED`

---

## How the agent uses this file

**Phase entry:** Set STATUS to `IN PROGRESS`. Set all items to `[ ]`.

**During work:** Mark `[x]` immediately when the item's specific verification passes — not at the end of the phase. Mark `[!]` when BLOCKED on an item after 3 failed hypotheses.

**Phase exit gate:** All items must be `[x]` before presenting the human review. If any item is `[ ]` or `[~]`, do not present the review. If any item is `[!]`, halt and write a BLOCKED entry to `progress.md`.

**Human inspection check:** Before marking any item `[x]`, ask: "Could I re-run this verification right now and get the same result?" If no — the item is not `[x]`.

---

## M1 — Foundation

### Phase 1 — Project Scaffold
STATUS: `IN PROGRESS`

- [x] `.gitignore` exists and `.env.local` is untracked — `echo "TEST=secret" > .env.local && git status` → under "Untracked files" only
- [ ] Project deploys to Vercel — live URL shows "Thrive@Home" in navy, zero console errors
- [ ] Auto-deploy works — push trivial change → Vercel deploys within 60 seconds
- [x] `npx tsc --noEmit` passes — zero output
- [x] All 8 interfaces exist — `ls lib/interfaces/ | wc -l` → 8
- [x] All 8 stubs exist — `ls lib/stubs/ | wc -l` → 8
- [x] All providers resolve to stubs — tsx check → all 8 are Stub classes → true
- [x] All 19 placeholder routes return 200 — curl tested all routes → all 200
- [x] No `.env` file tracked — `git ls-files | grep -E "^\.env"` → no output

### Phase 2 — Supabase Connection
STATUS: `NOT STARTED`

- [ ] Browser client connects — `/test` page shows database row text
- [ ] Error state is human-readable — corrupt URL → readable error, no stack trace
- [ ] Admin client is server-only — import in Client Component → error
- [ ] `npx tsc --noEmit` passes after test page deleted

### Phase 3 — Database Schema
STATUS: `NOT STARTED`

- [ ] All 17 tables exist — Supabase Table Editor shows all 17
- [ ] All FK relationships exist — Supabase → Database → Foreign Keys
- [ ] Cascade delete works — delete member → linked family_member auto-deleted
- [ ] RLS enabled on all tables — Supabase → Policies → all show "RLS enabled"
- [ ] Realtime enabled for `realtime_notifications` — Supabase → Replication → INSERT checked
- [ ] Audit triggers exist — `information_schema.triggers` shows all 3

### Phase 4 — RLS Verification
STATUS: `NOT STARTED`

- [ ] Cross-user isolation confirmed — `npx tsx scripts/test-rls.ts` → all 3 assertions PASSED
- [ ] No test rows remain — check Supabase tables after script

**M1 gate:** All 4 phases `[x]` before Phase 5.

---

## M2 — Member Data

### Phase 5 — Authentication
STATUS: `NOT STARTED`

- [ ] Signup creates auth user + family_members row — check both in Supabase
- [ ] Unauthenticated `/dashboard` → redirected to `/login`
- [ ] Family user blocked from `/navigator` — redirected to `/dashboard`
- [ ] Navigator user redirected to `/navigator` on login
- [ ] Orphaned auth user prevented — break insert, attempt signup → auth user deleted, clear error shown

### Phase 6 — Member Onboarding Form
STATUS: `NOT STARTED`

- [ ] Empty required fields block Next — all error messages appear
- [ ] DOB < 60 years rejected — clear error on today's date
- [ ] Invalid phone rejected — error with format example
- [ ] Successful submission creates member row with `plan_tier='basics'`
- [ ] Confirmation shows correct preferred name — not "undefined"
- [ ] Form state survives page refresh — Step 2 data preserved
- [ ] Mobile layout at 375px — no horizontal scroll

### Phase 7 — App Data Layer & Seed Data
STATUS: `NOT STARTED`

- [ ] All data functions return `{data, error}`, never throw — `npx tsx scripts/test-data-layer.ts` → all PASSED
- [ ] Invalid ID returns `{data: null, error: 'Not found'}` — not a crash
- [ ] Seed script creates correct data — prints credentials, 14 call rows in Supabase
- [ ] Seed script is idempotent — run twice → same row count
- [ ] Clear script removes all seeded data without error
- [ ] `npx tsc --noEmit` passes

**M2 gate:** All 3 phases `[x]` before Phase 8.

---

## M3 — UI System

### Phase 8 — Primitive UI Components
STATUS: `NOT STARTED`

- [ ] All 13 components render in all variants — visually confirmed at `/test-ui`
- [ ] All interactive elements keyboard-reachable — Tab navigation confirmed
- [ ] Modal focus trap works — Tab stays inside, Escape closes
- [ ] `npx tsc --noEmit` passes
- [ ] Test-ui page deleted — `ls app/test-ui` → not found

**M3 gate:** Phase 8 `[x]` before Phase 9.

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime
STATUS: `NOT STARTED`

- [ ] Notification appears in browser within 2 seconds — SQL insert → toast without refresh
- [ ] Bell count increments and decrements — insert → 1 → mark read → 0
- [ ] Cross-user isolation — User A cannot see Member B's notifications
- [ ] `pushRealtimeNotification` does not throw on failure — logs error, continues
- [ ] `push-notification` Edge Function deployed — appears in `supabase functions list`

**M4 gate:** Phase 9 `[x]` before Phase 10.

---

## M5 — Alert Engine

### Phase 10 — Alert Logic & Detection
STATUS: `NOT STARTED`

- [ ] All 8 alert rules correct — `npx tsx scripts/test-alert-rules.ts` → all PASSED
- [ ] Deduplication works — same type in 24h creates exactly 1 row
- [ ] New alert triggers Realtime notification — dashboard shows toast within 2 seconds
- [ ] Wellness drift: decline detected, flat scores not flagged
- [ ] Emergency log written before alert on crisis — confirmed even when alerts insert fails
- [ ] `create-alert` Edge Function deployed
- [ ] `check-missed-calls` Edge Function deployed

### Phase 11 — Crisis Detection
STATUS: `NOT STARTED`

- [ ] Crisis transcript triggers all 5 escalation steps — `npx tsx scripts/test-crisis-detection.ts`
- [ ] Normal transcript: no false positive
- [ ] "fell asleep watching TV": no false positive
- [ ] Crisis detection failure creates navigator task — call processing continues

**M5 gate:** Both phases `[x]` before Phase 12.

---

## M6 — Family Dashboard

### Phase 12 — Dashboard Shell & Health Timeline
STATUS: `NOT STARTED`

- [ ] Dashboard loads < 3 seconds with seed data
- [ ] All 4 health timeline tabs render without error
- [ ] New alert appears via Realtime within 2 seconds, no refresh
- [ ] Error state: friendly message, no raw error code
- [ ] Mobile at 375px: no horizontal scroll

### Phase 13 — Call History Page
STATUS: `NOT STARTED`

- [ ] Calls listed newest-first, correct mood emoji and medication per row
- [ ] Expanded row shows plain-English flag labels — not raw flag names
- [ ] Load-more appends without page reload

### Phase 14 — Family Coordination Tools
STATUS: `NOT STARTED`

- [ ] Task by User A appears for User B within 2 seconds via Realtime
- [ ] Message by User A appears for User B within 2 seconds
- [ ] Document upload and download work
- [ ] File > 10MB rejected with clear error message
- [ ] Family nudge fires after 7-day absence + active alert
- [ ] Family nudge does NOT fire within 7-day window
- [ ] `family-nudge-check` Edge Function deployed

**M6 gate (V1 complete):**
- [ ] All 3 phases `[x]`
- [ ] `npx tsc --noEmit` → zero errors
- [ ] `npx axe-cli [URL]/dashboard --tags wcag2aa` → zero violations
- [ ] `npx axe-cli [URL]/onboarding --tags wcag2aa` → zero violations
- [ ] `npx axe-cli [URL]/login --tags wcag2aa` → zero violations
- [ ] All 19 placeholder routes still return 200 (none accidentally broken)
- [ ] End-to-end: sign up → enrol → dashboard → Realtime notification — all work

---

## Overall progress

```
M1  Foundation        [ ][ ][ ][ ]         0/4
M2  Member Data       [ ][ ][ ]            0/3
M3  UI System         [ ]                  0/1
M4  Realtime          [ ]                  0/1
M5  Alert Engine      [ ][ ]               0/2
M6  Family Dashboard  [ ][ ][ ]            0/3
─────────────────────────────────────────
TOTAL                                      0/14
```

---

## Blocked items log

When a phase reaches BLOCKED state, record it here.

| Phase | Date | Item | H1 | H2 | H3 | Needs |
|-------|------|------|----|----|-------|-------|
| — | — | — | — | — | — | — |

---

## Environment variables tracker

| Variable | Required at | `.env.local` | Vercel | Notes |
|----------|------------|-------------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | `[ ]` | `[ ]` | Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | `[ ]` | `[ ]` | Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | `[ ]` | `[ ]` | ⚠️ Server-only |
| `NEXT_PUBLIC_APP_URL` | Phase 1 | `[ ]` | `[ ]` | `http://localhost:3000` locally |
| `CARE_TEAM_EMAIL` | Phase 1 | `[ ]` | `[ ]` | Your email |
| `CRON_SECRET` | Phase 1 | `[ ]` | `[ ]` | `openssl rand -base64 32` |

---

## npm packages tracker

| Package | Phase installed | Purpose |
|---------|----------------|---------|
| `@supabase/supabase-js` | 2 | Supabase client |
| `@supabase/ssr` | 2 | SSR session handling |
| `date-fns` | 6 | DOB validation |
| `focus-trap-react` | 8 | Accessible Modal |
| `recharts` | 12 | Mood trend charts |

---

## Edge Functions tracker

| Function | Phase | Deployed | Verified |
|----------|-------|---------|---------|
| `push-notification` | 9 | `[ ]` | `[ ]` |
| `create-alert` | 10 | `[ ]` | `[ ]` |
| `check-missed-calls` | 10 | `[ ]` | `[ ]` |
| `family-nudge-check` | 14 | `[ ]` | `[ ]` |
