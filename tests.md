# Thrive@Home — Test Suite (v1.0 — M1–M6, Phases 1–14)

> **Every test must pass before the corresponding phase can be marked complete.**
> `[AUTO]` = run with a script in terminal. `[MANUAL]` = requires a human or real device. `[SUPABASE]` = verified in the Supabase dashboard.
> "Passed" means the expected output was personally observed — not assumed.

---

## Phase 1 — Project Scaffold

**T1.1** `[MANUAL]` Open Vercel deployment URL in browser.
- Expected: page loads, "Thrive@Home" visible in navy, zero red errors in browser DevTools console
- Fail: blank page, error, wrong colour, or any console error

**T1.2** `[MANUAL]` Push trivial change (add a space) to `main`, check Vercel dashboard.
- Expected: new deployment triggered within 60 seconds, deployment succeeds (green)
- Fail: no deployment or deployment fails

**T1.3** `[AUTO]` `npx tsc --noEmit`
- Expected: zero output (zero errors)
- Fail: any error or warning

**T1.4** `[MANUAL]` Run: `echo "TEST=secret" > .env.local && git status`
- Expected: `.env.local` appears under **"Untracked files"** only — never under "Changes to be committed"
- Fail: appears as tracked or staged

**T1.5** `[MANUAL]` Open `.env.local.example` — confirm all variable names present, all values blank.
- Expected: ≥ 30 variable names, no actual values
- Fail: any value present, or any variable name missing

**T1.6** `[MANUAL]` Run: `ls lib/interfaces/`
- Expected: all 8 interface files present: CallProvider.ts, SmsProvider.ts, EmailProvider.ts, AiProvider.ts, BillingProvider.ts, TransportProvider.ts, MealProvider.ts, GoodsProvider.ts
- Fail: any file missing

**T1.7** `[MANUAL]` Run: `ls lib/stubs/`
- Expected: all 8 stub files present (one per interface)
- Fail: any file missing

**T1.8** `[MANUAL]` Navigate to every placeholder page URL. Expected: each renders "Coming soon" message — no 404, no blank, no error.
- Check at minimum: `/navigator`, `/admin`, `/dashboard/billing`, `/dashboard/events`, `/dashboard/services`, `/volunteer`, `/privacy`

**T1.9** `[AUTO]` Confirm all providers export stubs when no service env vars are set:
```bash
node -e "
const p = require('./lib/providers');
const names = Object.values(p).map(v => v.constructor.name);
console.log(names.join(', '));
const allStub = names.every(n => n.includes('Stub'));
console.assert(allStub, 'Not all providers are stubs:', names);
"
```
- Expected: all constructor names contain "Stub"

---

## Phase 2 — Supabase Connection

**T2.1** `[MANUAL]` Navigate to `/test` (temporary test page).
- Expected: message from `connection_test` table appears on screen, matches what was manually inserted in Supabase

**T2.2** `[MANUAL]` Temporarily add "XXXXX" to `NEXT_PUBLIC_SUPABASE_URL`, restart dev server, navigate to any page.
- Expected: human-readable error about invalid environment variable — not a stack trace
- After test: restore correct value

**T2.3** `[AUTO]` After deleting test page and table: `npx tsc --noEmit` → zero errors.

**T2.4** `[MANUAL]` Open Supabase → `middleware.ts` is in place. Navigate to `/dashboard` while logged out.
- Expected: immediately redirected to `/login`

---

## Phase 3 — Database Schema

**T3.1** `[SUPABASE]` Open Supabase → Table Editor: all 17 core tables visible.
- Required tables: members, family_members, check_in_calls, alerts, care_navigators, navigator_assignments, navigator_tasks, navigator_notes, subscriptions, realtime_notifications, notification_log, emergency_log, medication_schedules, family_task_items, family_messages, document_vault_items, audit_log
- Fail: any table missing

**T3.2** `[SUPABASE]` Click each table — confirm columns match the schema in Section 4.3.
- Spot-check: `members` has `preferred_name`, `plan_tier`, `check_in_frequency`. `alerts` has `severity` as a typed enum column.

**T3.3** `[SUPABASE]` Database → Foreign Keys: confirm cascade relationships exist.
- Check: `family_members.member_id → members.id`, `check_in_calls.member_id → members.id`, `alerts.member_id → members.id`

**T3.4** `[AUTO]` Test cascade delete:
```sql
-- Run in Supabase SQL Editor
INSERT INTO members (full_name, preferred_name, date_of_birth, phone_number, plan_tier, status)
VALUES ('Cascade Test', 'Test', '1945-01-01', '+15550001234', 'basics', 'active')
RETURNING id;
-- Copy id into next query:
INSERT INTO family_members (member_id, supabase_auth_id, full_name, email, role)
VALUES ('[COPIED_ID]', gen_random_uuid(), 'Test Family', 'cascade@test.com', 'family');
-- Delete parent, confirm child deleted:
DELETE FROM members WHERE full_name = 'Cascade Test';
SELECT * FROM family_members WHERE email = 'cascade@test.com';
-- Expected: empty result (cascade delete worked)
```

**T3.5** `[SUPABASE]` Database → Replication: `realtime_notifications` listed with INSERT enabled.
- Fail: table not listed or INSERT not checked

**T3.6** `[AUTO]` Audit triggers confirmed:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```
- Expected: `members_audit`, `calls_audit`, `alerts_audit` all listed

**T3.7** `[SUPABASE]` Authentication → Policies: ALL 17 tables show "RLS enabled".
- Fail: any table showing "disabled"

---

## Phase 4 — RLS Verification

**T4.1** `[AUTO]` Run `/scripts/test-rls.ts`:
- Signs in as User A (linked to Member A), attempts to read Member B's data
- Expected output: `"Cross-user members: BLOCKED ✓"`, `"Own member: ACCESSIBLE ✓"`
- Fail: any row from Member B returned, or own member returns null

**T4.2** `[AUTO]` Admin bypass test in same script:
- Expected output: `"Admin reads all members: [count ≥ 2] ✓"`
- Fail: admin cannot read all rows

**T4.3** `[AUTO]` Realtime notifications RLS:
- User A cannot see notifications for Member B
- Expected: same BLOCKED result as T4.1

**T4.4** `[MANUAL]` All test data (users, members, related rows) deleted after test completes.
- Check Supabase Auth → Users: no leftover test accounts

---

## Phase 5 — Authentication

**T5.1** `[MANUAL]` Navigate to `/signup`, complete form, submit.
- Expected: Supabase Auth user created + `family_members` row with correct `supabase_auth_id`. Redirected to `/onboarding`.

**T5.2** `[MANUAL]` Log out. Navigate to `/dashboard` directly.
- Expected: immediately redirected to `/login`. Dashboard content never visible.

**T5.3** `[MANUAL]` Log out. Navigate to `/navigator` directly.
- Expected: redirected to `/login`.

**T5.4** `[MANUAL]` As `family` role user, type `/navigator` in URL bar.
- Expected: redirected to `/dashboard`.

**T5.5** `[MANUAL]` Manually set a user's `role` to `'navigator'` in Supabase. Log in.
- Expected: redirected to `/navigator`.

**T5.6** `[MANUAL]` Simulate failed `family_members` insert during signup (temporarily break the insert query).
- Expected: Supabase Auth user also deleted (no orphan). User sees a clear error message.
- After test: restore insert query.

**T5.7** `[MANUAL]` Log in with wrong password.
- Expected: "Invalid email or password. Please try again." — not which field is wrong, not a stack trace.

---

## Phase 6 — Member Onboarding Form

**T6.1** `[MANUAL]` Navigate to `/onboarding`. Click "Next" on Step 1 with all fields empty.
- Expected: error messages on every required field. Does NOT advance to Step 2.

**T6.2** `[MANUAL]` Enter `abc-not-a-phone` as phone number. Click "Next".
- Expected: phone validation error with format example.

**T6.3** `[MANUAL]` Enter today's date as date of birth.
- Expected: validation error — person must be older.

**T6.4** `[MANUAL]` Complete all 3 steps with valid data. Submit.
- Expected: `members` row in Supabase with all fields. `plan_tier = 'basics'` (not null). `family_members.member_id` updated. Redirected to `/onboarding/confirmation`. Correct preferred name shown — not "undefined".

**T6.5** `[MANUAL]` Partially fill form, refresh page.
- Expected: form data still present (localStorage working).

**T6.6** `[MANUAL]` Complete form on real phone at 375px width.
- Expected: no horizontal scroll, all buttons tappable, all labels readable.

**T6.7** `[SUPABASE]` Check new member row: `plan_tier = 'basics'`.
- Fail: null, empty, or any other value.

---

## Phase 7 — App Data Layer & Seed Data

**T7.1** `[AUTO]` Run `/scripts/test-data-layer.ts`:
```ts
// Script must verify:
// - getMember(validId) returns typed Member with all fields
// - getMember(invalidUUID) returns { data: null, error: 'Member not found' } — does not throw
// - getMember('not-a-uuid') returns { data: null, error: 'Invalid member ID format' }
// - getActiveAlerts(validId) returns empty array for member with no alerts — not null
// - getUnreadNotifications(validId) returns array — not null
// - All test rows cleaned up at end
console.log('✓ All data layer tests passed')
```
- Expected: "✓ All data layer tests passed" — no assertion failures

**T7.2** `[AUTO]` `npx tsc --noEmit` → zero errors.

**T7.3** `[AUTO]` Run `/scripts/seed-test-data.ts`.
- Expected: terminal prints "Seed complete. Login: test-family@thriveathome.dev / TestPassword123!"
- Check Supabase: `members` row for "Margaret Chen", 14 `check_in_calls` rows, 2 `alerts` rows, 2 `realtime_notifications` rows

**T7.4** `[AUTO]` Run seed script a second time immediately.
- Expected: "Already exists — skipping" messages. No duplicate rows. Row count unchanged.

**T7.5** `[AUTO]` Run `/scripts/clear-test-data.ts`.
- Expected: completes without errors. Supabase: Margaret Chen row deleted, all related rows deleted.

---

## Phase 8 — Primitive UI Components

**T8.1** `[MANUAL]` Navigate to `/test-ui` (temporary page rendering all components).
- Expected: all 13 components visible in all variants. No blank areas, no console errors.
- Check specifically: MoodEmoji shows 😊 for score 9, 😐 for 5, — for null. StatusDot shows green/amber/red for correct statuses. NotificationBell shows "0" count with no errors.

**T8.2** `[MANUAL]` Tab through all components using only keyboard.
- Expected: every button, bell, and interactive element reachable by Tab. Focus ring always visible. Enter/Space activates buttons.

**T8.3** `[MANUAL]` Resize browser to 375px width. Check test-ui page.
- Expected: no horizontal scroll, all content visible, no overlapping elements.

**T8.4** `[AUTO]` `npx tsc --noEmit` → zero errors.

**T8.5** `[MANUAL]` Delete `/app/test-ui/page.tsx`. Confirm app still builds (`npx tsc --noEmit`).

---

## Phase 9 — Supabase Realtime

**T9.1** `[MANUAL]` Run seed script. Log in as seeded family member. Open dashboard in one browser tab. Open Supabase SQL Editor in another tab. Insert:
```sql
INSERT INTO realtime_notifications (member_id, type, title, body, severity)
VALUES ('[MARGARET_MEMBER_ID]', 'new_alert', 'Test notification', 'This is a realtime test.', 'concern');
```
- Expected: toast notification appears in dashboard tab within **2 seconds** — no page refresh required
- Bell count increments to 1
- Fail: notification only appears after page refresh

**T9.2** `[MANUAL]` Click the NotificationBell.
- Expected: dropdown opens, shows the test notification, "Mark read" button visible.

**T9.3** `[MANUAL]` Click "Mark read".
- Expected: notification removed from dropdown. Bell count → 0. Supabase row: `read = true`, `read_at` timestamp set.

**T9.4** `[MANUAL]` Log in as a different user (User B linked to Member B). Insert a notification for Member B via SQL Editor while User A's dashboard is open.
- Expected: User A does NOT see User B's notification. (RLS working on Realtime channel.)

**T9.5** `[AUTO]` Call `pushRealtimeNotification` with a non-existent `member_id`:
- Expected: function logs error to console but does NOT throw. Calling code continues running normally.

**T9.6** `[MANUAL]` Confirm Edge Function `push-notification` is deployed:
```bash
supabase functions list
```
- Expected: `push-notification` listed with status "active"

---

## Phase 10 — Alert Logic & Detection

**T10.1** `[AUTO]` Alert rules test — for each rule, create a call record with the triggering condition and verify the correct alert is created:
```ts
// crisis flag → emergency alert + emergency_log entry
// fall flag → urgent alert
// medication_taken false → informational medication_miss
// mood_score 2 → concern mood_drop
// pain_score 8 → concern wellness_drift
// Expected: each creates correct alert_type + severity combination
```
- Expected: all rule-severity mappings correct.

**T10.2** `[AUTO]` Deduplication test:
```ts
// Create an alert for a member with alert_type = 'fall'
// Attempt to create the same alert again within 24 hours
// Expected: only 1 row in alerts table, not 2
```

**T10.3** `[MANUAL]` After T10.1 creates alerts, open the seeded member's dashboard.
- Expected: alert card appears in Alerts Panel within 2 seconds via Realtime (no page refresh).

**T10.4** `[AUTO]` Wellness drift test:
```ts
// Insert 14 calls: last 7 days avg ~3.4, prior 7 days avg ~7.7
// Run checkWellnessDrift
// Expected: concern drift alert created
// Insert 14 flat calls at score 6
// Run checkWellnessDrift again
// Expected: no alert created (no significant drift)
```

**T10.5** `[AUTO]` Insufficient data test:
```ts
// Insert only 2 calls for a member
// Run checkWellnessDrift
// Expected: no alert, no error — insufficient data is handled gracefully
```

---

## Phase 11 — Crisis Detection

**T11.1** `[AUTO]` Crisis phrase detected — confirm all 5 steps within 60 seconds:
```ts
const crisisTranscript = `
Aria: How are you feeling today?
Margaret: I just don't want to be here anymore. I see no point in any of it.
Aria: I hear you. That sounds really difficult.
`
// Process transcript through crisis detection
// Expected within 60 seconds:
// 1. emergency_log row with triggered phrase
// 2. crisis alert in alerts table with severity = 'emergency'
// 3. critical priority row in navigator_tasks
// 4. realtime_notification with severity = 'emergency'
// 5. Stub SMS log: "[STUB][SMS][URGENT] Would send to..."
```
- Expected: all 5 items confirmed.

**T11.2** `[AUTO]` False positive prevention:
```ts
// "fell asleep watching TV" → NO fall flag
// "I want to die laughing at this show" → disambiguation runs → not classified as crisis
// "My back pain is killing me" → NO crisis flag
```
- Expected: no false positive crisis detection.

**T11.3** `[AUTO]` Normal transcript → no crisis flags:
```ts
const normalTranscript = `
Aria: Hi Margaret, how are you today?
Margaret: Oh, quite well! Had coffee on the porch, took my pills. Knee is better today.
`
// Expected: no emergency_log entry, no crisis alert, no navigator task
```

**T11.4** `[AUTO]` Fail-safe test: mock the `disambiguateCrisisContext` to throw an error.
- Expected: function returns `true` (treats as crisis). Escalation still fires.

---

## Phase 12 — Family Dashboard

**T12.1** `[MANUAL]` Run seed script. Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`.
- Expected: loads within 3 seconds. "Margaret" in header. StatusDot visible. Wellness Card shows mood emoji + scores + summary text. Health timeline renders. Bell icon shows "1" (one unread from seed data).

**T12.2** `[MANUAL]` While dashboard is open, insert a new alert via SQL Editor.
- Expected: alert card appears in Alerts Panel within 2 seconds. StatusDot changes colour. No page refresh.

**T12.3** `[MANUAL]` Click each tab in the Health Timeline: 7 Days, 30 Days, 60 Days, 90 Days.
- Expected: chart renders for each. Stub AI summary text appears below each chart. No errors.

**T12.4** `[MANUAL]` Break Supabase temporarily (corrupt URL), reload dashboard.
- Expected: friendly human-readable error message. No raw error code or stack trace visible.

**T12.5** `[MANUAL]` Open dashboard on real phone (or DevTools at 375px).
- Expected: no horizontal scroll, all text readable, all buttons tappable.

**T12.6** `[MANUAL]` Acknowledge an alert card on the dashboard.
- Expected: card disappears immediately (optimistic update). Supabase: `acknowledged = true`, `acknowledged_by` set, `acknowledged_at` set.

---

## Phase 13 — Call History Page

**T13.1** `[MANUAL]` With 14 seeded calls, navigate to `/dashboard/history`.
- Expected: calls listed newest-first, mood emoji shown, medication status shown, alert badge icons visible on calls with alert_flags.

**T13.2** `[MANUAL]` Click "View summary" on any call.
- Expected: AI summary expands. All scores shown. Alert flags displayed in plain English (not raw flag names like "pain_high").

**T13.3** `[AUTO]` Insert 25 call records for the test member. Navigate to `/dashboard/history`.
- Expected: first 20 shown. "Load more" button appears. Clicking appends next 20 without page reload.

**T13.4** `[MANUAL]` Navigate to `/dashboard/history` with no calls in database (clear first).
- Expected: empty state message appears. No error. No blank page.

---

## Phase 14 — Family Coordination Tools

**T14.1** `[MANUAL]` Create a task as User A on the task board.
- Expected: task appears immediately for User B (both linked to same member) via Realtime — no page refresh.

**T14.2** `[MANUAL]` Mark a task complete.
- Expected: task moves to "completed" section or disappears. Supabase: `completed = true`, `completed_at` set.

**T14.3** `[MANUAL]` Send a message in family messaging as User A. Check as User B.
- Expected: message appears for User B in real time — no page refresh.

**T14.4** `[MANUAL]` Upload a PDF to the document vault.
- Expected: file appears in the document list. "Download" button generates a working signed URL. File is accessible via the signed URL for at least 5 minutes.

**T14.5** `[MANUAL]` Upload a file over 10MB.
- Expected: clear error message: file too large. Upload does not proceed.

**T14.6** `[MANUAL]` Set `last_login_at` for a family member to 8 days ago in Supabase. Ensure their member has an unacknowledged concern alert. Trigger the `family-nudge-check` Edge Function manually.
- Expected: a `family_nudge` Realtime notification appears in that family member's bell within 10 seconds.

**T14.7** `[MANUAL]` Trigger the nudge again immediately for the same family member.
- Expected: second nudge NOT sent (7-day rate limit respected).

**T14.8** `[SUPABASE]` Storage → Buckets: `member-documents` bucket exists, is private (not public).
- Fail: bucket is public or does not exist.

---

## Milestone Gate Tests (run after all phases in a milestone are `[x]`)

### M1 Gate
- T1.3 (TypeScript zero errors) ✓
- T1.4 (.env.local untracked) ✓
- T3.7 (all tables have RLS) ✓
- T3.5 (Realtime enabled) ✓
- T4.1 (cross-user isolation) ✓

### M2 Gate
- T5.6 (no orphaned auth users) ✓
- T6.4 (onboarding creates member with plan_tier = basics) ✓
- T7.3 (seed script creates Margaret Chen) ✓

### M3 Gate
- T8.2 (keyboard navigation works) ✓
- T8.5 (test-ui page deleted) ✓

### M4 Gate
- T9.1 (notification in 2 seconds, no page refresh) ✓
- T9.4 (RLS on Realtime confirmed) ✓

### M5 Gate
- T10.2 (deduplication confirmed) ✓
- T11.1 (all 5 crisis escalation steps) ✓
- T11.4 (fail-safe confirmed) ✓

### M6 Gate (full V1 completion)
- T12.2 (Realtime alert on dashboard, no refresh) ✓
- T12.5 (mobile at 375px) ✓
- T14.4 (document vault upload + signed URL) ✓
- T14.6 (nudge fires for 7+ day inactive family member) ✓
- `npx axe-cli [URL]/dashboard --tags wcag2aa` → zero violations ✓
