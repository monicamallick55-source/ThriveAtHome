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
STATUS: `COMPLETE`

- [x] `.gitignore` exists and `.env.local` is untracked — `echo "TEST=secret" > .env.local && git status` → under "Untracked files" only
- [x] Project deploys to Vercel — APPROVED by human
- [x] Auto-deploy works — APPROVED by human
- [x] `npx tsc --noEmit` passes — zero output
- [x] All 8 interfaces exist — `ls lib/interfaces/ | wc -l` → 8
- [x] All 8 stubs exist — `ls lib/stubs/ | wc -l` → 8
- [x] All providers resolve to stubs — tsx check → all 8 are Stub classes → true
- [x] All 19 placeholder routes return 200 — curl tested all 23 routes (19 placeholders + /, /login, /signup, /pricing) → all 200
- [x] No `.env` file tracked — `.env.local.example` committed (safe, empty values); `.env.local` is gitignored

### Phase 2 — Supabase Connection
STATUS: `COMPLETE`

- [x] Browser client connects — `/test` page shows "Supabase connection successful" via admin client
- [x] Error state is human-readable — bad URL → "Unable to connect to the database." (no stack trace)
- [x] Admin client is server-only — uses `requireServerEnv` which throws on browser access
- [x] `npx tsc --noEmit` passes after test page deleted

### Phase 3 — Database Schema
STATUS: `COMPLETE`

- [x] All 17 tables exist — `npx tsx scripts/verify-phase3.ts` → all 17 found
- [x] All FK relationships exist — cascade delete verified (member deleted → family_members row auto-deleted)
- [x] RLS enabled on all tables — RLS confirmed blocking unauthenticated access; `003_fix_rls.sql` applied, recursion fixed, re-verified: 0 rows returned for anon
- [x] Realtime enabled for `realtime_notifications` — confirmed by human (Supabase → Replication → INSERT enabled)
- [x] Audit triggers exist — `members_audit` fires on INSERT: 1 audit row written to `audit_log` (verified programmatically)

### Phase 4 — RLS Verification
STATUS: `COMPLETE`

- [x] Cross-user isolation confirmed — `npx tsx scripts/test-rls.ts` → 9/9 assertions PASSED (User A cannot see Member B, User B cannot see Member A, service role sees both)
- [x] No test rows remain — all 4 test rows deleted by script (2 members CASCADE → 2 family_members, 2 auth users deleted)

**M1 gate:** All 4 phases `[x]` before Phase 5.

---

## M2 — Member Data

### Phase 5 — Authentication
STATUS: `COMPLETE`

- [x] Signup creates auth user + family_members row — APPROVED by human: both rows confirmed in Supabase
- [x] Unauthenticated `/dashboard` → redirected to `/login` — curl 307 confirmed
- [x] Family user blocked from `/navigator` — APPROVED by human: redirects correctly
- [x] Navigator user redirected to `/navigator` on login — APPROVED by human: confirmed working
- [x] Orphaned auth user prevented — APPROVED by human: rollback verified

### Phase 6 — Member Onboarding Form
STATUS: `COMPLETE`

- [x] Empty required fields block Next — APPROVED by human
- [x] DOB < 60 years rejected — APPROVED by human
- [x] Invalid phone rejected — APPROVED by human
- [x] Successful submission creates member row with `plan_tier='basics'` — APPROVED by human
- [x] Confirmation shows correct preferred name — APPROVED by human
- [x] Form state survives page refresh — APPROVED by human
- [x] Mobile layout at 375px — APPROVED by human

### Phase 7 — App Data Layer & Seed Data
STATUS: `COMPLETE`

- [x] All data functions return `{data, error}`, never throw — `npx tsx scripts/test-data-layer.ts` → 27/27 PASSED
- [x] Invalid ID returns `{data: null, error: 'Not found'}` — verified: getMemberById, getCallById, completeFamilyTask all return correct shape
- [x] Seed script creates correct data — ran successfully; prints credentials; 14 calls (mood arc 8,8,7,8,7,6,7,6,5,6,5,5,4,5) in Supabase
- [x] Seed script is idempotent — ran twice; second run shows all "↩ Already exists" skips, same row count
- [x] Clear script removes all seeded data without error — ran successfully, all rows removed via cascade
- [x] `npx tsc --noEmit` passes — zero errors

**M2 gate:** All 3 phases `[x]` before Phase 8.

---

## M3 — UI System

### Phase 8 — Primitive UI Components
STATUS: `IN PROGRESS`

- [ ] All 14 components render in all variants — visually confirmed at `/test-ui`
- [ ] All interactive elements keyboard-reachable — Tab navigation confirmed, Tabs uses roving tabindex + arrow keys
- [ ] Modal focus trap works — Tab stays inside, Escape closes
- [x] `npx tsc --noEmit` passes — zero errors confirmed
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
M1  Foundation        [x][x][x][x]         4/4  ✅ COMPLETE
M2  Member Data       [x][x][x]            3/3  ✅ COMPLETE
M3  UI System         [ ]                  0/1
M4  Realtime          [ ]                  0/1
M5  Alert Engine      [ ][ ]               0/2
M6  Family Dashboard  [ ][ ][ ]            0/3
─────────────────────────────────────────
TOTAL                                      5/14
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
