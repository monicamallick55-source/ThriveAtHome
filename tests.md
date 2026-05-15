# Thrive@Home — Test Suite (v1.0)

> **Every test must pass before the phase is marked complete.**
> `[AUTO]` = run with a script in the terminal. `[MANUAL]` = requires a human and a real browser or device. `[LIVE]` = calls a real external service and may incur cost or have side effects.
>
> "Passed" means the expected output was personally observed. "It probably works" is not a passing test.

---

## M1 — Foundation

### Phase 1 — Project Scaffold

**T1.1** `[MANUAL]` Open the Vercel deployment URL in a browser.
- Expected: "Thrive@Home" in navy text, tagline in teal, browser DevTools Console shows **zero** red errors
- Fail: blank page, error message, wrong colours, any console error

**T1.2** `[MANUAL]` Push a trivial change (add a space to `app/page.tsx`) to `main`.
- Expected: Vercel dashboard shows a new deployment triggered within 60 seconds; deployment succeeds (green checkmark)
- Fail: no deployment triggered, or deployment fails

**T1.3** `[AUTO]`
```bash
npx tsc --noEmit
```
- Expected: zero output (zero errors)
- Fail: any error or warning line

**T1.4** `[MANUAL]`
```bash
echo "TEST=secret" > .env.local && git status
```
- Expected: `.env.local` appears under **"Untracked files"** only — never under "Changes to be committed"
- Fail: `.env.local` appears as staged or tracked
- After: `.env.local` already exists from Phase 1 setup — this just confirms `.gitignore` is working

**T1.5** `[MANUAL]` Open `.env.local.example`. Confirm all variable names are present and every value is blank.
- Expected: 30+ variable names, all values blank or empty
- Fail: any value filled in, or any variable name from the spec missing

**T1.6** `[MANUAL]`
```bash
ls lib/interfaces/
```
- Expected: 8 files — `CallProvider.ts`, `SmsProvider.ts`, `EmailProvider.ts`, `AiProvider.ts`, `BillingProvider.ts`, `TransportProvider.ts`, `MealProvider.ts`, `GoodsProvider.ts`
- Fail: any file missing

**T1.7** `[MANUAL]`
```bash
ls lib/stubs/
```
- Expected: 8 stub files, one for each interface
- Fail: any stub missing

**T1.8** `[AUTO]` Verify all providers default to stubs when env vars are absent:
```bash
node -e "
const p = require('./lib/providers')
const names = Object.keys(p).map(k => p[k].constructor.name)
console.log(names.join(', '))
const allStubs = names.every(n => n.startsWith('Stub'))
console.log(allStubs ? '✅ All stubs' : '❌ Real provider active without env var')
"
```
- Expected: all names start with `Stub`; prints `✅ All stubs`
- Fail: any real service name appears

**T1.9** `[MANUAL]` Navigate to every placeholder route listed in Rule 17. In the browser address bar, manually type each URL:
- Expected: every route returns a "Coming soon" page, status 200, no 404
- Fail: any route returns 404, 500, or a blank page

**T1.10** `[AUTO]` Pre-commit security check:
```bash
git ls-files | grep -E "^\.env"
```
- Expected: no output
- Fail: any `.env` file listed as tracked

---

### Phase 2 — Supabase Connection

**T2.1** `[MANUAL]` Navigate to `/test` on the running dev server.
- Expected: the message from the `connection_test` table appears on screen, matches what was inserted in the Supabase dashboard
- Fail: blank page, "undefined", "null", spinner that never resolves, or any error message

**T2.2** `[MANUAL]` Temporarily corrupt `NEXT_PUBLIC_SUPABASE_URL` (add "XXXXX" to the value), restart dev server, navigate to any page.
- Expected: a human-readable error message mentioning the missing or invalid environment variable — not a raw stack trace
- After test: restore correct value
- Fail: blank page, generic network error, or silent failure

**T2.3** `[AUTO]` After deleting test page and table:
```bash
npx tsc --noEmit
```
- Expected: zero errors (no broken imports from the deleted test file)
- Fail: any TypeScript error

**T2.4** `[MANUAL]` Attempt to import `createAdminClient` in a Client Component file. Confirm TypeScript catches it.
- Expected: TypeScript error or runtime error with a clear message about server-only access
- After: remove the import

---

### Phase 3 — Database Schema

**T3.1** `[MANUAL]` Supabase → Table Editor. Confirm all tables are visible:
`members`, `family_members`, `check_in_calls`, `alerts`, `care_navigators`, `navigator_assignments`, `navigator_tasks`, `navigator_notes`, `subscriptions`, `realtime_notifications`, `notification_log`, `emergency_log`, `medication_schedules`, `family_task_items`, `family_messages`, `document_vault_items`, `audit_log`
- Expected: all 17 tables visible
- Fail: any table missing

**T3.2** `[MANUAL]` Supabase → Database → Foreign Keys. Confirm key relationships:
- `family_members.member_id` → `members.id`
- `check_in_calls.member_id` → `members.id`
- `alerts.member_id` → `members.id`
- `navigator_assignments.member_id` → `members.id` and `navigator_id` → `care_navigators.id`
- `realtime_notifications.member_id` → `members.id`
- Expected: all relationships shown in the FK visualiser
- Fail: any relationship missing

**T3.3** `[MANUAL]` Run a cascade delete test in Supabase SQL Editor:
```sql
INSERT INTO members (full_name, preferred_name, date_of_birth, phone_number, plan_tier, status)
VALUES ('Test Cascade', 'Test', '1945-01-01', '+15550001234', 'basics', 'active')
RETURNING id;
```
Copy the returned `id`, then:
```sql
INSERT INTO family_members (member_id, supabase_auth_id, full_name, email, role)
VALUES ('[COPIED_ID]', gen_random_uuid(), 'Test Family', 'cascade@test.com', 'family');

DELETE FROM members WHERE full_name = 'Test Cascade';

SELECT * FROM family_members WHERE email = 'cascade@test.com';
```
- Expected: the `family_members` row is deleted automatically by cascade. Query returns empty.
- Fail: `family_members` row still exists, or any constraint error

**T3.4** `[MANUAL]` Supabase → Authentication → Policies. Confirm RLS is enabled on all 17 tables.
- Expected: every table shows "RLS enabled"
- Fail: any table showing "RLS disabled"

**T3.5** `[MANUAL]` Supabase → Database → Replication → Tables. Confirm `realtime_notifications` is listed with INSERT events enabled.
- Expected: `realtime_notifications` in the list with INSERT checked
- Fail: table not listed, or INSERT not checked

**T3.6** `[AUTO]` Confirm audit triggers exist:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```
- Expected: `members_audit`, `calls_audit`, `alerts_audit` all listed
- Fail: any trigger missing

---

### Phase 4 — RLS Verification

**T4.1** `[AUTO]` Run the RLS test script:
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
- Fail: any line shows FAILED or an uncaught error

**T4.2** `[MANUAL]` After T4.1, open Supabase → Table Editor → `members`. Confirm no rows with email `user-a@test.com` or `user-b@test.com` exist (cleanup verified).
- Expected: no test rows remain
- Fail: test rows still present

---

## M2 — Member Data

### Phase 5 — Authentication

**T5.1** `[MANUAL]` Navigate to `/signup`. Fill in all required fields and submit.
- Expected: Supabase → Authentication → Users shows the new user. Supabase → `family_members` shows a row with `role = 'family'` and correct `supabase_auth_id`. Browser redirects to `/onboarding`.
- Fail: no Auth user created, no `family_members` row, no redirect

**T5.2** `[MANUAL]` Log out. Type `/dashboard` directly in the address bar.
- Expected: immediately redirected to `/login`. Dashboard content never visible.
- Fail: dashboard loads for a logged-out user

**T5.3** `[MANUAL]` Log out. Type `/navigator` and `/admin` in the address bar.
- Expected: both immediately redirect to `/login`
- Fail: either page loads for a logged-out user

**T5.4** `[MANUAL]` In Supabase, manually set a `family_members.role` to `'navigator'`. Log in as that user.
- Expected: redirected to `/navigator`
- Fail: navigator role user lands on `/dashboard`

**T5.5** `[MANUAL]` Log in as a `family` role user. Type `/navigator` in the address bar.
- Expected: immediately redirected to `/dashboard`
- Fail: navigator console loads for a family user

**T5.6** `[MANUAL]` Simulate a failed `family_members` insert during signup (temporarily add `throw new Error('test')` after the auth user creation, before the insert). Attempt signup.
- Expected: Supabase Auth → Users does NOT contain the new user (rollback succeeded). User sees a clear error message on the signup page.
- After: remove the thrown error
- Fail: orphaned Auth user exists with no `family_members` row

---

### Phase 6 — Member Onboarding Form

**T6.1** `[MANUAL]` Navigate to `/onboarding`. Click "Next" on Step 1 with all fields empty.
- Expected: error messages appear below every required field. Page does NOT advance to Step 2.
- Fail: form advances with empty required fields

**T6.2** `[MANUAL]` Enter `abc-xyz-123` as the phone number in Step 1. Click "Next".
- Expected: validation error below the phone field with a format example like `(555) 555-5555`
- Fail: non-numeric/non-E.164 phone accepted

**T6.3** `[MANUAL]` Enter today's date as the date of birth.
- Expected: validation error — person must be at least 60 years old
- Fail: any date of birth accepted

**T6.4** `[MANUAL]` Enter a future date as the date of birth.
- Expected: validation error — date of birth must be in the past
- Fail: future date accepted

**T6.5** `[MANUAL]` Complete all 3 steps with valid data and submit.
- Expected: `members` row created in Supabase with all fields populated. `plan_tier = 'basics'`. `family_members.member_id` links to the new member. Redirected to `/onboarding/confirmation`. Confirmation shows the correct preferred name — not "undefined".
- Fail: any field missing, plan_tier wrong, or "undefined" on confirmation page

**T6.6** `[MANUAL]` Partially complete Step 2 (leave some fields empty). Refresh the page.
- Expected: form data from Step 2 is preserved (localStorage)
- Fail: all data lost on refresh

**T6.7** `[MANUAL]` Complete the form on a real phone at 375px width.
- Expected: all fields visible, all buttons tappable without zooming, no horizontal scroll
- Fail: any element cut off, overlapping, or requiring zoom or horizontal scroll

**T6.8** `[MANUAL]` Check the new member's `plan_tier` in Supabase Table Editor.
- Expected: `basics` — not null, not empty, not any other value
- Fail: null, empty, or any other value

---

### Phase 7 — App Data Layer & Seed Data

**T7.1** `[AUTO]` Create and run `/scripts/test-data-layer.ts`:
```ts
import { getMember, createMember } from '../lib/data/members'
import { getActiveAlerts } from '../lib/data/alerts'
import { getUnreadNotifications } from '../lib/data/notifications'

async function run() {
  // Create member
  const { data: created, error: createErr } = await createMember({
    full_name: 'Data Test', preferred_name: 'Test', date_of_birth: '1945-01-01',
    phone_number: '+15550001234', plan_tier: 'basics', status: 'active'
  })
  console.assert(!createErr, 'Create should not error:', createErr)
  console.assert(created?.id, 'Created member should have an id')

  // Fetch by valid id
  const { data: fetched, error: fetchErr } = await getMember(created!.id)
  console.assert(!fetchErr, 'Fetch should not error:', fetchErr)
  console.assert(fetched?.full_name === 'Data Test', 'Name should match')

  // Fetch by invalid id — must return error, not crash
  const { data: missing, error: missingErr } = await getMember('00000000-0000-0000-0000-000000000000')
  console.assert(missing === null, 'Invalid id should return null data')
  console.assert(missingErr !== null, 'Invalid id should return an error string')

  // Empty alerts — must return array, not error
  const { data: alerts } = await getActiveAlerts(created!.id)
  console.assert(Array.isArray(alerts), 'Alerts should be an array')
  console.assert(alerts?.length === 0, 'No alerts for new member')

  // Cleanup
  // (delete test member here)

  console.log('✅ All data layer tests passed')
}
run().catch(e => { console.error('FAILED:', e); process.exit(1) })
```
- Expected: prints `✅ All data layer tests passed`
- Fail: any assertion fails or script exits with code 1

**T7.2** `[AUTO]` Run seed script:
```bash
npx tsx scripts/seed-test-data.ts
```
- Expected: prints `Login: test-family@thriveathome.dev / TestPassword123! | Member: Margaret Chen`
- Expected: Supabase `members` table has one row for Margaret Chen
- Expected: Supabase `check_in_calls` has 14 rows linked to Margaret Chen
- Fail: any error, missing rows, or credentials not printed

**T7.3** `[AUTO]` Run seed script a second time (idempotency test):
```bash
npx tsx scripts/seed-test-data.ts
```
- Expected: no new rows created — same row count as after first run
- Expected: no duplicate error or crash
- Fail: duplicate rows created

**T7.4** `[AUTO]` Run clear script:
```bash
npx tsx scripts/clear-test-data.ts
```
- Expected: all seeded rows removed. `members` table has no row for "Margaret Chen".
- Fail: rows still present, or script errors

**T7.5** `[AUTO]`
```bash
npx tsc --noEmit
```
- Expected: zero errors
- Fail: any TypeScript error

---

## M3 — UI System

### Phase 8 — Primitive UI Components

**T8.1** `[MANUAL]` Navigate to `/test-ui`.
- Expected: all 13 components render in all variants — Button (primary/secondary/danger/ghost), Card (default/highlight/warning/danger), Badge (all severity and tier variants), Input with label and error state, Select, Textarea, Skeleton (animated grey), StatusDot (green/amber/red), MoodEmoji (5 score ranges + null), NotificationBell (with count badge showing 0), Toast (all severity colours), Modal (can be opened), Tabs (tabs switch), ProgressBar (all 3 colour ranges)
- Fail: any component missing, wrong colour, or rendering error in any variant

**T8.2** `[MANUAL]` Tab through all components using only the keyboard.
- Expected: every interactive element (buttons, bell, tab headers, modal trigger) is reachable. Focus ring is visible on every focused element. Enter/Space activates buttons.
- Fail: any element unreachable by keyboard, or invisible focus state

**T8.3** `[MANUAL]` Open the Modal.
- Expected: focus moves into the modal. Tab stays inside the modal (focus trapped). Escape closes the modal. Focus returns to the element that triggered it.
- Fail: focus escapes the modal, Escape doesn't close, or focus doesn't return

**T8.4** `[AUTO]`
```bash
npx tsc --noEmit
```
- Expected: zero errors
- Fail: any TypeScript error

After all tests pass: delete `/app/test-ui/page.tsx`.

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime

**T9.1** `[MANUAL]` Run the seed script first. Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`. Open Supabase SQL Editor in another browser tab. Insert:
```sql
INSERT INTO realtime_notifications (member_id, type, title, body, severity)
VALUES ('[MARGARET_CHEN_MEMBER_ID]', 'new_alert', 'Test Realtime', 'This is a test notification.', 'concern');
```
- Expected: within 2 seconds, a toast notification appears in the dashboard tab WITHOUT refreshing the page. The bell icon count increments.
- Fail: notification does not appear, or requires page refresh

**T9.2** `[MANUAL]` Click the `NotificationBell`. Click "Mark read" on the test notification.
- Expected: notification moves out of unread list. Bell count returns to 0. Supabase row has `read = true` and a `read_at` timestamp.
- Fail: count doesn't decrement, or DB row not updated

**T9.3** `[MANUAL]` Open the dashboard as User A (linked to Member A). Insert a notification for Member B's member_id.
- Expected: User A does NOT see the notification for Member B.
- Fail: User A sees another member's notification

**T9.4** `[AUTO]` Call `pushRealtimeNotification()` with a non-existent `member_id`:
```ts
await pushRealtimeNotification({
  type: 'system_message', memberId: '00000000-0000-0000-0000-000000000000',
  title: 'Test', body: 'Test non-existent member'
})
```
- Expected: function logs an error but does NOT throw. Calling code continues running.
- Fail: function throws and crashes the caller

---

## M5 — Alert Engine

### Phase 10 — Alert Logic & Detection

**T10.1** `[AUTO]` Run alert rules test (`/scripts/test-alert-rules.ts`):
```ts
// For each rule, create a call with the triggering condition and verify the correct alert type and severity
// e.g. crisis in alert_flags → alert_type 'crisis', severity 'emergency'
// e.g. single medication miss → alert_type 'medication_miss', severity 'informational'
```
- Expected: all 8 rules create alerts with correct type and severity. Script prints `✅ All alert rule tests passed`.
- Fail: any rule creates wrong type or severity

**T10.2** `[AUTO]` Deduplication test:
```ts
await createAlertIfNeeded({ member_id: TEST_ID, alert_type: 'fall', severity: 'urgent', message: 'Test' })
await createAlertIfNeeded({ member_id: TEST_ID, alert_type: 'fall', severity: 'urgent', message: 'Test' })
const { data } = await adminSupabase.from('alerts').select().eq('member_id', TEST_ID).eq('alert_type', 'fall')
console.assert(data?.length === 1, `Expected 1 alert, got ${data?.length}`)
```
- Expected: exactly 1 `fall` alert row, not 2
- Fail: duplicate alert created

**T10.3** `[MANUAL]` After T10.1 creates a test alert, open the dashboard.
- Expected: Realtime notification for the new alert appears within 2 seconds, no page refresh. Alert card appears in the Alerts Panel. StatusDot changes colour.
- Fail: requires page refresh, or no notification appears

**T10.4** `[AUTO]` Wellness drift test:
Insert 14 calls for a test member with scores: `[8,8,7,8,7,6,6,5,5,4,4,3,3,3]`. Run `checkWellnessDrift(memberId)`.
- Expected: a `wellness_drift` alert with `severity = 'urgent'` is created (avg last 7 ≈ 3.6 vs prior 7 ≈ 7.1, drop > 3).
- Then insert 14 flat calls at score 6 for a different member. Run `checkWellnessDrift`. Expected: no alert created.
- Fail: alert not created for declining scores, or false positive on flat scores

**T10.5** `[AUTO]` Insufficient data check:
Insert only 3 calls for a test member. Run `checkWellnessDrift(memberId)`.
- Expected: no alert created, no error
- Fail: alert created with too little data, or script throws

**T10.6** `[AUTO]` Emergency log write-first test:
Create a scenario where the `alerts` insert is mocked to fail. Trigger a crisis alert.
- Expected: `emergency_log` row exists even though `alerts` row was not created
- Fail: `emergency_log` row missing when `alerts` insert fails

---

### Phase 11 — Crisis Detection

**T11.1** `[AUTO]` Run `/scripts/test-crisis-detection.ts` with a transcript containing "I don't want to be here anymore":
- Expected within 60 seconds: `emergency_log` row with triggered phrase, `emergency` alert in `alerts` table, `critical` priority row in `navigator_tasks`, `emergency` Realtime notification pushed. Stub logs show `[STUB][SMS][URGENT]` message.
- Fail: any of the 5 steps missing

**T11.2** `[AUTO]` Run with a normal transcript containing no crisis phrases:
- Expected: no `emergency_log` row, no `crisis` alert, no navigator task
- Fail: false positive — any crisis action fires

**T11.3** `[AUTO]` Run with "I fell asleep watching TV last night":
- Expected: no crisis detection fires. "fell asleep" is not a crisis phrase.
- Fail: crisis detection fires on this phrase

**T11.4** `[AUTO]` Simulate crisis detection itself throwing an error (mock the phrase scanner to throw):
- Expected: the wrapping try/catch catches the error. Error is logged. A navigator task is created: "Crisis detection failed — manual transcript review required". Call processing continues normally.
- Fail: error propagates uncaught, or call processing is aborted

---

## M6 — Family Dashboard

### Phase 12 — Family Dashboard

**T12.1** `[MANUAL]` Run the seed script. Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`.
- Expected: loads within 3 seconds. Margaret Chen's name in header. StatusDot visible. `NotificationBell` visible. Today's Wellness Card shows a MoodEmoji, scores, and AI summary text. 7-Day Mood Trend chart renders with dots. Health Timeline shows 4 tabs (7-day/30-day/60-day/90-day) and each renders a chart.
- Fail: any section blank, "undefined", or spinning indefinitely

**T12.2** `[MANUAL]` While dashboard is open, insert a new alert for Margaret Chen via SQL Editor:
```sql
INSERT INTO alerts (member_id, alert_type, severity, message)
VALUES ('[MARGARET_MEMBER_ID]', 'mood_drop', 'concern', 'Test alert for Realtime check');
```
- Expected: within 2 seconds, an alert card appears in the Alerts Panel. StatusDot changes colour. No page refresh.
- Fail: requires page refresh, or no update

**T12.3** `[MANUAL]` Switch between all 4 health timeline tabs.
- Expected: each tab renders a chart without error. Data may be identical across tabs (seed data) — that's fine. No blank tab or error message.
- Fail: any tab blank or throws an error

**T12.4** `[MANUAL]` Temporarily break Supabase (remove `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`, restart dev server). Navigate to `/dashboard`.
- Expected: a friendly human-readable error message per section that failed to load. No raw error codes or stack traces visible.
- After: restore the env var
- Fail: full-page crash, or raw Supabase error visible to user

**T12.5** `[MANUAL]` View the dashboard on a real phone at 375px width.
- Expected: all sections fit on screen, no horizontal scroll, all text readable without pinch-zooming, all buttons easy to tap
- Fail: any content cut off, overlapping, or requiring zoom or horizontal scroll

---

### Phase 13 — Call History Page

**T13.1** `[MANUAL]` With 14 seeded calls, navigate to `/dashboard/calls`.
- Expected: calls listed newest-first. Each row shows date, MoodEmoji + score, medication ✓/✗, and alert badge icons. No raw alert flag names visible.
- Fail: wrong order, raw flag names shown, or any row missing data

**T13.2** `[MANUAL]` Click a call row to expand it.
- Expected: full AI summary text appears. All scores shown with labels. Alert flags shown in plain English (e.g. "Aria noted a mention of a fall" — not "fall").
- Fail: raw flag values shown, or summary missing

**T13.3** `[MANUAL]` With exactly 14 seeded calls (one page of 20), confirm no "Load more" button appears.
Insert 10 more calls via seed script extension (or directly in SQL). Navigate to `/dashboard/calls`.
- Expected: "Load more" button appears after 20 rows. Clicking it appends more rows without page reload.
- Fail: "Load more" not shown when > 20 calls, or clicking it reloads the page

**T13.4** `[MANUAL]` If there are no calls for a test member, navigate to their call history.
- Expected: empty state message containing preferred name and scheduled time
- Fail: blank page, error, or generic "No data" without context

---

### Phase 14 — Family Coordination Tools

**T14.1** `[MANUAL]` Log in as test family member. Navigate to `/dashboard/family/tasks`.
- Expected: task board loads. Create a task (fill in title, type, assign to self). Task appears in the list.
- Fail: page doesn't load, or task not created

**T14.2** `[MANUAL]` Create two family member accounts linked to the same senior. Log in as User A, create a task. Immediately (without refreshing) check if User B (logged in in another browser or incognito) sees the task.
- Expected: task appears for User B within 2 seconds via Realtime, no refresh
- Fail: User B must refresh to see the task

**T14.3** `[MANUAL]` Mark a task as complete.
- Expected: task moves to the completed section immediately (optimistic update). Supabase `family_task_items.completed = true`.
- Fail: requires page reload to show completion, or DB not updated

**T14.4** `[MANUAL]` Navigate to `/dashboard/family/messages`. Send a message.
- Expected: message appears at the bottom of the chat immediately. In another browser session for the same senior's family, the message appears within 2 seconds without refreshing.
- Fail: message requires reload to appear, or cross-user Realtime not working

**T14.5** `[MANUAL]` Navigate to `/dashboard/documents`.
- Expected: page loads. Upload a PDF under 10MB. Document appears in the list with file name and upload date.
- Fail: upload fails, page doesn't load, or document doesn't appear

**T14.6** `[MANUAL]` Click the "Download" button on an uploaded document.
- Expected: file downloads successfully. A fresh signed URL is generated on each click.
- Fail: download fails, or URL is expired (generated at page load instead of click time)

**T14.7** `[MANUAL]` Attempt to upload a `.exe` file or a file over 10MB.
- Expected: clear error message — file type not supported or file too large. Upload does not proceed.
- Fail: unsupported file uploaded, or no error shown

**T14.8** `[AUTO]` Manually set a `family_members.last_login_at` to 8 days ago in Supabase for a test user who has an unacknowledged `concern` alert on their member. Trigger the `family-nudge-check` Edge Function.
- Expected: a `family_nudge` Realtime notification is inserted for that family member. `notification_log` has a row for this nudge.
- Fail: no notification pushed, or nudge fires for a user who logged in recently

**T14.9** `[AUTO]` Trigger the nudge function a second time for the same family member within 7 days.
- Expected: no second nudge sent. `notification_log` still has only 1 row for this family member in the last 7 days.
- Fail: second nudge sent within 7 days

---

## M6 Final Gate — Before Calling V1 Complete

All of the following must be true before the V1 gate review is presented:

**T_GATE.1** `[AUTO]`
```bash
npx tsc --noEmit
```
Expected: zero errors.

**T_GATE.2** `[AUTO]`
```bash
git ls-files | grep -E "^\.env"
```
Expected: no output.

**T_GATE.3** `[MANUAL]` End-to-end flow: sign up → enrol Margaret Chen → view dashboard with seed data → see Realtime notification without refresh.
Expected: all steps complete without error.

**T_GATE.4** `[AUTO]`
```bash
npx axe-cli http://localhost:3000/dashboard --tags wcag2aa
npx axe-cli http://localhost:3000/onboarding --tags wcag2aa
npx axe-cli http://localhost:3000/login --tags wcag2aa
```
Expected: zero violations on all three pages.

**T_GATE.5** `[MANUAL]` View every page listed in Rule 17 (placeholders). Confirm all return "Coming soon" content, none return 404.
Expected: all placeholder routes accessible.

**T_GATE.6** `[MANUAL]` View the dashboard on a real phone at 375px. All text readable, no horizontal scroll, all buttons tappable.
Expected: clean mobile layout on every page built in M6.
