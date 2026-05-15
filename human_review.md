# Thrive@Home — Human Review Checklist (v1.0 — M1–M6)

> **This file is for you, the founder. The AI cannot do these checks.**
> When the AI presents a phase review, find the phase here and work through every item yourself.
> Mark ✅ (looks correct) or ❌ (something wrong or missing).
> Reply **APPROVED** only when everything is ✅.
> Reply **ISSUE: [describe exactly what you saw]** if anything is ❌.
> Do not skip items. Do not mark ✅ for something you did not personally verify.

---

## Phase 1 — Project Scaffold

Open the Vercel deployment URL in your browser:
- [ ] "Thrive@Home" appears in large dark navy text
- [ ] A tagline appears below in teal colour
- [ ] Right-click → Inspect → Console tab shows zero red errors
- [ ] Background is warm off-white (not bright white or grey)
- [ ] Navigation links work and don't 404

Click one of the "Coming soon" placeholder pages (e.g. `/navigator`):
- [ ] A simple "Coming soon" message appears — not an error page

Make a small change in the Codespace, commit, push to `main`:
- [ ] Vercel shows a new deployment triggered within 2 minutes
- [ ] Deployment completes with a green checkmark

Open `.env.local.example` in the Codespace file browser:
- [ ] File contains more than 30 lines
- [ ] Every value is blank — no actual credentials anywhere in this file
- [ ] All eight service sections are present (Supabase, Anthropic, Retell, Twilio, etc.)

---

## Phase 2 — Supabase Connection

Navigate to `/test` on your running app:
- [ ] A message from the database appears on screen
- [ ] It matches exactly what you manually typed into Supabase Table Editor
- [ ] Not "undefined", "null", "error", or a loading spinner that never finishes

After the AI removes the test page: navigate to `/`:
- [ ] Homepage still loads correctly — no broken imports

---

## Phase 3 — Database Schema

Open Supabase → Table Editor in your browser:
- [ ] You can count more than 15 tables in the left sidebar
- [ ] Clicking `members` shows columns including: `preferred_name`, `plan_tier`, `check_in_frequency`, `topics_enjoy`
- [ ] Clicking `check_in_calls` shows columns including: `mood_score`, `ai_summary`, `alert_flags`
- [ ] Clicking `realtime_notifications` shows columns including: `type`, `severity`, `read`
- [ ] Clicking `audit_log` shows columns including: `action`, `resource_type`

Open Supabase → Database → Replication:
- [ ] `realtime_notifications` is listed
- [ ] INSERT is checked/enabled for that table

Open Supabase → Authentication → Policies:
- [ ] Every table in the sidebar shows "RLS enabled"
- [ ] None show "RLS disabled"

---

## Phase 4 — RLS Verification

The AI will run a test script and show you the terminal output. Read it carefully:
- [ ] Output says "Cross-user members: BLOCKED ✓"
- [ ] Output says "Own member: ACCESSIBLE ✓"
- [ ] Output says "Admin reads all: [number ≥ 2] ✓"
- [ ] Output does NOT contain the word "EXPOSED"
- [ ] Output says "Cleanup complete — no test data remaining"

---

## Phase 5 — Authentication

Navigate to `/signup` on your app:
- [ ] A sign-up form appears with fields for name, email, password, and relationship
- [ ] All text is large and readable (not tiny)
- [ ] The form uses navy and teal colours

Fill in test details and submit:
- [ ] You are taken to `/onboarding` (or a relevant next page)
- [ ] No error messages appear

Open Supabase → Authentication → Users:
- [ ] Your test email appears in the list

Open Supabase → Table Editor → `family_members`:
- [ ] A row exists with your test email and `role = 'family'`

Log out (AI will show you how). Type `/dashboard` directly in the URL bar:
- [ ] You are immediately redirected to `/login`
- [ ] You cannot see any dashboard content while logged out

---

## Phase 6 — Member Onboarding Form

Navigate to `/onboarding`:
- [ ] A form appears with a progress bar showing "Step 1 of 3"
- [ ] Step 1 has fields for: name, preferred name, date of birth, phone, language, and address
- [ ] All fields are clearly labelled — no field that only has a placeholder with no label
- [ ] The "Next" button is large and easy to click

Click "Next" without filling anything in:
- [ ] Error messages appear on each required field
- [ ] You do NOT advance to Step 2

Complete all 3 steps with valid data. On the confirmation page:
- [ ] The page says "Welcome to the Thrive@Home family, [the name you entered]!"
- [ ] The correct preferred name appears — not "undefined" or a placeholder

Open Supabase → `members`:
- [ ] A row exists with all the data you entered
- [ ] The `plan_tier` column shows `basics` — not null or empty

Partially fill the form, then refresh the page:
- [ ] Your form data is still there after the refresh

Open the form on your actual phone:
- [ ] All fields visible without horizontal scrolling
- [ ] All buttons easy to tap

---

## Phase 7 — App Data Layer & Seed Data

The AI runs the seed script and shows you the terminal output:
- [ ] Terminal shows: "Seed complete. Login: test-family@thriveathome.dev / TestPassword123!"
- [ ] No red error lines in the output

Log in using those credentials:
- [ ] Login works — you are taken to the dashboard or onboarding

The AI runs the seed script a second time immediately:
- [ ] Terminal shows "Already exists — skipping" messages
- [ ] You personally check Supabase → `members` — still only ONE Margaret Chen row (not two)

The AI runs the clear script:
- [ ] Terminal completes without errors
- [ ] You check Supabase → `members` — Margaret Chen row is gone

---

## Phase 8 — Primitive UI Components

The AI creates a temporary `/test-ui` page. Navigate to it:
- [ ] You can see buttons in different styles: navy-filled, teal-outlined, red, and ghost
- [ ] You can see cards with different coloured borders
- [ ] Mood emojis appear: 😊 for a high score input, 😐 for a mid score, — for null
- [ ] A coloured dot appears: green, amber, red for different status inputs
- [ ] A bell icon with a "0" count badge is visible
- [ ] A progress bar shows at different percentages

Tab through the page using only the keyboard (Tab key):
- [ ] You can reach every button by pressing Tab
- [ ] You can always see which element is focused (a visible border or highlight appears)
- [ ] You can press Enter or Space to activate buttons

On real phone at 375px:
- [ ] Everything fits on screen — no horizontal scrolling

---

## Phase 9 — Supabase Realtime

**This is the most important test in the entire v1 build.** Read these instructions carefully.

**Setup:** Run the seed script. Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`. Keep this tab open.

**Test 1 — Does the notification appear instantly?**

Open Supabase SQL Editor in a second browser tab. While watching the dashboard tab, insert:
```sql
INSERT INTO realtime_notifications (member_id, type, title, body, severity)
VALUES ('[MARGARET_ID]', 'new_alert', 'Test Alert', 'Realtime is working.', 'concern');
```
(The AI will give you Margaret's member_id)

- [ ] Within 2 seconds, a toast notification appears in the dashboard tab
- [ ] The bell icon shows "1"
- [ ] You did NOT refresh the page — it appeared automatically

**Test 2 — Does the bell dropdown work?**

Click the bell icon:
- [ ] A dropdown opens showing the notification
- [ ] A "Mark read" button is visible on the notification

Click "Mark read":
- [ ] The notification disappears from the dropdown
- [ ] The bell count goes to "0"
- [ ] Open Supabase → `realtime_notifications` — the row shows `read = true`

**Test 3 — Is it private?**

The AI inserts a notification for a DIFFERENT member while you watch:
- [ ] You do NOT see any notification appear for the other member

If any of the above fail, do not mark this phase complete. The realtime system is foundational.

---

## Phase 10 — Alert Logic & Detection

The AI runs the alert rules test and shows you the terminal output:
- [ ] Output confirms each alert rule fires with the correct severity
- [ ] Output confirms deduplication: "Second identical alert: SKIPPED ✓"
- [ ] Output confirms wellness drift detects declining scores but not flat scores

While the dashboard is open, the AI creates a test alert:
- [ ] An alert card appears in the dashboard Alerts Panel within 2 seconds — no page refresh

The alert card has the right colour:
- [ ] Red for emergency
- [ ] Amber/orange for urgent
- [ ] Soft blue or grey for concern or informational

---

## Phase 11 — Crisis Detection

The AI sends a test transcript with a crisis phrase and shows you the results. In the terminal you should see:
- [ ] "emergency_log row created: ✓"
- [ ] "emergency alert created: ✓"
- [ ] "critical navigator task created: ✓"
- [ ] "Realtime emergency notification pushed: ✓"
- [ ] "[STUB][SMS][URGENT] Would send to..." log line

The AI also shows a false-positive test: "fell asleep watching TV":
- [ ] Output shows "No crisis detected — correct ✓" or equivalent

**Think about this:** If a real senior said "I don't want to be here anymore" on a call, would this system catch it and escalate to humans? Based on what you've seen in the test output, do you believe it would?
- [ ] Yes, I believe it would catch it based on the test results I saw

---

## Phase 12 — Family Dashboard

Run the seed script. Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`:

- [ ] Dashboard loads within 3 seconds (use a stopwatch or browser performance tab)
- [ ] "Margaret" or "Margaret Chen" appears in the header — not "undefined" or "Loading..."
- [ ] A coloured status dot is visible in the header
- [ ] A bell icon with a count badge is visible
- [ ] The "Today's Wellness" section shows: a mood emoji, energy level, comfort level, medication status, and a text summary paragraph
- [ ] Comfort is labelled "Comfort level" — NEVER "Pain level"
- [ ] The medication status uses ✓ (green) or ✗ (amber) — not red for a single miss
- [ ] The 7-day mood chart appears — a line graph with coloured dots
- [ ] Four tab buttons appear for the health timeline (7 Days, 30 Days, 60 Days, 90 Days)
- [ ] Clicking each tab shows a chart — no blank tabs, no errors
- [ ] The Alerts Panel shows the seeded concern alert
- [ ] Four large "Quick Actions" buttons are visible at the bottom

While the dashboard is open, the AI inserts a new alert in SQL Editor:
- [ ] An alert card appears in the Alerts Panel within 2 seconds — no page refresh required
- [ ] The status dot changes colour to reflect the alert

The AI breaks the Supabase connection temporarily, you reload:
- [ ] A friendly message appears — not a raw error code or stack trace visible on screen

On your real phone at 375px width:
- [ ] All sections are visible — no horizontal scrolling
- [ ] You can read all text without zooming in
- [ ] All buttons have enough height to tap comfortably

---

## Phase 13 — Call History Page

Navigate to `/dashboard/history`:
- [ ] A list of calls appears, newest first
- [ ] Each row shows: date, time, a mood emoji, medication status (✓ or ✗), and any alert badges
- [ ] Alert badges show readable text — not raw code like "pain_high"

Click "View summary" on any call:
- [ ] Full AI summary paragraph expands (the stub placeholder text is fine in v1)
- [ ] All scores visible: mood, energy, comfort, medication

With 25+ calls (the AI will add more), scroll to the bottom of the first 20:
- [ ] A "Load more" button appears
- [ ] Clicking it adds more calls — the page does not reload from scratch

Clear all calls. Navigate to `/dashboard/history`:
- [ ] A friendly empty state message appears — not an error or a blank page

---

## Phase 14 — Family Coordination Tools

**Task Board** (`/dashboard/family/tasks`):

Open the page in two separate browser windows as two different family members linked to the same senior.

Create a task in Window 1:
- [ ] The task appears in Window 2 within 2 seconds — no page refresh in Window 2

Mark the task complete in one window:
- [ ] Task status updates, `completed_at` timestamp appears

**Messaging** (`/dashboard/family/messages`):

With two windows open as two different family members:
- [ ] Message sent in Window 1 appears in Window 2 in real time

**Document Vault** (`/dashboard/documents`):

Upload a small PDF file:
- [ ] The file appears in the document list after upload
- [ ] Clicking "Download" opens or saves the file — the link works

Upload a file larger than 10MB:
- [ ] A clear error message appears: file is too large
- [ ] Upload does not proceed

Open Supabase → Storage → Buckets:
- [ ] A bucket named `member-documents` exists
- [ ] It is marked as **private** — not public

**Family Nudge:**

The AI manually triggers the nudge for a family member who hasn't logged in for 8 days:
- [ ] A notification appears in that family member's dashboard bell within 10 seconds

---

## V1 Complete Gate — Before Considering V1 "Done"

Read every item below before replying APPROVED to the V1 completion review:

- [ ] Every Phase 1–14 human review above was completed and passed
- [ ] The Realtime test (Phase 9) worked — notification appeared within 2 seconds without page refresh
- [ ] The crisis detection test (Phase 11) confirmed all 5 steps logged
- [ ] The dashboard is usable on a real phone at 375px with no zooming required
- [ ] All placeholder pages navigate cleanly — no 404 errors anywhere in the app
- [ ] Document vault is using a private storage bucket (confirmed in Supabase)
- [ ] `npx tsc --noEmit` shows zero errors

**After V1 is approved:** You will begin the Add-On milestones (M7–M12) by appending a new prompt document. The existing code does not need to change — the modular architecture means new services simply replace stubs.
