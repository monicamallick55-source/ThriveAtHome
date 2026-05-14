# Thrive@Home — Human Review Checklist

> **This file is for you, the founder. The AI cannot do these checks.**
> When the AI presents a phase review and asks for APPROVED or ISSUE, come to this file, find the phase, and work through every item yourself.
>
> You do not need to understand the code. You only need to look at what is on screen and compare it to what this document says you should see. If anything looks wrong or missing, reply: `ISSUE: [describe exactly what you saw]`

---

## How to use this file

1. The AI will present a phase review in this format:
   ```
   ✅ PHASE [N] — [NAME] — COMPLETE, AWAITING YOUR APPROVAL
   ```
2. Find Phase N in this file
3. Work through every checklist item — mark ✅ for looks right, ❌ for something wrong
4. If all items are ✅, reply: **APPROVED**
5. If any item is ❌, reply: **ISSUE: [describe exactly what you saw and what you expected]**

Do not skip items. Do not mark ✅ for something you did not personally verify.

---

## Layer 1 — Core Product

---

### Phase 1 — Project Scaffold

Open your Vercel deployment URL in a browser:
- [ ] The page loads — no error, no blank screen
- [ ] "Thrive@Home" appears in large dark navy text
- [ ] "Peace of mind for families. Independence for seniors." appears below in teal
- [ ] Right-click → Inspect → Console tab shows zero red errors
- [ ] The background is warm off-white (not bright white or grey)

Make a trivial change in the Codespace, commit, and push:
- [ ] Vercel shows a new deployment triggered within 2 minutes
- [ ] Deployment completes with a green checkmark

Open `.env.local.example` in the Codespace:
- [ ] The file contains more than 20 lines
- [ ] You can see section headings for Supabase, Retell AI, Twilio, Anthropic, Stripe, SendGrid
- [ ] Every value is blank (no actual credentials in this file)

---

### Phase 2 — Supabase Connection

Navigate to `/test` on your running app:
- [ ] A message from the database appears on screen (it should match what you typed in Supabase)
- [ ] The message is not "undefined", "null", or an error
- [ ] Page does not spin forever

After the AI removes the test page and table:
- [ ] The homepage at `/` still loads correctly

---

### Phase 3 — Database Schema

Open Supabase → Table Editor in your browser:
- [ ] You can see these tables in the left sidebar: `members`, `family_members`, `check_in_calls`, `alerts`, `care_navigators`, `navigator_assignments`, `navigator_tasks`, `navigator_notes`, `subscriptions`, `realtime_notifications`, `notification_log`, `emergency_log`, `medication_schedules`, `audit_log`
- [ ] Clicking `members` shows columns including: full_name, preferred_name, phone_number, plan_tier, status
- [ ] Clicking `check_in_calls` shows columns including: mood_score, energy_score, ai_summary, transcript, alert_flags
- [ ] Clicking `realtime_notifications` shows columns including: type, title, body, severity, read

Open Supabase → Database → Replication:
- [ ] `realtime_notifications` table is listed with INSERT events enabled

---

### Phase 4 — Row Level Security

Open Supabase → Authentication → Policies:
- [ ] ALL tables show "RLS enabled" — none show "disabled"
- [ ] Each table has at least one policy listed under it

When the AI runs the cross-account test, they will show you the terminal output. Look for:
- [ ] Output says something like "Cross-user members query: BLOCKED ✓"
- [ ] Output says something like "Own member query: ACCESSIBLE ✓"
- [ ] Output does NOT show the word "EXPOSED" anywhere

---

### Phase 5 — Authentication

Navigate to `/signup` on your running app:
- [ ] A sign-up form appears with fields for name, email, password, and relationship to senior
- [ ] All text is large and readable (not tiny)
- [ ] The form uses navy and teal colours

Fill in the form with test details and submit:
- [ ] You are redirected to `/dashboard`
- [ ] No error messages appear during sign-up

Open Supabase → Authentication → Users:
- [ ] Your test email appears in the list

Open Supabase → Table Editor → `family_members`:
- [ ] A row exists with your test email linked and `role = 'family'`

Log out (the AI will show you how). Type `/dashboard` directly in the URL bar:
- [ ] You are immediately redirected to `/login`
- [ ] You cannot see any dashboard content while logged out

---

### Phase 6 — Member Onboarding Form

Navigate to `/onboarding`:
- [ ] A form appears with a progress bar at the top showing "Step 1 of 3"
- [ ] Step 1 has fields for: name, preferred name, date of birth, phone number, language preference, and address
- [ ] All fields are large and clearly labelled
- [ ] The "Next" button is large and easy to click

Click "Next" without filling anything in:
- [ ] Error messages appear on each required field
- [ ] You do NOT advance to Step 2

Fill in valid data and complete all 3 steps. On completion:
- [ ] You are taken to a confirmation page
- [ ] The confirmation says "Welcome to the Thrive@Home family, [the name you entered]!"
- [ ] The correct preferred name appears — not "undefined"

Open Supabase → Table Editor → `members`:
- [ ] A new row exists with the data you entered
- [ ] The `plan_tier` column shows `basics` (not null — no plan selection step yet)

Partially fill the form and refresh the page:
- [ ] Your form data is still there after refresh

Open the form on your actual phone:
- [ ] All fields fit on screen without horizontal scrolling
- [ ] All buttons are easy to tap without zooming in

---

### Phase 7 — App Data Layer

The AI will run a test script and show you the output:
- [ ] Output ends with "✓ All data layer tests passed"
- [ ] No red error lines in the output

The AI will run `npx tsc --noEmit`:
- [ ] Output shows zero errors

---

### Phase 8 — Primitive UI Components

The AI will create a test page. Navigate to `/test-ui`:
- [ ] You can see buttons in different styles: navy-filled, teal-outlined, red, and ghost/subtle
- [ ] You can see cards with different border colours
- [ ] You can see small badge pills (for alert types, plan tiers)
- [ ] You can see emoji faces for different mood scores — happy face for high scores, sad for low
- [ ] You can see a coloured dot that is green for no alerts, amber for concern, red for urgent
- [ ] You can see a bell icon with a count badge showing "0"

Tab through the page using only the keyboard (Tab key):
- [ ] You can reach every button by tabbing
- [ ] You can always see which element is focused (visible outline or highlight)
- [ ] You can press Enter or Space to activate buttons

---

### Phase 9 — Supabase Realtime Notifications

This is the most important Layer 1 test. Open the family dashboard in one browser tab.

**Test 1: Do notifications appear instantly?**
The AI will insert a test alert in Supabase while you watch the dashboard tab.
- [ ] Within 2 seconds, a notification toast appears in the corner of the dashboard — WITHOUT refreshing the page
- [ ] The bell icon in the header shows a count of "1"

**Test 2: Does the notification bell work?**
Click the bell icon:
- [ ] A dropdown appears showing the notification
- [ ] A "Mark read" button is visible

Click "Mark read":
- [ ] The notification moves out of the unread list
- [ ] The bell count goes back to 0

**Test 3: Are notifications private?**
The AI will insert a notification for a DIFFERENT member while you watch.
- [ ] You do NOT see the other member's notification

---

### Phase 10 — Alert Logic

The AI will run alert logic tests and show you the results:
- [ ] Output confirms: crisis flag → emergency severity alert created
- [ ] Output confirms: only 1 alert created when the same type fires twice (deduplication working)
- [ ] Output confirms: flat mood scores do NOT trigger a drift alert

Open the family dashboard while the AI creates a test alert:
- [ ] The alert appears in the Alerts Panel within 2 seconds (Realtime working)
- [ ] The alert card has the correct colour — red for emergency, amber for urgent, softer for concern

---

### Phase 11 — Family Dashboard

Log in as a seeded test family member. Navigate to `/dashboard`:
- [ ] Dashboard loads within 3 seconds
- [ ] Senior's name appears in the header (not "undefined" or a loading spinner)
- [ ] A coloured dot appears — should be green if no active alerts
- [ ] "Today's Wellness" card shows a mood emoji, scores, and a summary paragraph
- [ ] A line chart shows mood scores over 7 days
- [ ] An Alerts panel shows either alert cards or "No concerns this week 🌟"
- [ ] The bell icon is visible in the header

While the dashboard is open, the AI will insert a test alert in Supabase:
- [ ] An alert card appears in the Alerts Panel within 2 seconds — no page refresh
- [ ] The coloured dot in the header changes colour to reflect the new alert

Temporarily break the connection (the AI will do this):
- [ ] A friendly message appears like "Unable to load your dashboard right now"
- [ ] No raw error code or technical message is visible to you

Open the dashboard on your actual phone:
- [ ] All sections fit on screen without horizontal scrolling
- [ ] All text is readable without pinch-zooming

---

### Phase 12 — Navigator Console

Log in as a navigator role user and navigate to `/navigator`:
- [ ] A table of member names appears — ONLY members assigned to this navigator
- [ ] Members with alerts appear at the TOP of the table (most urgent first)
- [ ] Typing in the search box filters the list as you type

If there are any unacknowledged urgent or emergency alerts, alert cards appear above the table:
- [ ] Each card shows the member name and a plain-English description of the alert
- [ ] Clicking "Acknowledge" removes the card immediately (no page reload)

Click a member row:
- [ ] A panel slides in from the right side of the screen
- [ ] The panel shows the member's preferred name, age, plan tier
- [ ] At least 5 past call summaries are listed
- [ ] A "Navigator notes" text area is present

Type a note in the text area and click save:
- [ ] "Saving..." appears briefly
- [ ] "Saved ✓" appears and fades after 2 seconds
- [ ] Close the panel and click the same member row — your note is still there

Press Escape with the panel open:
- [ ] The panel closes

Log in as a family role user and type `/navigator` in the URL bar:
- [ ] Immediately redirected to `/dashboard`

---

### Layer 1 Gate Review

Before replying APPROVED to the Layer 1 gate, confirm all of the following:

- [ ] Every Phase 1–12 human review above was completed and passed
- [ ] The Realtime test (Phase 9) worked — notification appeared without page refresh
- [ ] At least one test member is enrolled in Supabase
- [ ] The navigator console only shows members assigned to that navigator (RLS working)
- [ ] The app looks like a product — not a rough prototype

---

## Layer 2 — AI & Calls

---

### Phase 13 — Anthropic AI Provider

The AI will run score extraction tests and show you the output. Look for:
- [ ] Output shows no false positives — "fell asleep" did NOT trigger a fall flag
- [ ] Output shows pain score 3/10 did NOT trigger high pain flag
- [ ] Output shows undiscussed topic returned `null` not `0`
- [ ] All test assertions show ✓ or PASS

The AI will generate a real Claude summary from a test transcript and show it to you. Read it:
- [ ] The summary sounds like a caring friend wrote it, not a medical form
- [ ] No numbers or scores mentioned in the summary
- [ ] No words like "patient", "vitals", "symptoms", "assessment" appear

---

### Phase 14 — Retell AI Agent Setup

The AI will walk you through creating Aria in the Retell AI dashboard. After creation:

Open Retell AI → your agent settings:
- [ ] Agent name is "Aria — Thrive@Home Daily Check-In"
- [ ] A female voice is selected — press the preview button to confirm it sounds warm, not robotic

Use Retell AI's "Test Call" button. It will call your phone:
- [ ] Your phone rings within 15 seconds
- [ ] The voice sounds warm and natural — not robotic, not a call-centre tone
- [ ] Aria says "Aria from Thrive@Home" in her introduction

The AI will update the agent with a test prompt for "Margaret who likes Gardening and Books" and call your phone:
- [ ] Aria says "Margaret" at some point
- [ ] Aria mentions gardening or books naturally (not robotically)
- [ ] The conversation feels like talking to a person, not answering a survey

Say to Aria during the call: "I've been feeling really hopeless lately and don't see the point of anything."
- [ ] Aria responds with warmth and empathy (not a robotic "I understand")
- [ ] Aria says someone from the team will be in touch
- [ ] Aria does NOT immediately end the call or change the subject abruptly

---

### Phase 15 — Twilio & Retell Call Infrastructure

The AI will run a test call to your phone number:
- [ ] Your phone rings within 20 seconds of the AI running the script
- [ ] Aria answers (not silence or a Twilio error message)
- [ ] The AI shows you the call ID in the terminal output (a non-empty string)

Open Twilio Console → Monitor → Calls:
- [ ] The test call appears in the call log

Open Retell AI → Call History:
- [ ] The same call appears there too

---

### Phase 16 — Outbound Call Scheduler

The AI will trigger the cron endpoint manually:
- [ ] Your phone rings within 2 minutes
- [ ] The terminal shows "1 scheduled, 0 skipped, 0 failed"

Open Supabase → `check_in_calls`:
- [ ] A row exists with `status = 'scheduled'` and a Retell call ID in the `retell_call_id` column

The AI triggers the cron a second time:
- [ ] Your phone does NOT ring again
- [ ] Terminal shows "0 scheduled, 1 skipped"

---

### Phase 17 — Call Webhook & Transcript Processing

After a real call completes, check Supabase → `check_in_calls` for that call's row:
- [ ] `transcript` column contains the conversation text
- [ ] `status` shows `completed`
- [ ] `mood_score` has a number (not 0, not null if the topic was discussed)
- [ ] `ai_summary` contains a paragraph of warm, readable text

Read the `ai_summary`:
- [ ] Sounds like a caring friend wrote it
- [ ] Contains no numbers, scores, or clinical language

Check your family dashboard while a call is being processed:
- [ ] Within 30 seconds of the call ending, a "call summary ready" notification appears
- [ ] The dashboard updates with the new call data without you refreshing

After the AI sends a crisis test transcript, check Supabase:
- [ ] An alert with `severity = 'emergency'` appears in `alerts`
- [ ] A row appears in `emergency_log` with the triggering phrase
- [ ] A critical priority task appears in `navigator_tasks`

---

## Layer 3 — Outbound Notifications

---

### Phase 18 — Twilio SMS Provider

After a test call, check your phone (as the linked family member):
- [ ] An SMS arrives within 5 minutes of the call ending
- [ ] The SMS starts with "Thrive@Home update for [Senior Name] 💚"
- [ ] The SMS includes a mood emoji, a score, and medication status
- [ ] The SMS ends with "Reply STOP to unsubscribe"
- [ ] The message is complete — not cut off mid-sentence

After the AI manually triggers an emergency alert, check your phone:
- [ ] An SMS arrives within 60 seconds
- [ ] The SMS contains "🚨" or a clear urgent indicator
- [ ] The tone is alarming — this should get your attention immediately

---

### Phase 19 — SendGrid Email Provider

After a test call, check your email inbox:
- [ ] An email arrives within 30 minutes
- [ ] The subject line contains the senior's name and a mood emoji
- [ ] Open the email: a navy header shows the senior's name
- [ ] Coloured score bars are visible for mood, energy, and comfort
- [ ] The AI summary paragraph is readable
- [ ] A "View Full Dashboard" button is visible in navy
- [ ] The footer has an unsubscribe link

Open the email on your actual phone:
- [ ] Nothing is cut off at the edges
- [ ] Text is readable without zooming
- [ ] The CTA button is large enough to tap with your thumb

Open the email in Gmail specifically (not another email client):
- [ ] The score bars render as coloured bars — not broken HTML
- [ ] All sections display correctly

---

### Phase 20 — Post-Call Notification Pipeline

After a full real call, check that the complete sequence fired:

Dashboard:
- [ ] Realtime notification appeared within 30 seconds of call ending

Phone:
- [ ] SMS arrived within 5 minutes

Email:
- [ ] Email arrived within 30 minutes

Open Supabase → `notification_log`:
- [ ] Three rows exist for this call — one each for `realtime`, `sms`, `email`
- [ ] All three show `status = 'sent'`

After the AI triggers the crisis test again:
- [ ] SMS arrives from the on-call navigator number AND family number within 60 seconds
- [ ] The Realtime notification on the dashboard shows `emergency` severity (red)

---

### Phase 21 — Medication Reminders

After the AI sets a test reminder 2 minutes from now and triggers the cron:
- [ ] Your phone receives an SMS within 3 minutes
- [ ] SMS says something about taking medications and includes 💊

After the AI inserts 3 consecutive `medication_taken = false` calls:
- [ ] Check Supabase → `alerts` — a `medication_miss` concern alert exists
- [ ] Check Supabase → `navigator_tasks` — a task for the navigator exists

---

### Phase 22 — Wellness Drift (Fully Live)

After the AI inserts declining score data and runs the drift check:
- [ ] An SMS arrives on your phone about a wellness concern
- [ ] An email arrives about the wellness concern
- [ ] Both are logged in Supabase → `notification_log` with `status = 'sent'` (not `'stub'`)

This confirms SMS and email notifications are truly live — not just logging to the console anymore.

---

### Phase 23 — Call History Page

Navigate to `/dashboard/history`:
- [ ] A list of past calls appears, newest first
- [ ] Each row shows date, a mood emoji, and medication status
- [ ] The alert flags shown use plain English (e.g. "Aria noticed some discomfort" — not "pain_high")

Click "View summary" on any call:
- [ ] It expands to show the full AI summary and all scores

With 25+ calls, scroll to the bottom of the first 20:
- [ ] A "Load more" button appears
- [ ] Clicking it adds more calls without the page reloading

---

### Layer 3 Gate Review

Before replying APPROVED to the Layer 3 gate, confirm:
- [ ] Every Phase 18–23 human review above was completed and passed
- [ ] You personally received a real SMS on your phone from a real call
- [ ] You personally received a real email in your inbox from a real call
- [ ] The Realtime notification appeared within 30 seconds (no refresh required)
- [ ] Crisis escalation SMS arrived within 60 seconds during the crisis test

At this point, the product is fully functional. A senior can be enrolled and their family stays connected — completely automatically, with no manual effort.

---

## Layer 4 — Billing

---

### Phase 24 — Pricing Page (Static)

Navigate to `/pricing`:
- [ ] Four plan cards appear: Basics ($19/mo), Connect ($39/mo), Complete ($69/mo), Premier ($129/mo)
- [ ] Each card has a list of key features
- [ ] "Start with any plan. Upgrade anytime. No contracts." is visible
- [ ] "Get started" buttons are visible (they will be wired up in Phase 26)

---

### Phase 25 — Stripe Products & Config

Open Stripe Dashboard → Products:
- [ ] Four products appear: Thrive Basics, Thrive Connect, Thrive Complete, Thrive Premier
- [ ] Prices are exactly $19/mo, $39/mo, $69/mo, $129/mo

Open Stripe Dashboard → Webhooks:
- [ ] One webhook endpoint is registered pointing to your app URL
- [ ] Status shows "Enabled"

---

### Phase 26 — Plan Selection in Onboarding

Navigate to `/onboarding` and complete the form:
- [ ] Step 4 (plan selection) now appears after Step 3
- [ ] Four plan cards are shown
- [ ] Clicking a card highlights it with a border
- [ ] Clicking "Continue" eventually takes you to Stripe Checkout

Log in as a member enrolled before billing was added:
- [ ] A plan upgrade prompt appears on the dashboard
- [ ] The prompt links to the pricing page

---

### Phase 27 — Checkout Flow & Stripe Webhook

Click "Get started" on the Connect plan. Complete Stripe checkout using test card:
- Card number: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`
- Any name and zip code

- [ ] You are taken to a Stripe-hosted checkout page (the URL starts with stripe.com)
- [ ] "Thrive Connect" and "$39.00" are visible on the Stripe page
- [ ] After completing payment, you are redirected back to your dashboard
- [ ] A "Welcome to Thrive@Home! 🎉" banner appears on the dashboard

Open Stripe Dashboard → Customers:
- [ ] A customer with your test email appears

Open Stripe Dashboard → Subscriptions:
- [ ] A subscription at $39/mo appears with status "Active"

Open Supabase → `subscriptions` table:
- [ ] A row exists with `status = 'active'` and the correct plan tier

---

### Phase 28 — Billing Management Page

Navigate to `/dashboard/billing`:
- [ ] Your current plan name is shown ("Thrive Connect")
- [ ] The next billing date is shown (a future date)
- [ ] Three buttons are visible: "Change plan", "Update payment method", "Cancel subscription"
- [ ] Past invoices are listed with dates and amounts

Click "Change plan":
- [ ] You are taken to the Stripe Customer Portal
- [ ] The portal shows your current plan and options to change it

---

### Phase 29 — Accessibility & Compliance Audit

The AI will run an automated accessibility scan and show you the results:
- [ ] The output shows zero violations — the word "violations: 0" appears for every page scanned
- [ ] If any violations are shown, reply ISSUE immediately — do not accept any violations

Tab through the entire onboarding flow using only the keyboard:
- [ ] You can complete the whole form using Tab, Enter, and Space — no mouse needed
- [ ] You can always see which field is focused (highlighted outline or visible indicator)

**The 65+ test — this is mandatory and cannot be skipped:**

Find a real person aged 65 or older who has not seen the product before. Show them the signup URL and say: "I'd like you to add a family member to this service. I won't be able to help — just try your best."

Sit quietly and watch. Note every moment of confusion.
- [ ] They completed the signup form without help
- [ ] They completed the onboarding form (3 steps) without help
- [ ] They understood what the dashboard was showing them without explanation
- [ ] They did not need to zoom in to read anything
- [ ] Total time was under 10 minutes

Write down every moment of confusion and tell the AI. Every confusion point must be fixed before this phase is marked complete.

**HIPAA checklist** — confirm before the Layer 4 gate:
- [ ] Supabase BAA signed and stored
- [ ] Twilio BAA signed and stored
- [ ] Retell AI BAA signed and stored
- [ ] Anthropic BAA signed and stored
- [ ] SendGrid BAA signed and stored

---

### Layer 4 Gate Review — Before switching to live Stripe keys

This is the final gate. Read every item carefully before replying APPROVED.

- [ ] Every Phase 24–29 human review above was completed and passed
- [ ] Test payment with card 4242 4242 4242 4242 succeeded
- [ ] All Stripe webhook events handled correctly (Stripe CLI test passed)
- [ ] Zero accessibility violations on all pages
- [ ] Real person aged 65+ completed onboarding without assistance
- [ ] All 5 HIPAA BAAs are signed and stored
- [ ] You understand: after APPROVED, the AI will switch Stripe keys to LIVE mode and real charges will be possible

**Only reply APPROVED when you are ready to accept real payments.**

---

## Ongoing — For any new feature or phase added after Layer 4

When the AI builds additional features (volunteer portal, cultural circles, skill exchange, etc.), each will have a phase review. The general checklist for any new feature is:

- [ ] The feature works end-to-end in your browser — not just "the code compiled"
- [ ] Realtime notifications appear for relevant updates (new request, status change, etc.)
- [ ] The feature is fully usable on mobile at 375px width
- [ ] Text is readable and buttons are tappable without zooming
- [ ] Any new external service starts in stub mode and activates with its environment variable
- [ ] You can use the feature without the AI explaining how it works

If a feature requires a new external service (like Checkr for volunteer background checks), you will need to create that account and add its credentials — the AI will ask you for this at the right time.
