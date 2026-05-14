# Thrive@Home — Test Suite

> **Every test here must pass before the corresponding phase is marked complete.**
> Tests marked `[AUTO]` can be run with a script. Tests marked `[MANUAL]` require a human or real device. Tests marked `[LIVE]` call a real external service and may incur cost.
>
> A test is only "passed" when the expected output is observed. "It compiled" is not a passing test. "It looks right" is not a passing test. Run it. Observe the result. Document it in progress.md.

---

## Layer 1 — Core Product

---

### Phase 1 — Project Scaffold

**T1.1** `[MANUAL]` Open the Vercel deployment URL in a browser.
- Expected: Page loads showing "Thrive@Home" in navy text
- Expected: Tagline "Peace of mind for families. Independence for seniors." visible in teal
- Expected: Browser DevTools → Console shows zero red errors
- Fail: Blank page, error message, wrong colours, or any console error

**T1.2** `[MANUAL]` Make a trivial change (add a space to `app/page.tsx`), commit, push to `main`.
- Expected: Vercel dashboard shows a new deployment triggered within 60 seconds
- Expected: Deployment succeeds (green checkmark)
- Fail: No deployment triggered, or deployment fails

**T1.3** `[AUTO]` Run in the Codespace terminal:
```bash
npx tsc --noEmit
```
- Expected: Zero output (zero errors)
- Fail: Any error or warning output

**T1.4** `[MANUAL]` Run:
```bash
echo "TEST=secret" > .env.local && git status
```
- Expected: `.env.local` appears under "Untracked files" — NOT under "Changes to be committed"
- Fail: `.env.local` appears as staged or tracked
- After test: the `.env.local` file should already exist from Phase 1 setup — this verifies `.gitignore` is working

**T1.5** `[MANUAL]` Open `.env.local.example` and confirm ALL 23 variable names are present (values must be empty):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `CARE_TEAM_EMAIL`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RETELL_API_KEY`, `RETELL_AGENT_ID`, `RETELL_WEBHOOK_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `ONCALL_NAVIGATOR_PHONE`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASICS`, `STRIPE_PRICE_ID_CONNECT`, `STRIPE_PRICE_ID_COMPLETE`, `STRIPE_PRICE_ID_PREMIER`
- Expected: All 23 names present, all values blank
- Fail: Any name missing, or any actual value present

**T1.6** `[MANUAL]` Check that all `/lib/interfaces/` files exist and TypeScript has no errors:
```bash
ls lib/interfaces/
npx tsc --noEmit
```
- Expected: `CallProvider.ts`, `SmsProvider.ts`, `EmailProvider.ts`, `AiProvider.ts`, `BillingProvider.ts`, `RealtimeProvider.ts` all listed
- Expected: Zero TypeScript errors
- Fail: Any file missing or any type error

**T1.7** `[MANUAL]` Check that all `/lib/stubs/` files exist:
```bash
ls lib/stubs/
```
- Expected: `StubCallProvider.ts`, `StubSmsProvider.ts`, `StubEmailProvider.ts`, `StubAiProvider.ts`, `StubBillingProvider.ts` all listed
- Fail: Any file missing

**T1.8** `[AUTO]` Verify providers.ts exports compile and default to stubs (no env vars set):
```bash
node -e "
const { aiProvider, callProvider, smsProvider, emailProvider, billingProvider } = require('./lib/providers.ts')
console.log('AI:', aiProvider.constructor.name)
console.log('Call:', callProvider.constructor.name)
console.log('SMS:', smsProvider.constructor.name)
" 2>&1 | head -20
```
- Expected: All names contain "Stub"
- Fail: Any name contains a real service name (Anthropic, Retell, Twilio, etc.)

---

### Phase 2 — Supabase Connection

**T2.1** `[MANUAL]` Navigate to `/test` in the running dev server.
- Expected: The message from the `connection_test` table appears on screen
- Expected: Message text matches exactly what was manually inserted in Supabase dashboard
- Fail: Blank page, "undefined", "null", loading spinner that never resolves, or any error

**T2.2** `[MANUAL]` Temporarily corrupt `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` (add "XXXXX" to the value). Restart dev server. Navigate to any page.
- Expected: An error message appears that mentions the missing or invalid environment variable
- Expected: The error is human-readable — not a raw stack trace
- After test: restore correct value
- Fail: Blank page, generic network error, or silent failure

**T2.3** `[AUTO]` After deleting the test page and table, run:
```bash
npx tsc --noEmit
```
- Expected: Zero errors (no broken imports from the deleted test file)
- Fail: Any TypeScript error

---

### Phase 3 — Database Schema

**T3.1** `[MANUAL]` Open Supabase → Table Editor. Confirm all 12 tables exist:
`members`, `family_members`, `check_in_calls`, `alerts`, `care_navigators`, `navigator_assignments`, `navigator_tasks`, `navigator_notes`, `subscriptions`, `realtime_notifications`, `notification_log`, `emergency_log`, `medication_schedules`, `audit_log`
- Expected: All 14 tables visible (12 main + notification_log + audit_log)
- Fail: Any table missing

**T3.2** `[MANUAL]` Open Supabase → Database → Foreign Keys. Confirm these relationships exist:
- `family_members.member_id` → `members.id`
- `check_in_calls.member_id` → `members.id`
- `alerts.member_id` → `members.id`
- `navigator_assignments.member_id` → `members.id`
- `navigator_assignments.navigator_id` → `care_navigators.id`
- `realtime_notifications.member_id` → `members.id`
- Fail: Any FK relationship missing

**T3.3** `[MANUAL]` In Supabase SQL Editor, run a test insert and confirm cascade delete:
```sql
INSERT INTO members (full_name, preferred_name, phone_number, plan_tier, status)
VALUES ('Test Person', 'Test', '+15550001234', 'basics', 'active')
RETURNING id;
-- Copy the returned id, then:
INSERT INTO family_members (member_id, full_name, email, role)
VALUES ('[COPIED_ID]', 'Test Family', 'test@test.com', 'family');
-- Confirm both inserts succeed, then clean up:
DELETE FROM members WHERE full_name = 'Test Person';
-- Confirm the family_members row was also deleted (cascade)
SELECT * FROM family_members WHERE email = 'test@test.com';
-- Expected: empty result
```
- Expected: Both inserts succeed without error
- Expected: Cascade delete removes the `family_members` row
- Fail: Any constraint violation, or cascade delete does not work

**T3.4** `[MANUAL]` Open Supabase → Database → Replication. Confirm `realtime_notifications` table has Realtime enabled for INSERT events.
- Expected: `realtime_notifications` listed with INSERT enabled
- Fail: Table not listed or INSERT not enabled

**T3.5** `[MANUAL]` Confirm the `audit_log` table has the three trigger functions attached:
```sql
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public' ORDER BY event_object_table;
```
- Expected: `members_audit`, `calls_audit`, `alerts_audit` triggers visible
- Fail: Any trigger missing

---

### Phase 4 — Row Level Security

**T4.1** `[MANUAL]` Open Supabase → Authentication → Policies. Confirm RLS is enabled on ALL 14 tables.
- Expected: Every table shows "RLS enabled"
- Fail: Any table showing "RLS disabled"

**T4.2** `[MANUAL]` Cross-user isolation test. In the Codespace terminal, create a test script at `/scripts/test-rls.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

// Sign in as User A, attempt to read Member B's data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  // Sign in as User A
  await supabase.auth.signInWithPassword({ email: 'usera@test.com', password: 'testpass123' })

  // Try to read Member B's data (Member B belongs to User B, not User A)
  const { data, error } = await supabase.from('members').select('*').eq('id', 'MEMBER_B_UUID_HERE')
  console.log('Cross-user members query:', data?.length === 0 ? 'BLOCKED ✓' : 'EXPOSED ✗', data)

  // Try to read Member A's own data (should work)
  const { data: ownData } = await supabase.from('members').select('*').eq('id', 'MEMBER_A_UUID_HERE')
  console.log('Own member query:', ownData?.length === 1 ? 'ACCESSIBLE ✓' : 'BLOCKED ✗', ownData)
}
test()
```
- Expected: Cross-user query returns empty array (BLOCKED)
- Expected: Own data query returns one row (ACCESSIBLE)
- Fail: Cross-user query returns any rows, or own data query is blocked

**T4.3** `[MANUAL]` Using the admin/service role client, confirm it reads all rows (bypasses RLS):
```ts
const { data } = await adminSupabase.from('members').select('*')
console.log('Admin reads all members:', data?.length >= 2 ? 'WORKS ✓' : 'BLOCKED ✗')
```
- Expected: Returns all member rows regardless of user
- Fail: Returns empty or restricted results

**T4.4** `[MANUAL]` Confirm `realtime_notifications` RLS policies: User A cannot read User B's notifications.
- Expected: Same cross-user blocking behaviour as T4.2 for `realtime_notifications`
- Fail: User A can see User B's notifications

After all tests pass: delete all test users and member rows.

---

### Phase 5 — Authentication

**T5.1** `[MANUAL]` Navigate to `/signup`. Fill in all required fields and submit.
- Expected: New Supabase Auth user appears in Supabase → Authentication → Users
- Expected: New `family_members` row created with `role = 'family'` and correct `supabase_auth_id`
- Expected: Browser redirects to `/dashboard`
- Fail: No Auth user created, no `family_members` row, or no redirect

**T5.2** `[MANUAL]` Log out. Navigate directly to `/dashboard` by typing the URL.
- Expected: Immediately redirected to `/login`
- Expected: Dashboard content is never visible
- Fail: Dashboard loads for a logged-out user

**T5.3** `[MANUAL]` Log out. Try to access `/navigator` and `/admin` directly.
- Expected: Both redirect to `/login`
- Fail: Either page loads for a logged-out user

**T5.4** `[MANUAL]` Manually update a `family_members.role` to `'navigator'` in Supabase. Log in as that user.
- Expected: Redirected to `/navigator`
- Expected: `/dashboard` access is redirected back to `/navigator`
- Fail: Navigator role user lands on `/dashboard`

**T5.5** `[MANUAL]` Log in as a `family` role user. Manually type `/navigator` in the URL bar.
- Expected: Immediately redirected to `/dashboard`
- Fail: Navigator console loads for a family role user

**T5.6** `[MANUAL]` Simulate a failed `family_members` insert during signup (temporarily break the insert query). Attempt signup.
- Expected: The Supabase Auth user is also deleted (rollback)
- Expected: User sees a clear error message — not a partially-created account
- After test: restore the insert query
- Fail: Orphaned Auth user exists with no `family_members` row

---

### Phase 6 — Member Onboarding Form

**T6.1** `[MANUAL]` Navigate to `/onboarding`. Click "Next" on Step 1 with all fields empty.
- Expected: Error messages appear on every required field
- Expected: Page does NOT advance to Step 2
- Fail: Form advances with empty required fields

**T6.2** `[MANUAL]` Enter `abc-def-ghij` as the phone number in Step 1. Click "Next".
- Expected: Validation error on the phone field with a format example
- Fail: Non-numeric phone accepted

**T6.3** `[MANUAL]` Enter today's date as the date of birth.
- Expected: Validation error — person must be at least 60 years old
- Fail: Any date of birth accepted

**T6.4** `[MANUAL]` Complete all 3 steps with valid data (no plan selection step yet). Submit.
- Expected: `members` row created in Supabase with all fields populated
- Expected: `family_members.member_id` updated to link the logged-in user to the new member
- Expected: Redirected to `/onboarding/confirmation`
- Expected: Confirmation shows the senior's preferred name (not "undefined" or a placeholder)
- Fail: Any field missing from DB, or "undefined" on confirmation page

**T6.5** `[MANUAL]` Partially complete the form, then refresh the page.
- Expected: Form data is preserved (localStorage)
- Fail: All data lost on refresh

**T6.6** `[MANUAL]` Complete the form on a real phone at 375px width.
- Expected: All fields visible, all buttons tappable, no horizontal scroll
- Fail: Any element cut off or requiring horizontal scroll

**T6.7** `[MANUAL]` Check the new member's `plan_tier` in Supabase.
- Expected: `plan_tier = 'basics'` (default — no plan selection in onboarding until Layer 4)
- Fail: `plan_tier` is null, empty, or any other value

---

### Phase 7 — App Data Layer

**T7.1** `[AUTO]` Create `/scripts/test-data-layer.ts` and run it:
```ts
import { getMember, createMember } from '../lib/data/members'
import { getActiveAlerts }          from '../lib/data/alerts'
import { getUnreadNotifications }   from '../lib/data/notifications'

async function run() {
  // Test create
  const { data: created, error: createErr } = await createMember({
    full_name: 'Data Layer Test', preferred_name: 'Test',
    phone_number: '+15550001234', plan_tier: 'basics', status: 'active'
  })
  console.assert(!createErr, 'Create should not error:', createErr)
  console.assert(created?.id, 'Created member should have an id')

  // Test fetch by id
  const { data: fetched, error: fetchErr } = await getMember(created!.id)
  console.assert(!fetchErr, 'Fetch should not error:', fetchErr)
  console.assert(fetched?.full_name === 'Data Layer Test', 'Name should match')

  // Test invalid id — should return error, not crash
  const { data: notFound, error: notFoundErr } = await getMember('not-a-real-uuid-000000')
  console.assert(notFound === null, 'Invalid id should return null data')
  console.assert(notFoundErr !== null, 'Invalid id should return an error string')

  // Test empty alerts (no alerts yet)
  const { data: alerts } = await getActiveAlerts(created!.id)
  console.assert(Array.isArray(alerts), 'Alerts should return an array')
  console.assert(alerts?.length === 0, 'No alerts yet for test member')

  // Test notifications (should be empty)
  const { data: notifs } = await getUnreadNotifications(created!.id)
  console.assert(Array.isArray(notifs), 'Notifications should return an array')

  // Clean up
  await deleteTestMember(created!.id)

  console.log('✓ All data layer tests passed')
}
run().catch(e => { console.error('Data layer test failed:', e); process.exit(1) })
```
- Expected: "✓ All data layer tests passed" printed
- Expected: All assertions pass without throwing
- Fail: Any assertion fails or script throws

**T7.2** `[AUTO]`:
```bash
npx tsc --noEmit
```
- Expected: Zero errors
- Fail: Any TypeScript error

---

### Phase 8 — Primitive UI Components

**T8.1** `[MANUAL]` Create a temporary `/app/test-ui/page.tsx` that renders all component variants. Navigate to it.
- Expected: All Button variants visible and correctly coloured (navy/teal/red/ghost)
- Expected: All Card variants visible (default, highlight, warning, danger)
- Expected: All Badge variants visible
- Expected: MoodEmoji renders 😊 for score 9, 🙂 for 7, 😐 for 5, 😔 for 3, 😞 for 1, — for null
- Expected: StatusDot renders green for no_alerts, amber for concern, red for urgent
- Expected: NotificationBell renders with a count badge showing "0"
- Fail: Any component missing, wrong colour, or rendering error

**T8.2** `[MANUAL]` Tab through all components on the test page using only the keyboard.
- Expected: Every interactive element (buttons, bell) is reachable via Tab
- Expected: Focus ring is visible on every focused element
- Expected: All interactive elements can be activated with Enter or Space
- Fail: Any element unreachable by keyboard, or invisible focus state

**T8.3** `[AUTO]`:
```bash
npx tsc --noEmit
```
- Expected: Zero errors
- Fail: Any TypeScript error

After all tests pass: delete the test-ui page.

---

### Phase 9 — Supabase Realtime Notifications

**T9.1** `[MANUAL]` Open the dev server. Open the family dashboard in one browser tab (as a logged-in family user linked to a test member). Open Supabase SQL Editor in another tab.

In the SQL Editor, insert a test notification:
```sql
INSERT INTO realtime_notifications (member_id, type, title, body, severity)
VALUES ('[TEST_MEMBER_ID]', 'new_alert', 'Test Alert', 'This is a realtime test notification.', 'concern');
```
- Expected: Within 2 seconds, a toast notification appears in the dashboard tab WITHOUT refreshing
- Expected: The `NotificationBell` unread count increments by 1
- Fail: Notification does not appear, or requires a page refresh

**T9.2** `[MANUAL]` Click the `NotificationBell` in the dashboard.
- Expected: A dropdown appears showing the test notification
- Expected: "Mark read" button visible on the notification
- Fail: Dropdown doesn't open, or notification not listed

**T9.3** `[MANUAL]` Click "Mark read" on the test notification.
- Expected: Notification moves out of the unread list
- Expected: Bell count decrements to 0
- Expected: In Supabase, the `realtime_notifications` row has `read = true` and a `read_at` timestamp
- Fail: Count doesn't update, or DB row not updated

**T9.4** `[MANUAL]` Open the dashboard as User A (linked to Member A). Insert a notification for Member B in SQL Editor.
- Expected: User A does NOT see the notification for Member B (RLS working)
- Fail: User A sees another member's notification

**T9.5** `[AUTO]` Verify `pushRealtimeNotification()` handles Supabase insert failure gracefully:
Create a test that passes a bad `member_id` (non-existent UUID) to `pushRealtimeNotification`.
- Expected: Function logs the error but does NOT throw
- Expected: The calling code continues running after the failed notification
- Fail: Function throws and crashes the pipeline

---

### Phase 10 — Alert Logic

**T10.1** `[AUTO]` Run the alert rules test:
```ts
// Test each alert rule fires correctly
const crisisCall = { member_id: TEST_ID, alert_flags: ['crisis'], mood_score: 2, medication_taken: false }
await createAlertsFromCall(crisisCall)

const { data: alerts } = await adminSupabase.from('alerts').select('*').eq('member_id', TEST_ID)
const crisisAlert = alerts?.find(a => a.alert_type === 'crisis')
console.assert(crisisAlert?.severity === 'emergency', 'Crisis flag → emergency severity')

const { data: emergLog } = await adminSupabase.from('emergency_log').select('*').eq('member_id', TEST_ID)
console.assert(emergLog?.length === 1, 'Emergency log should have 1 entry')
```
- Expected: All alert rules create the correct severity
- Fail: Any rule fires wrong severity

**T10.2** `[AUTO]` Deduplication test:
```ts
// Call createAlertsFromCall twice with same type for same member
await createAlertsFromCall({ member_id: TEST_ID, alert_flags: ['fall'], ...validCallData })
await createAlertsFromCall({ member_id: TEST_ID, alert_flags: ['fall'], ...validCallData })

const { data } = await adminSupabase.from('alerts').select('*').eq('member_id', TEST_ID).eq('alert_type', 'fall')
console.assert(data?.length === 1, `Should be 1 fall alert, got ${data?.length}`)
```
- Expected: Only 1 alert row, not 2
- Fail: Duplicate alert created

**T10.3** `[MANUAL]` After an alert is created by T10.1, open the family dashboard.
- Expected: Within 2 seconds, a Realtime notification appears (Phase 9 integration)
- Expected: Alert is visible in the Alerts Panel on the dashboard
- Fail: Alert visible in Supabase but not triggering Realtime notification

**T10.4** `[AUTO]` Wellness drift test:
```ts
// Insert 14 calls: last 7 days avg ~3.4, prior 7 days avg ~7.7
// Should trigger concern-level drift alert
await checkWellnessDrift(TEST_MEMBER_ID)
const { data } = await adminSupabase.from('alerts').select('*')
  .eq('member_id', TEST_MEMBER_ID).eq('alert_type', 'wellness_drift')
console.assert(data?.length === 1, 'Should have 1 drift alert')

// Insert 14 flat calls at score 6 — should NOT trigger
await checkWellnessDrift(TEST_MEMBER_ID_2)
const { data: data2 } = await adminSupabase.from('alerts').select('*')
  .eq('member_id', TEST_MEMBER_ID_2).eq('alert_type', 'wellness_drift')
console.assert(data2?.length === 0, 'Flat scores should not trigger drift alert')
```
- Expected: Drift detected for declining scores, not for flat scores
- Fail: False positive or false negative

---

### Phase 11 — Family Dashboard

**T11.1** `[MANUAL]` Run the seed script first:
```bash
npx tsx scripts/seed-test-data.ts
```
Log in as a seeded family member. Navigate to `/dashboard`.
- Expected: Dashboard loads within 3 seconds
- Expected: Senior's name appears in the header
- Expected: `StatusDot` is green (seed data has no urgent alerts by default)
- Expected: Today's Wellness Card shows mood emoji, scores, and AI summary text from seed data
- Expected: 7-Day Mood Trend chart renders with coloured dots
- Expected: `NotificationBell` visible in header
- Fail: Any section blank, "undefined", or showing a raw error

**T11.2** `[MANUAL]` While the dashboard is open, insert a new alert for the test member in Supabase SQL Editor.
- Expected: Alert card appears in the Alerts Panel within 2 seconds (Realtime)
- Expected: `StatusDot` changes to amber or red within 2 seconds (without page refresh)
- Fail: Requires page refresh to show alert

**T11.3** `[MANUAL]` Temporarily return a database error from `getMember()`. Reload the dashboard.
- Expected: A friendly human-readable error message appears
- Expected: The rest of the dashboard shows skeletons or a partial state — not a full page crash
- Expected: No raw error code or stack trace visible to the user
- After test: restore the correct function

**T11.4** `[MANUAL]` View the dashboard on a real phone at 375px.
- Expected: All sections visible, no horizontal scroll
- Expected: All text readable without zooming (minimum 18px)
- Expected: All buttons have enough height to tap comfortably
- Fail: Any element cut off, overlapping, or requiring zoom

---

### Phase 12 — Navigator Console

**T12.1** `[MANUAL]` Log in as a `navigator` role user. Navigate to `/navigator`.
- Expected: Only members assigned to THIS navigator appear (not all members)
- Expected: Members with urgent/emergency alerts appear at the TOP of the table
- Expected: A real-time search box filters the member list as you type
- Fail: All members visible (RLS not working), or sort order wrong

**T12.2** `[MANUAL]` With an unacknowledged urgent alert for a member in the navigator's caseload, confirm the alert queue appears above the caseload table.
- Click "Acknowledge" on the alert card.
- Expected: Card disappears immediately (no page reload)
- Expected: In Supabase → `alerts`: `acknowledged = true`, `acknowledged_by` = navigator's user ID, `acknowledged_at` = timestamp
- Fail: Card persists, or DB row not updated

**T12.3** `[MANUAL]` Click a member row in the caseload table.
- Expected: Detail panel slides in from the right
- Expected: Panel shows preferred name, age, plan tier, last 5 call summaries
- Expected: AI pre-call brief appears (stub text in Layer 1)
- Expected: Navigator notes text area is present
- Fail: No panel, or missing required sections

**T12.4** `[MANUAL]` Type a note in the navigator notes area and save.
- Expected: "Saving..." state appears
- Expected: "Saved ✓" appears for ~2 seconds
- Expected: Note persists when panel is closed and reopened
- Expected: Note visible in Supabase → `navigator_notes` table
- Fail: Note not saved, no save feedback, or disappears on close

**T12.5** `[MANUAL]` With panel open, press Escape.
- Expected: Panel closes
- Expected: Focus returns to the member row that was clicked
- Fail: Panel does not close, or focus lost

**T12.6** `[MANUAL]` Log in as a `family` role user. Navigate to `/navigator` by typing it in the URL bar.
- Expected: Immediately redirected to `/dashboard`
- Fail: Navigator console loads for a family user

---

### Layer 1 Gate — Confirm before presenting Layer 1 review to user

**TL1.A** `[AUTO]` All TypeScript compiles:
```bash
npx tsc --noEmit
```
Expected: Zero errors

**TL1.B** `[MANUAL]` Realtime end-to-end: Open family dashboard, insert alert in SQL Editor → alert appears in dashboard within 2 seconds. Confirm.

**TL1.C** `[AUTO]` Run the pre-commit secret check:
```bash
git ls-files | grep -E "^\.env"
git diff HEAD --name-only | xargs grep -l -E "(sk_|SG\.|AC[a-z0-9]{32}|retell-|sk-ant-)" 2>/dev/null
```
Expected: No output from either command.

---

## Layer 2 — AI & Calls

---

### Phase 13 — Anthropic AI Provider

**T13.1** `[AUTO]` Test score extraction with known transcripts:
```ts
const happyTranscript = `
Aria: Hi Dorothy, how are you feeling today?
Dorothy: Oh I'm wonderful! Had a great sleep, already took my morning pills. Feeling full of energy.
Aria: Any pain or discomfort?
Dorothy: Not at all, feeling very comfortable today.`

const scores = await aiProvider.extractCallScores(happyTranscript)
console.assert(scores.mood_score !== null && scores.mood_score >= 7, 'Happy call mood ≥ 7, got: ' + scores.mood_score)
console.assert(scores.medication_taken === true, 'Medication taken should be true')
console.assert(scores.energy_score !== null && scores.energy_score >= 7, 'Energy should be high')
```
- Expected: All assertions pass
- Fail: Any assertion fails

**T13.2** `[AUTO]` Test false positive prevention:
```ts
// "fell asleep" must NOT trigger fall flag
const nap = 'I fell asleep watching the game last night, very restful.'
const scores1 = await aiProvider.extractCallScores(nap)
console.assert(!scores1.alert_flags.includes('fall'), 'Fell asleep should NOT trigger fall flag')

// pain 3/10 must NOT trigger pain_high flag (threshold is >7)
const lowPain = 'My knee is a bit achy, maybe a 3 out of 10, manageable.'
const scores2 = await aiProvider.extractCallScores(lowPain)
console.assert(!scores2.alert_flags.includes('pain_high'), 'Pain 3/10 should NOT trigger pain_high')

// Topic not discussed must return null, never 0
const brief = 'Aria: How are you? Senior: Fine thanks, busy today, gotta go.'
const scores3 = await aiProvider.extractCallScores(brief)
console.assert(scores3.medication_taken === null, 'Undiscussed topic must be null, not false')
console.assert(scores3.energy_score !== 0, 'Undiscussed topic score must be null, not 0')
```
- Expected: All assertions pass (no false positives)
- Fail: Any false positive fires

**T13.3** `[LIVE]` Test Claude summary generation with a real transcript:
- Expected: Summary is 3–5 sentences
- Expected: Summary contains NO numbers or scores
- Expected: Summary contains NONE of: patient, vitals, symptoms, assessment, diagnosis
- Expected: Tone is warm and conversational — reads like a friend's message
- Fail: Any forbidden word present, or summary is clinical/robotic

**T13.4** `[AUTO]` Test crisis disambiguation fail-safe:
```ts
// Simulate API failure — should default to true (crisis)
// Mock the Anthropic client to throw, then call disambiguateCrisisContext
const result = await aiProvider.disambiguateCrisisContext('I dont want to be here', 'context')
// When API throws, result must be true (treat as crisis)
console.assert(result === true, 'API failure must default to true (crisis)')
```
- Expected: Returns `true` when Claude API fails
- Fail: Returns `false` or throws when API fails

---

### Phase 14 — Retell AI Agent Setup

**T14.1** `[LIVE]` Use Retell AI's built-in test call feature. Call your own phone.
- Expected: Phone rings within 15 seconds
- Expected: Voice is warm and natural (not robotic or monotone)
- Expected: Aria introduces herself as "Aria from Thrive@Home"
- Expected: Back-and-forth conversation is possible (Aria listens and responds)
- Fail: No ring, robotic voice, wrong introduction

**T14.2** `[LIVE]` Update the agent with a generated prompt for a test member named "Margaret" who likes "Gardening" and "Books". Call your own phone.
- Expected: Aria says "Margaret" by name
- Expected: Aria mentions gardening OR books naturally (not as a list)
- Expected: Aria asks about mood and wellbeing without it feeling like a medical checklist
- Fail: Wrong name, no interest mentioned, checklist tone

**T14.3** `[LIVE]` During a test call, say: "I've been feeling really hopeless lately and I just don't see the point."
- Expected: Aria responds warmly and empathetically
- Expected: Aria says someone from the team will be in touch
- Expected: Aria does NOT abruptly end the call
- Fail: Aria ignores the statement, ends the call, or responds robotically

**T14.4** `[MANUAL]` After any test call, go to Retell AI → Call History.
- Expected: Call appears with a recording
- Expected: Transcript is available and shows Aria's and the user's words separately
- Fail: No call logged, or no transcript

---

### Phase 15 — Twilio & Retell Call Infrastructure

**T15.1** `[LIVE]` Run a test script calling `triggerCall` (via `callProvider.scheduleCall`) with your own phone number:
```ts
const callId = await callProvider.scheduleCall(
  'test-member-id',
  process.env.TWILIO_PHONE_NUMBER!, // Call yourself for testing
  { preferredName: 'Test', interests: ['Gardening'], priorCallSummaries: [], preferredLanguage: 'english' }
)
console.log('Call ID:', callId)
```
- Expected: Phone rings within 20 seconds
- Expected: Function returns a non-empty call ID string
- Expected: Call appears in both Twilio call logs and Retell AI call history
- Fail: No ring, function throws, or call ID is empty/undefined

**T15.2** `[MANUAL]` Call `callProvider.scheduleCall` with an invalid phone number (`'not-a-phone'`).
- Expected: Throws a typed Error with a human-readable message about invalid phone format
- Expected: Error message includes E.164 format example
- Fail: Silent failure, undefined returned, or generic error

**T15.3** `[MANUAL]` Confirm `callProvider.constructor.name` is `'RetellCallProvider'` (not `'StubCallProvider'`) now that RETELL_API_KEY and TWILIO_ACCOUNT_SID are set.
- Expected: `RetellCallProvider`
- Fail: `StubCallProvider` (env vars not being picked up)

---

### Phase 16 — Outbound Call Scheduler

**T16.1** `[LIVE]` Set a test member's `preferred_call_time` to the current UTC hour. Manually trigger the cron:
```bash
curl -X GET http://localhost:3000/api/cron/daily-calls \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Expected: A `check_in_calls` row created for the member with `status = 'scheduled'`
- Expected: `retell_call_id` column has a real Retell call ID
- Expected: Your phone rings within 2 minutes
- Expected: Console shows: "1 scheduled, 0 skipped, 0 failed"
- Fail: No row created, no call triggered, wrong log counts

**T16.2** `[MANUAL]` Trigger the cron a second time immediately.
- Expected: No new `check_in_calls` row created for the same member today
- Expected: Console shows: "0 scheduled, 1 skipped"
- Fail: Duplicate row created or duplicate call triggered

**T16.3** `[MANUAL]` Trigger the cron WITHOUT the Authorization header:
```bash
curl -X GET http://localhost:3000/api/cron/daily-calls
```
- Expected: `401` response
- Fail: Cron runs without authentication

---

### Phase 17 — Call Webhook & Transcript Processing

**T17.1** `[MANUAL]` Send a test webhook payload with correct Authorization header (use the Codespace port URL):
```bash
curl -X POST https://[CODESPACE_URL].app.github.dev/api/webhooks/retell \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RETELL_WEBHOOK_SECRET" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "test-call-id-001",
      "transcript": "Aria: Hi Margaret, how are you today?\nMargaret: I am doing well! I slept great and took my medications this morning. My energy is quite good today.",
      "recording_url": "https://example.com/recording.mp3",
      "start_timestamp": 1700000000000,
      "end_timestamp": 1700000600000
    }
  }'
```
- Expected: Response is `{"received": true}` with status 200
- Expected: `check_in_calls` row updated with transcript, timestamps, and `status = 'completed'`
- Fail: Non-200 response, or row not updated

**T17.2** `[MANUAL]` Send the same webhook WITHOUT the Authorization header.
- Expected: `401` response
- Expected: Call row is NOT updated
- Fail: 200 response, or row updated without auth

**T17.3** `[LIVE]` After a real call completes (from Phase 16), allow the webhook to process. Check the `check_in_calls` row.
- Expected: `mood_score` is a number 1–10 (not 0, not null if the topic was discussed)
- Expected: `ai_summary` contains a warm, non-clinical paragraph with no numbers
- Expected: `medication_taken` is true or false (or null if not discussed)
- Expected: `alert_flags` is `[]` for a normal call
- Fail: Any score is 0, or summary contains clinical language

**T17.4** `[MANUAL]` Test Realtime integration: Open the family dashboard. Wait for a real call to complete.
- Expected: A "call_summary_ready" toast notification appears within 30 seconds of call ending
- Expected: Dashboard wellness card updates to show real call data (without page refresh)
- Fail: Dashboard requires refresh to show new call data

**T17.5** `[MANUAL]` Send a webhook with a transcript containing a crisis phrase:
```
"Aria: How are you today? Margaret: I just don't want to be here anymore. I see no point to anything."
```
- Expected: `emergency` severity alert created in `alerts` table
- Expected: Row created in `emergency_log` with the triggering phrase
- Expected: `navigator_tasks` row created with `priority = 'critical'`
- Expected: Realtime notification pushed with `severity = 'emergency'`
- Fail: Any of the 4 steps missing

---

### Layer 2 Gate — Confirm before presenting Layer 2 review

**TL2.A** `[AUTO]` `npx tsc --noEmit` — zero errors
**TL2.B** `[LIVE]` A real call was completed and the family dashboard shows real call data
**TL2.C** `[MANUAL]` Crisis test (T17.5) passed — all 4 steps confirmed

---

## Layer 3 — Outbound Notifications

---

### Phase 18 — Twilio SMS Provider

**T18.1** `[LIVE]` Complete a full end-to-end call. Confirm your phone (as linked family member with `sms: true`) receives an SMS within 5 minutes.
- Expected: SMS starts with "Thrive@Home update for [Name] 💚"
- Expected: SMS includes mood emoji + score
- Expected: SMS includes medication status
- Expected: SMS ends with "Reply STOP to unsubscribe"
- Expected: `notification_log` row created with `channel = 'sms'`, `status = 'sent'`
- Fail: No SMS, or missing required content, or no notification_log row

**T18.2** `[LIVE]` Set a family member's `notification_prefs` to `{"sms": false, "email": true}`. Complete a call.
- Expected: No SMS received for that family member
- Expected: `notification_log` shows no SMS attempt for that family member
- Fail: SMS received despite `sms: false`

**T18.3** `[LIVE]` Manually create an `emergency` severity alert in Supabase. Trigger `sendUrgentAlertSMS` directly.
- Expected: SMS arrives within 60 seconds
- Expected: SMS arrives even for a family member with `sms: false` (urgent overrides preferences)
- Expected: SMS text contains "🚨" or similar urgent indicator
- Fail: SMS not sent, takes > 2 minutes, or preferences incorrectly block it

**T18.4** `[MANUAL]` Confirm `smsProvider.constructor.name` is `'TwilioSmsProvider'`.
- Expected: `TwilioSmsProvider`
- Fail: `StubSmsProvider`

---

### Phase 19 — SendGrid Email Provider

**T19.1** `[LIVE]` Complete a test call. Confirm email arrives at the family member's inbox within 30 minutes.
- Expected: Subject line contains the senior's name and a mood emoji
- Expected: Email body shows score bars (mood, energy, comfort)
- Expected: Full AI summary is readable in the email
- Expected: "View Full Dashboard" CTA button visible
- Expected: Footer contains an unsubscribe link
- Fail: No email, missing content, or broken layout

**T19.2** `[MANUAL]` Open the email on a real phone.
- Expected: Nothing cut off at the edges
- Expected: Text readable without zooming
- Expected: CTA button large enough to tap
- Fail: Any layout issue on mobile

**T19.3** `[MANUAL]` Open the email in Gmail (not just a mail preview tool).
- Expected: Score bars render as coloured HTML bars (not broken HTML tags)
- Expected: All sections display correctly
- Expected: No images missing or broken
- Fail: Broken layout in Gmail

---

### Phase 20 — Post-Call Notification Pipeline

**T20.1** `[LIVE]` Complete a real call. Confirm the full notification sequence fires:
- Expected: Realtime notification in dashboard within 30 seconds (Phase 9)
- Expected: SMS within 5 minutes (Phase 18)
- Expected: Email within 30 minutes (Phase 19)
- Expected: All three channels logged in `notification_log`
- Fail: Any channel missing or not logged

**T20.2** `[LIVE]` Complete a crisis call (transcript with crisis language). Confirm crisis escalation fires:
- Expected: `emergency` alert created
- Expected: Emergency SMS sent to ALL family members (even those with `sms: false`)
- Expected: Emergency SMS sent to `ONCALL_NAVIGATOR_PHONE`
- Expected: Realtime `emergency` severity notification visible on dashboard immediately
- Fail: Any step missing or delayed more than 60 seconds

---

### Phase 21 — Medication Reminders

**T21.1** `[LIVE]` Insert a `medication_schedules` row with `reminder_time` set to 2 minutes from now. Trigger the cron manually.
- Expected: SMS arrives on the member's phone within 3 minutes
- Expected: SMS contains "medications 💊"
- Expected: `medication_reminder_log` row created (or notification_log entry with `channel = 'sms'`)
- Fail: No SMS, wrong content, or no log row

**T21.2** `[AUTO]` Insert 3 consecutive calls with `medication_taken = false`. Run missed medication check.
- Expected: `concern` alert created with `alert_type = 'medication_miss'`
- Expected: `navigator_tasks` row created
- Fail: No alert after 3 consecutive misses

**T21.3** `[AUTO]` Insert a 4th consecutive miss while the existing `medication_miss` alert is still unacknowledged.
- Expected: No second `medication_miss` alert created (deduplication)
- Fail: Duplicate alert created

---

### Phase 22 — Wellness Drift (Fully Live)

**T22.1** `[LIVE]` After inserting the declining-score test data from T10.4, confirm the `urgent` drift alert triggers real SMS and email notifications (not just stub logs).
- Expected: Family member receives SMS and email about the wellness concern
- Expected: Both logged in `notification_log` with `status = 'sent'`
- Fail: Notifications still going to stub (console.log only)

---

### Phase 23 — Call History Page

**T23.1** `[MANUAL]` Navigate to `/dashboard/history` with 10+ completed calls.
- Expected: Calls listed newest-first
- Expected: Each row shows date, mood emoji + score, medication status, alert badges
- Expected: Clicking "View summary" expands to full AI summary and scores
- Expected: Flags shown in plain English (not raw flag names like "pain_high")
- Fail: Missing content, wrong order, or raw flag names

**T23.2** `[MANUAL]` With 25+ calls, scroll to the bottom of the first 20.
- Expected: "Load more" button appears
- Expected: Clicking it loads 20 more without page reload
- Fail: All calls load at once, or load more doesn't work

---

### Layer 3 Gate — Confirm before presenting Layer 3 review

**TL3.A** `[AUTO]` `npx tsc --noEmit` — zero errors
**TL3.B** `[LIVE]` Full notification flow confirmed: call → Realtime → SMS → email, all logged
**TL3.C** `[LIVE]` Crisis escalation confirmed: SMS to family + on-call navigator within 60 seconds

---

## Layer 4 — Billing

---

### Phase 24 — Pricing Page (Static)

**T24.1** `[MANUAL]` Navigate to `/pricing`.
- Expected: Four plan cards visible: Basics $19/mo, Connect $39/mo, Complete $69/mo, Premier $129/mo
- Expected: Each card lists key features
- Expected: "No contracts" note visible
- Expected: "Get started" buttons present (not yet functional — they will be wired in Phase 26)
- Fail: Any card missing, wrong price, or missing features

---

### Phase 25 — Stripe Products & Config

**T25.1** `[MANUAL]` Open Stripe Dashboard → Products.
- Expected: 4 products visible with correct names and monthly prices
- Fail: Any product missing or wrong price

**T25.2** `[AUTO]` Verify all 4 Stripe price IDs are set and non-empty:
```ts
import { STRIPE_PLANS } from '../lib/stripe/config'
Object.entries(STRIPE_PLANS).forEach(([key, plan]) => {
  console.assert(plan.priceId && plan.priceId.startsWith('price_'), `Missing or invalid price ID for ${key}: ${plan.priceId}`)
})
console.log('✓ All Stripe price IDs present and valid')
```
- Expected: All 4 price IDs start with `price_`
- Fail: Any price ID missing, empty, or wrong format

**T25.3** `[MANUAL]` Open Stripe Dashboard → Webhooks.
- Expected: One endpoint registered pointing to `https://your-app.vercel.app/api/webhooks/stripe`
- Expected: Status shows "Enabled"
- Expected: At least 5 event types selected
- Fail: No webhook, wrong URL, or disabled

---

### Phase 26 — Plan Selection in Onboarding

**T26.1** `[MANUAL]` Complete the onboarding form. Confirm Step 4 (plan selection) now appears.
- Expected: Four plan cards shown with prices and features
- Expected: One plan can be selected (highlighted border)
- Expected: Clicking "Continue" redirects to Stripe Checkout
- Fail: Step 4 missing, or plan selection doesn't work

**T26.2** `[MANUAL]` Log in as a member enrolled in Layer 1–3 (no plan selected, defaulting to 'basics'). Navigate to dashboard.
- Expected: A plan upgrade prompt appears ("Choose your plan to unlock full features")
- Expected: Prompt links to the pricing page
- Fail: No prompt for previously enrolled members

---

### Phase 27 — Checkout Flow & Stripe Webhook

**T27.1** `[LIVE]` Click "Get started" on the Connect plan. Complete payment with test card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`.
- Expected: Redirected to Stripe Checkout on stripe.com
- Expected: Plan name and price visible on Stripe page
- Expected: After payment, redirected to `/dashboard?subscribed=true`
- Expected: "Welcome to Thrive@Home! 🎉" banner visible on dashboard
- Expected: `subscriptions` row created in Supabase with `status = 'active'`
- Expected: Stripe Dashboard shows new Customer and Subscription
- Fail: Any step fails

**T27.2** `[LIVE]` Use Stripe CLI to replay each webhook event:
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```
- Expected: Each event updates Supabase correctly
- Expected: `payment_failed` → family receives payment failure email
- Expected: `subscription.deleted` → `subscriptions.status = 'cancelled'`
- Fail: Any event not handled or Supabase not updated

**T27.3** `[MANUAL]` POST to webhook without `stripe-signature` header.
- Expected: `401` response
- Fail: Any 2xx response without a valid signature

---

### Phase 28 — Billing Management Page

**T28.1** `[MANUAL]` Navigate to `/dashboard/billing`.
- Expected: Current plan name and price shown
- Expected: Next billing date shown
- Expected: "Change plan", "Update payment method", "Cancel subscription" buttons visible
- Expected: Last 6 invoices listed with date, amount, status
- Fail: Missing content or broken buttons

**T28.2** `[MANUAL]` Click "Change plan".
- Expected: Redirected to Stripe Customer Portal
- Fail: 404 or error

---

### Phase 29 — Accessibility & Compliance Audit

**T29.1** `[AUTO]` Run axe-cli against all main pages:
```bash
npx axe-cli https://your-app.vercel.app --tags wcag2aa
npx axe-cli https://your-app.vercel.app/login --tags wcag2aa
npx axe-cli https://your-app.vercel.app/onboarding --tags wcag2aa
npx axe-cli https://your-app.vercel.app/dashboard --tags wcag2aa
npx axe-cli https://your-app.vercel.app/pricing --tags wcag2aa
```
- Expected: Zero violations on all pages
- Fail: Any violation (zero is the requirement — not "acceptable violations")

**T29.2** `[MANUAL]` Navigate through the full signup → onboarding → dashboard flow using only the keyboard (Tab, Enter, Space — no mouse).
- Expected: Every element reachable and operable
- Expected: Focus ring always visible
- Fail: Any element unreachable by keyboard

**T29.3** `[MANUAL]` Find a real person aged 65 or older who has not seen the product. Ask them to complete the onboarding form and view the dashboard without any help. Time them.
- Expected: Completes onboarding in under 10 minutes without assistance
- Expected: Can identify what the dashboard is showing without explanation
- Document every point of confusion — fix all of them before marking this phase complete
- Fail: Cannot complete onboarding independently, or cannot understand dashboard

**T29.4** `[MANUAL]` Open the dashboard with browser font size set to "Largest" (browser settings → zoom/font).
- Expected: Nothing breaks, no text is cut off, all sections still readable
- Fail: Any layout break at maximum font size

---

### Layer 4 Gate — Before switching to live Stripe keys

**TL4.A** `[AUTO]` `npx tsc --noEmit` — zero errors
**TL4.B** `[LIVE]` Full Stripe payment flow tested end-to-end with test card
**TL4.C** `[AUTO]` All axe-cli scans show zero WCAG 2.1 AA violations
**TL4.D** `[MANUAL]` 65+ user completed onboarding without assistance
**TL4.E** `[MANUAL]` Human confirmed all 5 HIPAA BAAs are signed and stored
**TL4.F** `[MANUAL]` Human explicitly confirmed they want to switch to live Stripe keys
