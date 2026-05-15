# Thrive@Home — Human Review Checklist (v1.0)

> **This file is for you, the founder. The AI cannot do these checks.**
> When the AI presents a phase review and asks for APPROVED or ISSUE, come to this file, find the phase, and go through every item yourself.
>
> Mark ✅ for "looks right" and ❌ for "something is wrong or missing."
> If every item is ✅, reply: **APPROVED**
> If any item is ❌, reply: **ISSUE: [describe exactly what you saw and what you expected]**
>
> Do not skip items. Do not mark ✅ for something you did not personally check.

---

## How to use this file

1. The AI presents: `✅ PHASE [N] — [NAME] — COMPLETE, AWAITING YOUR APPROVAL`
2. Find Phase N in this file
3. Work through every checklist item
4. All ✅ → reply **APPROVED**
5. Any ❌ → reply **ISSUE: [describe exactly what you saw]**

---

## M1 — Foundation

### Phase 1 — Project Scaffold

Open the Vercel deployment URL in your browser:
- [ ] The page loads — no blank screen, no error message
- [ ] "Thrive@Home" appears in large dark navy text
- [ ] A tagline appears below in teal
- [ ] Right-click → Inspect → Console tab shows **zero red errors**
- [ ] The background is a warm off-white (not bright white or grey)

Make a trivial change (add a space somewhere), commit, push to `main`:
- [ ] Vercel dashboard shows a new deployment triggered within 2 minutes
- [ ] Deployment completes with a green checkmark

Open `.env.local.example` in the Codespace:
- [ ] The file has more than 25 lines
- [ ] Every value is blank — no actual credentials in this file
- [ ] You can see section headings for Add-On services (Anthropic, Twilio, Stripe, etc.)

Run `git ls-files | grep .env` in the terminal:
- [ ] No output at all — no `.env` file is tracked by Git

Navigate to a few placeholder routes (e.g. `/navigator`, `/dashboard/services`, `/volunteer`):
- [ ] Each shows a "Coming soon" message — not a 404 error

---

### Phase 2 — Supabase Connection

Navigate to `/test` on your running app:
- [ ] A message from the database appears on screen — matches what you typed in Supabase
- [ ] The message is not "undefined", "null", or an error
- [ ] The page does not spin forever

Temporarily break the Supabase URL (the AI will do this):
- [ ] A readable error message appears — not a raw stack trace or error code

After the AI removes the test page and table:
- [ ] The homepage at `/` still loads correctly

---

### Phase 3 — Database Schema

Open Supabase → Table Editor:
- [ ] You can see more than 15 tables in the left sidebar
- [ ] Clicking `members` shows columns including: `full_name`, `preferred_name`, `plan_tier`, `status`
- [ ] Clicking `check_in_calls` shows columns including: `mood_score`, `ai_summary`, `alert_flags`
- [ ] Clicking `realtime_notifications` shows columns including: `type`, `title`, `body`, `severity`, `read`

Open Supabase → Database → Replication:
- [ ] `realtime_notifications` is listed with INSERT events enabled

Open Supabase → Authentication → Policies:
- [ ] All tables show "RLS enabled" — none say "disabled"

---

### Phase 4 — RLS Verification

The AI runs the cross-user isolation test and shows you the terminal output:
- [ ] Output says "Cross-user isolation: PASSED"
- [ ] Output says "Own data access: PASSED"
- [ ] Output says "Service role reads all: PASSED"
- [ ] Output does NOT say "FAILED" anywhere
- [ ] Output says test data was cleaned up

Open Supabase → Table Editor → `members`:
- [ ] No test rows with names like "User A" or "User B" remain

---

## M2 — Member Data

### Phase 5 — Authentication

Navigate to `/signup`. Fill in test details and submit:
- [ ] Redirected to `/onboarding`
- [ ] No error messages on the page

Open Supabase → Authentication → Users:
- [ ] Your test email appears in the list

Open Supabase → Table Editor → `family_members`:
- [ ] A row exists with your test email and `role = 'family'`

Log out. Type `/dashboard` directly in the address bar:
- [ ] Immediately redirected to `/login` — dashboard content is never visible

Log out. Type `/navigator` in the address bar:
- [ ] Immediately redirected to `/login`

Log back in as your test family user. Type `/navigator` in the address bar:
- [ ] Immediately redirected to `/dashboard` (family users cannot access navigator console)

---

### Phase 6 — Member Onboarding Form

Navigate to `/onboarding`:
- [ ] A form appears with a progress bar at the top showing "Step 1 of 3"
- [ ] Step 1 has fields for: full name, preferred name, date of birth, phone number, language, address
- [ ] All field labels are visible (not just grey placeholder text inside the field)
- [ ] The "Next" button is large and easy to click

Click "Next" with all fields empty:
- [ ] Error messages appear below each required field
- [ ] The page does NOT advance to Step 2

Enter today's date as the date of birth, click "Next":
- [ ] Error message appears — must be at least 60 years old
- [ ] Does NOT advance

Enter `abc-xyz-123` as the phone number, click "Next":
- [ ] Error message appears — invalid phone format
- [ ] Does NOT advance

Complete all 3 steps with valid data and submit:
- [ ] Redirected to a confirmation page
- [ ] Confirmation shows "Welcome to the Thrive@Home family, [the preferred name you entered]!"
- [ ] The preferred name is NOT "undefined" or blank

Open Supabase → `members` table:
- [ ] New row visible with the data you entered
- [ ] `plan_tier` column shows `basics` — not null, not empty, not anything else

Partially fill Step 2, then refresh the browser:
- [ ] Your Step 2 data is still there after refresh

Open the onboarding form on your actual phone:
- [ ] All fields fit on screen without horizontal scrolling
- [ ] All buttons are easy to tap — no zooming needed

---

### Phase 7 — App Data Layer & Seed Data

The AI runs the seed script and shows you the terminal output:
- [ ] Output ends with: `Login: test-family@thriveathome.dev / TestPassword123! | Member: Margaret Chen`
- [ ] No red error lines in the output

Log in using the seed credentials:
- [ ] Login works — no error

Open Supabase → `check_in_calls`:
- [ ] 14 rows exist linked to Margaret Chen, spanning the last 14 days
- [ ] Each row has a `mood_score` and a short `ai_summary` text

The AI runs the seed script a second time (idempotency check):
- [ ] The terminal shows no errors
- [ ] The row count in Supabase stays the same — no duplicates created

---

## M3 — UI System

### Phase 8 — Primitive UI Components

Navigate to `/test-ui`:
- [ ] You see buttons in different styles: dark navy (primary), teal outlined (secondary), red (danger), subtle/ghost
- [ ] You see cards with different border accents: default, teal, amber, red
- [ ] You see small coloured badge pills
- [ ] You see mood emojis: 😊 for high scores, 😐 for middle, 😔 for low, — for no score
- [ ] You see coloured dots: green (no alerts), amber (concern), red (urgent/emergency)
- [ ] You see a bell icon with a "0" count badge
- [ ] You see a progress bar
- [ ] A modal can be opened and closed with the Escape key

Tab through the page using only the keyboard (Tab key, no mouse):
- [ ] Every button is reachable by pressing Tab
- [ ] You can always see which element is focused (a visible outline or highlight)
- [ ] Pressing Enter or Space activates buttons

Open the Modal:
- [ ] Tab key stays trapped inside the Modal — you cannot Tab outside it while it's open
- [ ] Pressing Escape closes the Modal
- [ ] After closing, focus returns to whatever opened the Modal

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime

**This is the most important test in M1–M6.**

Run the seed script. Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`.
The AI inserts a test notification via the Supabase SQL Editor while you watch.

**Does it appear instantly?**
- [ ] Within 2 seconds, a toast notification appears in the corner — WITHOUT refreshing the page
- [ ] The bell icon in the header shows a count of "1"
- [ ] The notification title is "Test Realtime" (or similar — whatever the AI inserted)

Click the bell icon:
- [ ] A dropdown opens showing the notification
- [ ] A "Mark read" button is visible next to the notification

Click "Mark read":
- [ ] The bell count returns to "0"
- [ ] The notification is no longer in the unread list

**Is it private?**
The AI inserts a notification for a DIFFERENT member while you watch:
- [ ] You do NOT see the other member's notification — only your own member's notifications appear

---

## M5 — Alert Engine

### Phase 10 — Alert Logic & Detection

The AI runs the alert rules test script and shows you the output:
- [ ] Output says all 8 alert rules passed
- [ ] Output confirms deduplication worked — only 1 alert created when same type triggered twice

While the dashboard is open, the AI creates a test alert:
- [ ] An alert card appears in the Alerts Panel within 2 seconds — no page refresh
- [ ] The StatusDot in the header changes colour

The AI runs the wellness drift test:
- [ ] Output confirms: declining scores triggered a drift alert
- [ ] Output confirms: flat scores did NOT trigger a drift alert

### Phase 11 — Crisis Detection

The AI runs the crisis detection test and shows you the output:
- [ ] Output confirms all 5 escalation steps fired:
  - Emergency log row created
  - Emergency alert created
  - Critical navigator task created
  - Realtime notification pushed
  - Stub SMS log visible: `[STUB][SMS][URGENT] Would send to...`
- [ ] Output confirms "fell asleep watching TV" did NOT trigger crisis detection

**Take a moment with this one:** If a real senior said something concerning on a call, this system would catch it and immediately notify humans via multiple channels. The stubs confirm the actions would happen — the real connections (SMS, email) are added in M8/M10.

---

## M6 — Family Dashboard

### Phase 12 — Dashboard Shell & Health Timeline

Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`:
- [ ] Loads within 3 seconds
- [ ] "Checking in on Margaret" (or similar) appears in the header
- [ ] A coloured StatusDot is visible next to the name
- [ ] A bell icon with a count badge is visible
- [ ] Today's Wellness Card shows a mood emoji, some scores, and a summary paragraph
- [ ] The 7-Day Mood Trend shows a line chart with coloured dots
- [ ] The Health Timeline has 4 tabs: 7-day, 30-day, 60-day, 90-day — each tab renders a chart when clicked

While the dashboard is open, the AI inserts a test alert:
- [ ] An alert card appears in the Alerts Panel within 2 seconds — no page refresh
- [ ] The StatusDot changes colour

Temporarily break the Supabase connection (the AI will do this):
- [ ] A friendly message appears — not a raw error code or stack trace

Open the dashboard on your actual phone:
- [ ] All sections are visible without horizontal scrolling
- [ ] All text is readable without zooming
- [ ] All buttons are large enough to tap comfortably

---

### Phase 13 — Call History Page

Navigate to `/dashboard/calls`:
- [ ] A list of calls appears, newest first
- [ ] Each row shows a date, a mood emoji, and medication status
- [ ] The alert flag icons use plain English labels when expanded — not raw flag names like "pain_high" or "no_eating"

Click a call row to expand it:
- [ ] The full AI summary paragraph appears
- [ ] Scores are shown with labels (Mood, Energy, Comfort)
- [ ] Alert flags are written in plain English

With more than 20 calls, scroll to the bottom:
- [ ] A "Load more" button appears
- [ ] Clicking it adds more calls without the whole page reloading

---

### Phase 14 — Family Coordination Tools

Navigate to `/dashboard/family/tasks`:
- [ ] A task board loads
- [ ] You can create a task by filling in a title and clicking create
- [ ] The new task appears immediately in the list

Create a task as one family member and check if another family member sees it (use two browser windows):
- [ ] The task appears for the second family member within 2 seconds — no page refresh needed

Mark a task as complete:
- [ ] The task immediately moves to the completed section — no page reload

Navigate to `/dashboard/family/messages`:
- [ ] A messaging interface loads
- [ ] You can type and send a message
- [ ] The message appears immediately at the bottom

Send a message and check the second family member's window:
- [ ] The message appears for them within 2 seconds — no page refresh

Navigate to `/dashboard/documents`:
- [ ] The page loads
- [ ] You can upload a PDF — a file picker appears
- [ ] After upload, the document appears in the list with a file name and upload date
- [ ] Clicking "Download" downloads the file successfully

Try to upload a very large file (over 10MB):
- [ ] A clear error message appears — file too large
- [ ] The upload does not proceed

---

## V1 Final Gate — Before Calling V1 Complete

Read every item below carefully before replying APPROVED to the V1 final gate.

**Technical:**
- [ ] `npx tsc --noEmit` in the terminal shows zero errors
- [ ] `git ls-files | grep .env` in the terminal shows no output (no secrets tracked)
- [ ] axe-cli accessibility scan shows zero violations on the dashboard, onboarding, and login pages
- [ ] All placeholder routes return "Coming soon" — none return 404

**Core features:**
- [ ] Sign up → enrol Margaret Chen → dashboard loads with her data → all working
- [ ] New alert appears on dashboard within 2 seconds without refreshing (Realtime confirmed)
- [ ] Family task appears for all linked family members without refresh
- [ ] Document upload and download work correctly
- [ ] Crisis detection stub confirms it would escalate (visible in terminal logs)

**Mobile:**
- [ ] Viewed dashboard on a real phone at 375px — no horizontal scroll, all text readable, all buttons tappable

**What V1 is:** A working, real-data product that a family can use to stay connected to their senior. Every alert fires, every notification is instant, and the dashboard is fully functional — using stub implementations for any feature that requires a paid external service (AI calls, SMS, email, billing).

**What comes next:** M7–M12 are Add-Ons that layer real AI calls, SMS, email, and billing on top of this working foundation. Each Add-On requires only two file changes to activate — the real service implementation and `providers.ts`.

When every item above is ✅, reply **APPROVED** and the V1 build is complete.
