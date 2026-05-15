# Thrive@Home — Test Suite (v1.0)

> **Each test here corresponds to exactly one checklist item in `checklist.md`.**
> `[AUTO]` = terminal command with expected output. `[MANUAL]` = requires a browser or real device.
>
> "Passed" means the expected output was personally observed. "It probably works" is not a passing test.
> The agent runs these during the inner loop's TESTING state.
> The human runs the stress tests during their phase review.

---

## Phase 1 — Project Scaffold

**T1.1** `[MANUAL]` Open Vercel deployment URL in a browser.
- Expected: "Thrive@Home" in navy text, tagline in teal, DevTools Console → zero red errors
- Fail: blank page, error, wrong colours, any console error

**T1.2** `[MANUAL]` Push trivial change to `main`.
- Expected: Vercel shows new deployment within 60 seconds; deployment succeeds (green checkmark)
- Fail: no deployment, or deployment fails

**T1.3** `[AUTO]`
```bash
npx tsc --noEmit
```
- Expected: zero output
- Fail: any error line

**T1.4** `[AUTO]`
```bash
echo "TEST=secret" > .env.local && git status
```
- Expected: `.env.local` under "Untracked files" ONLY
- Fail: appears as staged or tracked

**T1.5** `[AUTO]`
```bash
ls lib/interfaces/ | wc -l
```
- Expected: 8
- Fail: any other number

**T1.6** `[AUTO]`
```bash
ls lib/stubs/ | wc -l
```
- Expected: 8
- Fail: any other number

**T1.7** `[AUTO]`
```bash
node -e "
const p = require('./lib/providers')
const all = Object.keys(p).map(k => p[k].constructor.name).every(n => n.startsWith('Stub'))
console.log(all ? '✅ All stubs' : '❌ Real provider active')
"
```
- Expected: `✅ All stubs`
- Fail: `❌ Real provider active` or any error

**T1.8** `[MANUAL]` Navigate to every URL from Rule 12 placeholder list.
- Expected: Every route shows "Coming soon" content, status 200, no 404
- Fail: any 404 or error page

**T1.9** `[AUTO]`
```bash
git ls-files | grep -E "^\.env"
```
- Expected: no output
- Fail: any output

---

## Phase 2 — Supabase Connection

**T2.1** `[MANUAL]` Navigate to `/test`.
- Expected: row text from `connection_test` table visible on screen; matches what was inserted
- Fail: blank, "undefined", "null", spinner, or any error

**T2.2** `[MANUAL]` Add "XXXXX" to `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, restart dev server, load any page.
- Expected: human-readable error message about missing/invalid env var — no stack trace
- After: restore correct value
- Fail: blank page, generic error, or silent failure

**T2.3** `[MANUAL]` Attempt to import `createAdminClient` directly in a Client Component.
- Expected: TypeScript error or runtime error with a clear message about server-only access
- After: remove the import
- Fail: no error — admin client accessible from browser

**T2.4** `[AUTO]` After deleting test page and table:
```bash
npx tsc --noEmit
```
- Expected: zero errors
- Fail: any TypeScript error

---

## Phase 3 — Database Schema

**T3.1** `[MANUAL]` Supabase → Table Editor. Count tables.
- Expected: exactly 17 tables listed: `members`, `family_members`, `check_in_calls`, `alerts`, `care_navigators`, `navigator_assignments`, `navigator_tasks`, `navigator_notes`, `subscriptions`, `realtime_notifications`, `notification_log`, `emergency_log`, `medication_schedules`, `family_task_items`, `family_messages`, `document_vault_items`, `audit_log`
- Fail: any table missing

**T3.2** `[MANUAL]` Supabase → Database → Foreign Keys.
- Expected: all major FK relationships visible: `family_members.member_id → members.id`, `check_in_calls.member_id → members.id`, `alerts.member_id → members.id`, `realtime_notifications.member_id → members.id`
- Fail: any relationship missing

**T3.3** `[AUTO]` Cascade delete test — run in Supabase SQL Editor:
```sql
INSERT INTO members (full_name, preferred_name, date_of_birth, phone_number, plan_tier, status)
VALUES ('Cascade Test', 'Test', '1945-01-01', '+15550001234', 'basics', 'active') RETURNING id;
-- Copy id, then:
INSERT INTO family_members (member_id, supabase_auth_id, full_name, email, role)
VALUES ('[ID]', gen_random_uuid(), 'Test Family', 'cascade@test.com', 'family');
DELETE FROM members WHERE full_name = 'Cascade Test';
SELECT * FROM family_members WHERE email = 'cascade@test.com';
```
- Expected: SELECT returns empty (cascade deleted)
- Fail: family_members row still exists

**T3.4** `[MANUAL]` Supabase → Authentication → Policies.
- Expected: all 17 tables show "RLS enabled" — none show "disabled"
- Fail: any table showing disabled

**T3.5** `[MANUAL]` Supabase → Database → Replication.
- Expected: `realtime_notifications` listed with INSERT events enabled
- Fail: not listed or INSERT not checked

**T3.6** `[AUTO]` Run in Supabase SQL Editor:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY trigger_name;
```
- Expected: `alerts_audit`, `calls_audit`, `members_audit` all listed
- Fail: any trigger missing

---

## Phase 4 — RLS Verification

**T4.1** `[AUTO]`
```bash
npx tsx scripts/test-rls.ts
```
- Expected output:
  ```
  ✅ Cross-user isolation: PASSED — User A cannot read Member B
  ✅ Own data access: PASSED — User A can read Member A
  ✅ Notifications isolated: PASSED — User A cannot see Member B's notifications
  ✅ Service role reads all: PASSED — admin client returns both members
  ✅ All test data cleaned up
  ```
- Fail: any FAILED line or uncaught error

**T4.2** `[MANUAL]` Supabase → Table Editor → `members`. Check for test rows.
- Expected: no rows with test email addresses remain
- Fail: test rows still present

---

## Phase 5 — Authentication

**T5.1** `[MANUAL]` Navigate to `/signup`, fill in all required fields, submit.
- Expected: Supabase → Auth → Users shows new user; `family_members` has row with `role='family'` and matching `supabase_auth_id`; browser redirects to `/onboarding`
- Fail: no Auth user, no family_members row, no redirect

**T5.2** `[MANUAL]` Log out. Navigate to `/dashboard`.
- Expected: immediately redirected to `/login` — dashboard content never visible
- Fail: dashboard loads for a logged-out user

**T5.3** `[MANUAL]` Log out. Navigate to `/navigator` and `/admin`.
- Expected: both redirect to `/login`
- Fail: either page loads

**T5.4** `[MANUAL]` Set a `family_members.role` to `'navigator'` in Supabase. Log in as that user.
- Expected: lands on `/navigator`, not `/dashboard`
- Fail: navigator user lands on `/dashboard`

**T5.5** `[MANUAL]` Log in as family role user. Navigate to `/navigator`.
- Expected: redirected to `/dashboard`
- Fail: navigator page loads for family user

**T5.6** `[MANUAL]` Temporarily add `throw new Error('test')` after auth user creation but before `family_members` insert. Attempt signup.
- Expected: Supabase Auth → Users does NOT contain the new user (rollback succeeded). User sees clear error on signup page.
- After: remove the thrown error
- Fail: orphaned auth user exists with no `family_members` row

---

## Phase 6 — Member Onboarding Form

**T6.1** `[MANUAL]` Click "Next" on Step 1 with all fields empty.
- Expected: error messages below every required field; page does NOT advance
- Fail: form advances with empty fields

**T6.2** `[MANUAL]` Enter today's date as DOB.
- Expected: error — must be at least 60 years old
- Fail: any date accepted

**T6.3** `[MANUAL]` Enter `abc-xyz-123` as phone number.
- Expected: validation error with format example
- Fail: non-numeric phone accepted

**T6.4** `[MANUAL]` Complete all 3 steps with valid data and submit.
- Expected: `members` row in Supabase with `plan_tier='basics'`, `family_members.member_id` linked, redirected to confirmation page, preferred name shows correctly
- Fail: any field missing, plan_tier wrong, "undefined" in confirmation

**T6.5** `[MANUAL]` Fill Step 2 partially, then refresh the browser.
- Expected: Step 2 data preserved (localStorage)
- Fail: all data lost on refresh

**T6.6** `[MANUAL]` Complete form on a real phone at 375px.
- Expected: no horizontal scroll, all buttons tappable, all text readable
- Fail: any element cut off or requiring zoom

**T6.7** `[MANUAL]` Check `plan_tier` for the created member in Supabase.
- Expected: `basics` — not null, not empty
- Fail: null or any other value

---

## Phase 7 — App Data Layer & Seed Data

**T7.1** `[AUTO]`
```bash
npx tsx scripts/test-data-layer.ts
```
- Expected: `✅ All data layer tests passed`
- Fail: any assertion fails or script exits with code 1

**T7.2** `[AUTO]`
```bash
npx tsx scripts/seed-test-data.ts
```
- Expected: prints `Login: test-family@thriveathome.dev / TestPassword123! | Member: Margaret Chen`. Supabase has Margaret Chen row + 14 call rows.
- Fail: error, missing rows, or no credentials printed

**T7.3** `[AUTO]` Run seed script a second time.
- Expected: no errors; same row count as after first run
- Fail: duplicate rows created or error thrown

**T7.4** `[AUTO]`
```bash
npx tsx scripts/clear-test-data.ts
```
- Expected: all seeded rows removed; no errors
- Fail: rows remain or script errors

**T7.5** `[AUTO]`
```bash
npx tsc --noEmit
```
- Expected: zero errors
- Fail: any TypeScript error

---

## Phase 8 — Primitive UI Components

**T8.1** `[MANUAL]` Navigate to `/test-ui`.
- Expected: all 13 components visible in all variants — Button (4 variants), Card (4), Badge (all severity/tier), Input with label+error, Select, Textarea, Skeleton, StatusDot (3 colours), MoodEmoji (5 score ranges + null), NotificationBell with 0 count, Toast, Modal (opens), Tabs, ProgressBar
- Fail: any component missing or rendering error

**T8.2** `[MANUAL]` Tab through entire `/test-ui` page — no mouse.
- Expected: every interactive element reachable, focus ring visible on each
- Fail: any element unreachable by keyboard, or invisible focus state

**T8.3** `[MANUAL]` Open the Modal.
- Expected: Tab key stays inside Modal (focus trapped); Escape closes; focus returns to trigger element
- Fail: Tab escapes Modal, Escape doesn't close, or focus lost

**T8.4** `[AUTO]`
```bash
npx tsc --noEmit
```
- Expected: zero errors

**T8.5** `[AUTO]`
```bash
ls app/test-ui
```
- Expected: directory not found
- Fail: directory exists (test page not deleted)

---

## Phase 9 — Supabase Realtime

**T9.1** `[MANUAL]` Open `/dashboard` in one browser tab. In Supabase SQL Editor (another tab), insert:
```sql
INSERT INTO realtime_notifications (member_id, type, title, body, severity)
VALUES ('[MARGARET_MEMBER_ID]', 'new_alert', 'Test', 'Realtime test.', 'concern');
```
- Expected: toast notification appears in dashboard tab within 2 seconds, no page refresh; bell count becomes 1
- Fail: notification doesn't appear, or requires page refresh

**T9.2** `[MANUAL]` Click bell. Click "Mark read".
- Expected: bell count → 0; Supabase row `read=true` with `read_at` timestamp
- Fail: count doesn't change, or DB row not updated

**T9.3** `[MANUAL]` While logged in as User A (Member A's family), insert notification for Member B.
- Expected: User A does NOT see the notification
- Fail: User A sees another member's notification

**T9.4** `[AUTO]` Call `pushRealtimeNotification` with a non-existent `member_id`:
```ts
await pushRealtimeNotification({
  type: 'system_message', memberId: '00000000-0000-0000-0000-000000000000',
  title: 'Test', body: 'Test'
})
```
- Expected: function logs error, does NOT throw; calling code continues
- Fail: function throws

**T9.5** `[AUTO]`
```bash
supabase functions list --project-ref <ref>
```
- Expected: `push-notification` appears in list
- Fail: not listed or shows error state

---

## Phase 10 — Alert Logic & Detection

**T10.1** `[AUTO]`
```bash
npx tsx scripts/test-alert-rules.ts
```
- Expected: `✅ All alert rule tests passed` — all 8 rules verified with correct type and severity

**T10.2** `[AUTO]` Test script includes deduplication:
- Expected: calling same alert type twice in 24h creates exactly 1 row, not 2

**T10.3** `[MANUAL]` Dashboard open. Create test alert via script.
- Expected: alert card appears and StatusDot updates within 2 seconds, no page refresh

**T10.4** `[AUTO]`
```bash
npx tsx scripts/test-wellness-drift.ts
```
- Expected: declining scores → `concern` alert created; flat scores at 6 → no alert

**T10.5** `[AUTO]` Test script mocks the `alerts` INSERT to fail on a crisis call.
- Expected: `emergency_log` row exists even when `alerts` insert fails

**T10.6** `[AUTO]`
```bash
supabase functions list --project-ref <ref>
```
- Expected: `create-alert` and `check-missed-calls` both listed

---

## Phase 11 — Crisis Detection

**T11.1** `[AUTO]`
```bash
npx tsx scripts/test-crisis-detection.ts
```
With transcript containing "I don't want to be here anymore":
- Expected: within the test run, all 5 steps confirmed:
  1. `emergency_log` row with triggered phrase
  2. `emergency` alert in `alerts` table
  3. `critical` navigator task
  4. Realtime notification with `severity='emergency'`
  5. Console shows: `[STUB][SMS][URGENT] Would send to...`

**T11.2** `[AUTO]` Run with normal transcript.
- Expected: none of the 5 steps fire

**T11.3** `[AUTO]` Run with "I fell asleep watching TV last night".
- Expected: no crisis detection fires

**T11.4** `[AUTO]` Mock the phrase scanner to throw. Run test.
- Expected: navigator task created "Crisis detection failed — manual transcript review required"; call processing continues; error logged

---

## Phase 12 — Family Dashboard

**T12.1** `[MANUAL]` Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`. Time from navigation to all sections loaded.
- Expected: all sections loaded within 3 seconds; no "undefined", no spinners; mood chart visible; all 4 timeline tabs clickable

**T12.2** `[MANUAL]` While dashboard is open, insert test alert via SQL Editor:
```sql
INSERT INTO alerts (member_id, alert_type, severity, message)
VALUES ('[MARGARET_MEMBER_ID]', 'mood_drop', 'concern', 'Realtime dashboard test');
```
- Expected: alert card appears in Alerts Panel and StatusDot changes within 2 seconds — no page refresh

**T12.3** `[MANUAL]` Click each health timeline tab (7-day, 30-day, 60-day, 90-day).
- Expected: each tab renders a chart without error or blank state

**T12.4** `[MANUAL]` Remove `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`, restart dev server, load dashboard.
- Expected: friendly per-section error messages — no raw error codes or stack traces visible
- After: restore env var

**T12.5** `[MANUAL]` Open dashboard on a real phone at 375px.
- Expected: no horizontal scroll, all text readable without zooming, all buttons tappable

---

## Phase 13 — Call History Page

**T13.1** `[MANUAL]` Navigate to `/dashboard/calls` with seed data.
- Expected: calls listed newest-first; each row shows date, MoodEmoji, medication status; no raw flag names visible

**T13.2** `[MANUAL]` Click a call row with alert flags to expand.
- Expected: full AI summary paragraph; plain-English flag labels (e.g. "Aria noted a mention of a fall" not "fall")

**T13.3** `[MANUAL]` With 25+ calls: scroll to bottom of first 20, confirm "Load more" button.
- Expected: button appears; clicking appends more calls; page does NOT reload

---

## Phase 14 — Family Coordination Tools

**T14.1** `[MANUAL]` Two browser windows. User A creates task. User B's window.
- Expected: task appears for User B within 2 seconds — no page refresh

**T14.2** `[MANUAL]` User A sends message. User B's window.
- Expected: message appears within 2 seconds — no page refresh

**T14.3** `[MANUAL]` Upload a PDF under 10MB.
- Expected: file appears in list with file name and upload date; "Download" starts the download

**T14.4** `[MANUAL]` Upload a file over 10MB.
- Expected: clear error message — file too large; upload does not proceed

**T14.5** `[AUTO]` Set `last_login_at` to 8 days ago, confirm `concern` alert exists, trigger `family-nudge-check` Edge Function.
- Expected: `family_nudge` row inserted in `realtime_notifications`; `notification_log` has 1 row for this nudge

**T14.6** `[AUTO]` Trigger `family-nudge-check` again within 7 days.
- Expected: no second row inserted in `realtime_notifications`

**T14.7** `[AUTO]`
```bash
supabase functions list --project-ref <ref>
```
- Expected: `family-nudge-check` listed

---

## M6 Final Gate — Before V1 Complete

**TG.1** `[AUTO]` `npx tsc --noEmit` → zero errors

**TG.2** `[AUTO]` `git ls-files | grep -E "^\.env"` → no output

**TG.3** `[AUTO]`
```bash
npx axe-cli http://localhost:3000/dashboard --tags wcag2aa
npx axe-cli http://localhost:3000/onboarding --tags wcag2aa
npx axe-cli http://localhost:3000/login --tags wcag2aa
```
- Expected: zero violations on all three

**TG.4** `[MANUAL]` Navigate to all 19 placeholder routes.
- Expected: all return "Coming soon" content — none broken, none accidentally given business logic

**TG.5** `[MANUAL]` End-to-end: sign up → enrol Margaret Chen → view dashboard → insert test alert → notification appears.
- Expected: all steps complete without error; Realtime confirmed

---

## Human stress tests (your review — not the agent's)

These test scenarios the agent does not test. Run them during your phase review.

### Phase 5 stress tests
- Sign up with an email that already exists → should show clear error, not crash
- Sign up with a very weak password → should show clear error
- Navigate directly to `/onboarding` without completing signup → should redirect to `/login`

### Phase 6 stress tests
- Enter a date of birth from the future → should error
- Complete Step 3 then close the tab and reopen — form should restore from localStorage
- Try to complete onboarding for a second member while already linked to one

### Phase 9 stress tests
- Disconnect from the internet while the dashboard is open, reconnect → Realtime should resume
- Open the dashboard in 3 browser tabs — all 3 should receive the notification simultaneously

### Phase 11 stress tests
- "I don't want to be here at the beach" → disambiguation should return false (not a crisis)
- "I'm so tired of living like this in this cold apartment" → ambiguous — verify disambiguation runs

### Phase 12 stress tests
- Load dashboard with very long AI summary text → should not overflow
- Set all 14 seed call mood scores to 1 → status dot should be red, timeline shows all red dots
- Open dashboard while no calls exist at all → should show empty state gracefully, not crash
