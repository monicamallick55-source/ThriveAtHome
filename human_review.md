# Thrive@Home — Human Review Checklist (v1.0)

> **This file is for you, the founder. The AI cannot do these checks.**
>
> When the AI presents `✅ PHASE [N] — COMPLETE, AWAITING YOUR APPROVAL`, come to this file.
> Work through every item for that phase. Mark ✅ or ❌.
> If every item is ✅ → reply **APPROVED**
> If any item is ❌ → reply **ISSUE: [describe exactly what you saw and what you expected]**
>
> **Important habit:** The agent can occasionally mark a checklist item complete when it isn't.
> Your review is the catch for this. For items marked "agent reports PASSED," do a quick spot check yourself.

---

## How to use this file

1. Wait for: `✅ PHASE [N] — [NAME] — COMPLETE, AWAITING YOUR APPROVAL`
2. Find Phase N below
3. Work through every ✅/❌ item yourself — do not skip
4. Check `checklist.md` — confirm no items are `[ ]` or `[~]` (agent claiming complete with pending items)
5. All ✅ → reply **APPROVED**
6. Any ❌ → reply **ISSUE: [what you saw]**

---

## What to do if the agent is BLOCKED

If the agent presents a BLOCKED message instead of a phase review:

1. Read the BLOCKED entry in `progress.md` — it lists what was tried (H1, H2, H3) and what the current error is
2. Look at the specific URL or Supabase dashboard the agent names
3. If you can see what's wrong: reply with a description of what you observe
4. If you're not sure: reply with the exact error message you see on screen and ask the agent to try another approach
5. Never tell the agent to "just skip it and move on" — the BLOCKED item exists for a reason

---

## M1 — Foundation

### Phase 1 — Project Scaffold

Open the Vercel deployment URL:
- [ ] "Thrive@Home" appears in large dark navy text
- [ ] A tagline appears in teal below the heading
- [ ] DevTools → Console tab → zero red errors
- [ ] Background is warm off-white (not bright white or grey)

Push a trivial change to GitHub:
- [ ] Vercel dashboard shows a new deployment triggered within 2 minutes
- [ ] Deployment completes with a green checkmark

Terminal: `git ls-files | grep .env`
- [ ] No output at all — no `.env` file is tracked by Git

Navigate to these placeholder routes and confirm each shows "Coming soon":
- [ ] `/navigator`
- [ ] `/admin`
- [ ] `/dashboard/services`
- [ ] `/volunteer`
- [ ] `/pricing`

**Agent hallucination check:** Ask the agent to show you the output of `ls lib/interfaces/ | wc -l`. Confirm it says 8.

---

### Phase 2 — Supabase Connection

Navigate to `/test`:
- [ ] Text from the database appears — matches what you inserted in Supabase
- [ ] Not "undefined", "null", or a spinning loader

After the agent breaks the Supabase URL:
- [ ] A readable error message appears — not a stack trace or error code

After the agent restores it and deletes the test page:
- [ ] The homepage at `/` still loads correctly

---

### Phase 3 — Database Schema

Open Supabase → Table Editor:
- [ ] You can see more than 15 tables in the left sidebar
- [ ] Clicking `members` shows columns including `full_name`, `preferred_name`, `plan_tier`, `status`
- [ ] Clicking `realtime_notifications` shows columns including `type`, `title`, `body`, `severity`, `read`

Supabase → Authentication → Policies:
- [ ] All tables show "RLS enabled" — none show "disabled"

Supabase → Database → Replication:
- [ ] `realtime_notifications` is listed with INSERT events enabled

---

### Phase 4 — RLS Verification

Agent runs the cross-user test script and shows you the terminal output:
- [ ] Output contains "Cross-user isolation: PASSED"
- [ ] Output contains "Own data access: PASSED"
- [ ] Output contains "Service role reads all: PASSED"
- [ ] Output does NOT contain "FAILED" anywhere
- [ ] Output says "All test data cleaned up"

Supabase → `members` table — confirm no test rows remain:
- [ ] No rows with test email addresses like `user-a@test.com`

---

## M2 — Member Data

### Phase 5 — Authentication

Navigate to `/signup`, fill in test details, submit:
- [ ] Redirected to `/onboarding` — no error message

Supabase → Authentication → Users:
- [ ] Your test email appears

Supabase → `family_members` table:
- [ ] A row exists with your email and `role = 'family'`

Log out, type `/dashboard` in the address bar:
- [ ] Immediately redirected to `/login` — dashboard content never visible

Log out, type `/navigator` in the address bar:
- [ ] Immediately redirected to `/login`

**Stress test:** Sign up with an email that already exists.
- [ ] Clear error message — not a crash

**Agent hallucination check:** Ask the agent to show you the signup rollback test result. If it says "I skipped that test because it seemed straightforward," that is not acceptable — ask it to run the test explicitly and show you the output.

---

### Phase 6 — Member Onboarding Form

Navigate to `/onboarding`:
- [ ] Progress bar shows "Step 1 of 3"
- [ ] All field labels visible above the fields (not as placeholder text inside)
- [ ] "Next" button is large

Click "Next" with all fields empty:
- [ ] Error messages appear below required fields — form does NOT advance

Enter today's date as date of birth:
- [ ] Error — must be at least 60 years old

Enter `abc-xyz-123` as phone:
- [ ] Error — invalid format with example

Complete all 3 steps and submit:
- [ ] Confirmation page shows correct preferred name — not "undefined"

Supabase → `members`:
- [ ] New row with `plan_tier = 'basics'`

Partially fill Step 2, refresh browser:
- [ ] Your data is still there

On your actual phone at 375px:
- [ ] No horizontal scrolling, all buttons tappable

---

### Phase 7 — App Data Layer & Seed Data

Agent runs seed script and shows terminal output:
- [ ] `Login: test-family@thriveathome.dev / TestPassword123!` is printed
- [ ] No red error lines

Log in with the seeded credentials:
- [ ] Login works

Supabase → `check_in_calls`:
- [ ] 14 rows linked to Margaret Chen

Agent runs seed script a second time:
- [ ] No errors; same row count (no duplicates)

---

## M3 — UI System

### Phase 8 — Primitive UI Components

Navigate to `/test-ui` (the agent will tell you when it's live):
- [ ] Buttons in 4 styles: dark navy, teal outlined, red, ghost/subtle
- [ ] Cards with different border accents: default, teal, amber, red
- [ ] Mood emojis: 😊 for high, 😐 for middle, 😔 for low, — for no score
- [ ] Coloured dots: green, amber, red
- [ ] Bell icon with "0" count
- [ ] A progress bar is visible

Tab through page using only the keyboard:
- [ ] Every button reachable
- [ ] Focus ring always visible (a visible outline around the focused element)

Open the Modal:
- [ ] Tab key stays inside the Modal
- [ ] Pressing Escape closes it
- [ ] Focus returns to whatever opened the Modal

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime

**This is the most important test in M1–M6.**

Log in as `test-family@thriveathome.dev`. Open `/dashboard`. Watch it carefully.

The agent inserts a test notification via Supabase SQL Editor:
- [ ] Within 2 seconds, a toast notification appears in the corner — WITHOUT refreshing the page
- [ ] The bell icon count shows "1"

Click the bell:
- [ ] Dropdown shows the notification
- [ ] "Mark read" button visible

Click "Mark read":
- [ ] Bell count returns to "0"

The agent inserts a notification for a DIFFERENT member:
- [ ] You do NOT see it — only your own member's notifications appear

**Stress test:** Close your laptop lid for 30 seconds (simulates network disconnect), reopen, insert a new notification. Does it still appear?
- [ ] Realtime reconnects and the notification appears (may take 5–10 seconds)

---

## M5 — Alert Engine

### Phase 10 — Alert Logic

Agent runs test script and shows output:
- [ ] "All alert rule tests passed" appears
- [ ] Deduplication confirmed — only 1 alert row for same type in 24h

While the dashboard is open, the agent creates a test alert:
- [ ] Alert card appears in Alerts Panel within 2 seconds — no page refresh
- [ ] StatusDot colour changes

### Phase 11 — Crisis Detection

Agent runs crisis detection tests and shows output:
- [ ] All 5 escalation steps confirmed in the output
- [ ] "fell asleep watching TV" → no crisis fires (no false positive)

**Take a moment here.** This feature protects real seniors. If a real person said something concerning during a call, does the output show it would escalate? Ask the agent to walk you through what would actually happen in M8 when real calls are connected.

---

## M6 — Family Dashboard

### Phase 12 — Dashboard Shell

Log in as `test-family@thriveathome.dev`. Navigate to `/dashboard`:
- [ ] Loads within 3 seconds
- [ ] "Margaret Chen" or her preferred name visible in header
- [ ] Today's Wellness Card shows a mood emoji, scores, and summary text
- [ ] Health timeline has 4 tabs — each renders when clicked
- [ ] Bell icon in header

While dashboard is open, agent inserts a test alert:
- [ ] Alert card appears in Alerts Panel within 2 seconds — no page refresh
- [ ] StatusDot changes colour

Agent breaks Supabase URL, reload:
- [ ] Friendly error message visible — no raw error code

On your actual phone at 375px:
- [ ] No horizontal scroll, text readable, buttons tappable

**Stress test:** Open the dashboard with the timeline tab showing all 4 states (red/amber/green) by adjusting seed data mood scores. Confirm the chart colours match the scores.

---

### Phase 13 — Call History

Navigate to `/dashboard/calls`:
- [ ] Calls listed newest-first
- [ ] Each row shows date, emoji, medication status
- [ ] Alert flags shown in plain English — not "pain_high" or "no_eating"

Click a call row:
- [ ] Full AI summary text appears
- [ ] Flags use human-readable descriptions

With 25+ calls, scroll to bottom and click "Load more":
- [ ] More calls appear — page does NOT reload

---

### Phase 14 — Family Coordination Tools

Two browser windows. User A creates a task:
- [ ] Task appears for User B within 2 seconds — no page refresh

User A sends a message:
- [ ] Message appears for User B within 2 seconds

Navigate to `/dashboard/documents`:
- [ ] Upload a PDF — it appears in the list

Click "Download":
- [ ] File downloads

Try to upload a large file (> 10MB):
- [ ] Clear error message — upload does not proceed

Agent sets `last_login_at` to 8 days ago and triggers the nudge function:
- [ ] Terminal shows a `family_nudge` notification was inserted

Agent triggers nudge again immediately:
- [ ] Terminal shows the nudge was skipped (one per 7 days)

---

## V1 Final Gate

Read every item below before replying APPROVED.

**Technical:**
- [ ] Agent shows `npx tsc --noEmit` → zero errors
- [ ] Agent shows `git ls-files | grep .env` → no output
- [ ] Agent shows axe-cli runs → zero violations on dashboard, onboarding, and login
- [ ] All 19 placeholder routes still return "Coming soon" — none accidentally broken

**Core features working:**
- [ ] Sign up → enrol Margaret Chen → dashboard loads with her data
- [ ] New alert appears on dashboard within 2 seconds without refreshing
- [ ] Family task appears for all linked family members without refresh
- [ ] Document upload and download work
- [ ] Crisis detection: agent shows 5 escalation steps logged in stub mode

**Mobile:**
- [ ] Viewed dashboard on a real phone — no horizontal scroll, all text readable

**What V1 is:** A fully functional product for families to stay connected with their senior — using stub implementations for any paid external service. Every alert fires, every notification is instant, and the dashboard is complete.

**What comes next:** M7–M12 are Add-Ons that layer real AI calls, SMS, email, and billing on top. Each Add-On requires only two file changes to activate — the real implementation file and `providers.ts`.

When every item above is ✅ → reply **APPROVED** and V1 is complete.
