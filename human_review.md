# Thrive@Home — Human Review Checklist (v3.0)

> **This file is for you, the founder. The AI cannot do these checks.**
> When the AI presents a phase review, find the phase here and work through every item.
> Mark ✅ (looks right) or ❌ (something wrong). Reply APPROVED only when everything is ✅.
> If any item is ❌, reply: **ISSUE: [describe exactly what you saw]**

---

## How to use this file

1. Wait for: `✅ PHASE [N] — [NAME] — COMPLETE, AWAITING YOUR APPROVAL`
2. Find Phase N in this file
3. Work through every checklist item yourself — do not skip
4. All ✅ → reply **APPROVED**
5. Any ❌ → reply **ISSUE: [what you saw and what you expected]**

---

## M1 — Foundation

### Phase 1 — Project Scaffold

Open Vercel deployment URL in browser:
- [ ] "Thrive@Home" appears in large dark navy text
- [ ] Tagline appears below in teal
- [ ] DevTools → Console → zero red errors
- [ ] Background is warm off-white

Make a change, commit, push to main:
- [ ] Vercel shows new deployment triggered within 2 minutes
- [ ] Deployment succeeds (green checkmark)

Open `.env.local.example` in Codespace:
- [ ] File contains more than 30 lines
- [ ] Every value is blank — no actual credentials anywhere in this file

### Phase 2 — Supabase Connection
Navigate to `/test`:
- [ ] A message from the database appears — matches what you typed in Supabase
- [ ] Not "undefined", "null", or a spinner

After AI removes test page: navigate to `/`:
- [ ] Homepage still loads correctly

### Phase 3 — Database Schema
Supabase → Table Editor:
- [ ] You can see all the tables listed (more than 40 of them)
- [ ] Clicking `members` shows columns including full_name, preferred_name, plan_tier, status
- [ ] Clicking `realtime_notifications` shows columns: type, title, body, severity, read

Supabase → Database → Replication:
- [ ] `realtime_notifications` is listed with INSERT enabled

### Phase 4 — Row Level Security
Supabase → Authentication → Policies:
- [ ] ALL tables show "RLS enabled"
- [ ] Each table has at least one policy

AI shows cross-user test output:
- [ ] Output says "Cross-user query: BLOCKED ✓"
- [ ] Output says "Own data query: ACCESSIBLE ✓"
- [ ] Output does NOT say "EXPOSED"

---

## M2 — Member Data

### Phase 5 — Authentication
Navigate to `/signup`, fill in test details, submit:
- [ ] Redirected to `/dashboard`
- [ ] No error messages

Log out, type `/dashboard` in URL bar:
- [ ] Immediately redirected to `/login` — dashboard content never visible

### Phase 6 — Member Onboarding Form
Navigate to `/onboarding`:
- [ ] Progress bar at top showing "Step 1 of 3"
- [ ] Step 1: name, preferred name, DOB, phone, language, address
- [ ] "Next" button is large

Click "Next" with all fields empty:
- [ ] Error messages appear on required fields
- [ ] Does NOT advance to Step 2

Complete all 3 steps. Confirmation page:
- [ ] "Welcome to the Thrive@Home family, [name you entered]!"
- [ ] The correct preferred name — not "undefined"

Supabase → `members` table:
- [ ] New row with `plan_tier = basics` (not null, not empty)

### Phase 7 — App Data Layer & Seed Data
AI runs seed script and shows terminal output:
- [ ] "Seed complete. Login: test-family@thriveathome.dev / TestPassword123!"
- [ ] No red error lines

Log in with seeded credentials:
- [ ] Login works

---

## M3 — UI System

### Phase 8 — Primitive UI Components
Navigate to `/test-ui`:
- [ ] Buttons in different styles: navy, teal-outlined, red, ghost
- [ ] Cards with different border colours: default, teal, amber, red
- [ ] Mood emojis: 😊 for high scores, 😔 for low, — for null
- [ ] Coloured dots: green/amber/red for status
- [ ] Bell icon with "0" count badge
- [ ] Progress bar visible

Tab through page using only keyboard:
- [ ] You can reach every button by tabbing
- [ ] You can always see which element is focused (visible outline)

---

## M4 — Realtime Notifications

### Phase 9 — Supabase Realtime

**This is the most important Layer 1 test.**

Open the family dashboard in one browser tab. The AI inserts a test notification via SQL Editor.

**Test 1: Does it appear instantly?**
- [ ] Within 2 seconds, a toast notification appears in the corner — WITHOUT refreshing the page
- [ ] Bell icon count increments to "1"

**Test 2: Does the bell dropdown work?**
Click the bell:
- [ ] Dropdown opens showing the notification
- [ ] "Mark read" button visible

Click "Mark read":
- [ ] Bell count returns to "0"

**Test 3: Is it private?**
AI inserts a notification for a DIFFERENT member:
- [ ] You do NOT see the other member's notification

---

## M5 — Alert Engine

### Phase 10 — Alert Logic

AI runs alert tests and shows output:
- [ ] "Crisis flag → emergency severity: PASSED"
- [ ] "Deduplication: PASSED — only 1 alert created"
- [ ] "Flat scores → no drift alert: PASSED"

While dashboard is open, AI creates a test alert:
- [ ] Alert card appears in Alerts Panel within 2 seconds — no page refresh
- [ ] StatusDot in header changes colour

### Phase 11 — Crisis Detection
AI sends crisis transcript and shows results:
- [ ] Output shows all 4 escalation steps logged (emergency_log, alert, navigator task, Realtime notification)
- [ ] Stub logs show what SMS and email would have been sent

AI sends "I don't want to be here — I'd rather be at the beach!" and shows disambiguation result:
- [ ] Output shows "Context determined NON-crisis — no escalation" (false positive prevented)

**Think carefully: If a real senior said something concerning, would this system catch it and get humans involved? If anything seems uncertain, tell the AI.**

---

## M6 — Family Dashboard

### Phase 12 — Family Dashboard

Log in as seeded family member. Navigate to `/dashboard`:
- [ ] Dashboard loads within 3 seconds
- [ ] Margaret Chen's name appears in header (not "undefined")
- [ ] StatusDot visible (green — no urgent alerts by default)
- [ ] Bell icon visible in header
- [ ] Today's Wellness Card shows: emoji, scores, a summary paragraph
- [ ] 7-Day Mood Trend: a line chart with coloured dots
- [ ] Health Timeline: tabs for 7-day, 30-day, 60-day, 90-day — each renders

While dashboard is open, AI inserts an alert:
- [ ] Alert card appears within 2 seconds — no page refresh
- [ ] StatusDot changes colour

Break Supabase connection, reload:
- [ ] Friendly error message — no raw error code or stack trace

On real phone at 375px:
- [ ] All sections visible, no horizontal scroll
- [ ] All text readable without zooming

### Phase 13 — Call History
Navigate to `/dashboard/history`:
- [ ] Calls listed newest-first
- [ ] Each row shows date, emoji, medication status
- [ ] Flags show plain English (not "pain_high" — something like "Aria noticed some discomfort")

Click "View summary":
- [ ] Full AI summary appears
- [ ] Scores visible

### Phase 14 — Family Coordination Tools
Create a task in the family task board:
- [ ] Task appears for all family members linked to this senior in real time

Send a message in family messaging:
- [ ] Message appears for other linked family members instantly

Upload a document to document vault:
- [ ] File accessible when you navigate back to it

---

## M7 — Navigator Console

### Phase 15 — Navigator Console
Log in as navigator, navigate to `/navigator`:
- [ ] Only assigned members visible (not ALL members in the system)
- [ ] Members with alerts appear at TOP
- [ ] Search box filters list as you type

Acknowledge an alert card:
- [ ] Card disappears without page reload

Click a member row:
- [ ] Panel slides in from right
- [ ] Shows member name, age, plan tier, AI brief (stub text is fine), last 5 call summaries

Save a navigator note:
- [ ] "Saving..." → "Saved ✓" → note persists after closing and reopening panel

Press Escape:
- [ ] Panel closes, focus returns to the member row

As family role, type `/navigator` in URL bar:
- [ ] Immediately redirected to `/dashboard`

### Phase 16 — Digest Scheduling
AI triggers the weekly digest cron and shows terminal output:
- [ ] Terminal shows stub email would be sent for each active member
- [ ] No red errors
- [ ] Cron rejected without CRON_SECRET (shows 401 in terminal)

---

## M8 — AI Calls

### Phase 17 — Anthropic AI Provider
AI runs extraction tests and shows output:
- [ ] "Fell asleep: NO fall flag — PASSED"
- [ ] "Pain 3/10: NO pain_high flag — PASSED"
- [ ] "Topic not discussed: null (not 0) — PASSED"

AI generates a real Claude summary and shows it to you:
- [ ] Sounds like a caring friend wrote it, not a medical form
- [ ] No numbers or scores mentioned
- [ ] No clinical words (patient, vitals, symptoms, assessment, diagnosis)
- [ ] 3–5 sentences

### Phase 18 — Retell AI Agent Setup
Open Retell AI dashboard:
- [ ] Agent named "Aria — Thrive@Home Daily Check-In" exists
- [ ] Female voice selected — press preview button, confirm warm tone (not robotic)

AI calls your phone with the Margaret prompt:
- [ ] Your phone rings within 15 seconds
- [ ] Aria says "Margaret" by name
- [ ] Aria mentions gardening or books naturally
- [ ] Conversation feels like talking to a person, not answering a survey

Say "I've been feeling really hopeless lately":
- [ ] Aria responds with warmth and empathy
- [ ] Aria says someone will be in touch
- [ ] Aria does NOT immediately end the call

### Phase 19 — Call Infrastructure

AI triggers cron. Your phone rings:
- [ ] Phone rings within 2 minutes of cron trigger
- [ ] Aria answers and conducts check-in

Supabase → `check_in_calls`:
- [ ] Row exists with `status = scheduled`, then updates to `completed`
- [ ] `ai_summary` column has warm, readable text

AI triggers cron second time:
- [ ] Your phone does NOT ring again
- [ ] Terminal: "0 scheduled, 1 skipped"

After real call completes, check dashboard:
- [ ] "Call summary ready" notification appears without page refresh
- [ ] Dashboard wellness card updates with real call data

AI sends crisis test transcript. Check Supabase:
- [ ] `emergency_log` row with triggering phrase
- [ ] `emergency` severity alert in `alerts`
- [ ] `critical` priority task in `navigator_tasks`
- [ ] Realtime notification with emergency severity visible on dashboard

---

## M9 — Concierge Line

### Phase 20 — 24/7 Concierge Line
Call the concierge number (AI will tell you what it is):
- [ ] Rings within 15 seconds
- [ ] Warm greeting — "How can I help you today?" (not "Welcome to Thrive@Home check-in")
- [ ] Back-and-forth conversation works

Say "I need a ride to the doctor tomorrow":
- [ ] AI shows terminal: "[StubTransport] Would book ride..." logged
- [ ] Supabase `service_bookings` row created

Say "I just want to talk to someone":
- [ ] AI shows volunteer match request was created

Say "I need to speak with a real person":
- [ ] Call transfers to your own phone number (on-call navigator) within 2 minutes

---

## M10 — Outbound Notifications

### Phase 21 — Twilio SMS
Complete a test call. Check your phone (as linked family member):
- [ ] SMS arrives within 5 minutes
- [ ] Starts with "Thrive@Home update for [Name] 💚"
- [ ] Includes mood emoji, score, medication status
- [ ] Ends with "Reply STOP to unsubscribe"
- [ ] Message is complete — not cut off

Emergency alert SMS:
- [ ] Arrives within 60 seconds
- [ ] Contains urgent indicator (🚨 or similar)
- [ ] Arrived even though `sms: false` is set on that family member

### Phase 22 — SendGrid Email
Check your inbox after test call:
- [ ] Email arrives within 30 minutes
- [ ] Subject has senior's name and emoji
- [ ] Navy header visible
- [ ] Score bars visible (coloured HTML bars — not broken tags)
- [ ] AI summary readable
- [ ] "View Full Dashboard" button visible
- [ ] Unsubscribe link in footer

Open on real phone:
- [ ] Nothing cut off, text readable, button tappable

Open in Gmail specifically:
- [ ] Score bars render as coloured bars

### Phase 23 — Full Pipeline
Check Supabase → `notification_log` after a complete call:
- [ ] 3 rows: `channel = realtime` (sent), `channel = sms` (sent), `channel = email` (sent)
- [ ] All 3 show `status = sent` (not `stub`)

---

## M11 — Billing

### Phase 24 — Pricing Page & Stripe Setup
Navigate to `/pricing`:
- [ ] Four plan cards: Basics $19, Connect $39, Complete $69, Premier $129
- [ ] Each card has feature list
- [ ] "No contracts" note visible

Stripe dashboard → Products:
- [ ] Four products with correct prices

Stripe dashboard → Webhooks:
- [ ] Endpoint registered, Enabled, 5 events

### Phase 25 — Plan Selection & Checkout
Complete onboarding:
- [ ] Step 4 (plan selection) now appears after Step 3
- [ ] Plan cards shown with prices

After payment with test card 4242 4242 4242 4242:
- [ ] Redirected back to your app
- [ ] "Welcome to Thrive@Home! 🎉" banner visible
- [ ] Supabase `subscriptions` row: `status = active`
- [ ] Stripe dashboard shows Customer and Subscription

### Phase 26 — Billing Management
Navigate to `/dashboard/billing`:
- [ ] Current plan name shown
- [ ] Next billing date shown
- [ ] Three buttons visible (Change plan, Update payment, Cancel)
- [ ] Click "Change plan" → Stripe Customer Portal opens

---

## M12 — Compliance

### Phase 27 — HIPAA Baseline
Access `http://` version of your app:
- [ ] Automatically redirected to `https://`

Navigate to `/privacy`:
- [ ] Page loads with readable privacy policy
- [ ] Mentions data collection, retention, sharing, and deletion rights

AI confirms all 5 BAAs are signed:
- [ ] Supabase BAA signed and stored
- [ ] Twilio BAA signed and stored
- [ ] Retell AI BAA signed and stored
- [ ] Anthropic BAA signed and stored
- [ ] SendGrid BAA signed and stored

### Phase 28 — Accessibility & 65+ Usability
AI runs axe-cli scans and shows output:
- [ ] Output shows "violations: 0" for every page scanned
- [ ] No exceptions — zero is the requirement

Tab through entire onboarding flow (no mouse):
- [ ] You can complete the whole form using only Tab, Enter, Space
- [ ] Focus is always visible

**The 65+ test — mandatory, cannot be skipped:**

Find a real person aged 65 or older. Give them the URL and say "Please try to add a family member to this service — I won't help you." Watch silently.

- [ ] They signed up without help
- [ ] They completed onboarding without help
- [ ] They understood what the dashboard was showing them
- [ ] They did not need to zoom in to read anything
- [ ] Total time under 10 minutes

Document every moment of confusion. Fix all before marking complete.

---

## M13 — Volunteer Network

### Phase 29 — Volunteer Application
Navigate to `/volunteer/apply`:
- [ ] Form loads with warm, mission-driven tone
- [ ] All fields clearly labelled

Submit application. Check your email (as admin):
- [ ] Notification email arrives
- [ ] Admin `/admin/volunteers` page shows pending application

### Phase 30 — Background Checks
After admin approval:
- [ ] AI shows Checkr API call was made (test mode output in terminal)
- [ ] Volunteer status changes to `background_check`

### Phase 31 — Volunteer Matching
AI shows matching scores for test members and volunteers:
- [ ] Volunteer with shared interests and same city scores highest
- [ ] Introduction email shows first names + shared interest(s) — no phone numbers or emails

### Phase 32 — Volunteer Portal
Log in as a test volunteer:
- [ ] Only matched members visible (not all seniors)
- [ ] Log a visit → visit row appears in Supabase
- [ ] Impact stats update (hours increment)

### Phase 33 — Student Network
Download generated service record PDF:
- [ ] Student name, university name, visit dates, hours, total shown
- [ ] Looks official (not a raw HTML dump)

### Phase 34 — Youth in Schools
Log in as school admin:
- [ ] Student group visible
- [ ] Activities logged
- [ ] No direct contact info visible to either youth or senior

### Phase 35 — Veteran Network
Log in as VSO coordinator (read-only view):
- [ ] Can see their volunteers' activity
- [ ] Cannot see other organisations' volunteers

### Phase 36 — All Volunteer Networks
Log in as each volunteer type (retired professional, faith, corporate):
- [ ] Each sees a role-appropriate view
- [ ] Training library accessible
- [ ] Badge appears at correct hour milestone

---

## M14 — Community Layer

### Phase 37 — Virtual Events
Navigate to `/dashboard/events`:
- [ ] Calendar and list view both render
- [ ] RSVP to an event → dial-in details appear for you
- [ ] Dial-in details NOT visible to a non-RSVPed user

After AI sends the post-event SMS and you reply YES:
- [ ] Supabase `event_rsvps.attended = true` for your row

### Phase 38 — Local Events & Transport
Book a local event with transport:
- [ ] Both a `local_event_rsvp` AND a `transport_booking` row created in Supabase

### Phase 39 — Interest Groups
Create an interest group:
- [ ] Group appears in directory
- [ ] Members can join
- [ ] AI-generated weekly discussion prompt appears on group page

### Phase 40 — Skill Exchange
Complete an exchange between two test members:
- [ ] Teacher balance: 0 → 1
- [ ] Learner balance: 0 → -1
- [ ] Transaction rows visible in Supabase

AI injects a failure mid-transaction:
- [ ] Neither balance changed (atomicity confirmed)

### Phase 41 — Cultural Circles
Navigate to `/dashboard/cultural-circles`:
- [ ] 12 circle cards visible
- [ ] Join a circle → membership count increments
- [ ] Post a message → appears in feed
- [ ] RSVP to a circle event → dial-in details appear
- [ ] Leave circle → removed from list

### Phase 42 — Language Access
Set your member's language to Spanish. Navigate through onboarding, dashboard, billing:
- [ ] All UI text in Spanish
- [ ] No raw translation keys visible (no "t('dashboard.title')" visible on screen)

If you have a Spanish-speaking contact: have them review the grief support page in Spanish:
- [ ] They confirm it sounds natural and professional (not machine-translated)

### Phase 43 — Benefits Finder
Answer questionnaire as low-income California veteran:
- [ ] VA Aid & Attendance and 3+ other benefits appear
- [ ] Every result card says WHY you qualify (specific reason from your answers)

Answer as non-veteran, high income:
- [ ] VA Aid & Attendance does NOT appear

### Phase 44 — Employer Portal
Submit demo request:
- [ ] `employer_leads` row in Supabase
- [ ] Sales team email arrives

Send employee invitation, accept as test employee:
- [ ] Employee linked to employer account in Supabase

---

## M15 — Celebrations & Life Stories

### Phase 45 — Celebrations Engine
AI sets test member's birthday to 7 days away and triggers cron:
- [ ] A family notification email arrives
- [ ] The email contains gift suggestions specific to Margaret's interests — not generic ("flowers and chocolates")
- [ ] Suggestions feel personalised (reference gardening, books, or other interests)

Set DOB to today, trigger cron:
- [ ] "call_summary_ready" check-in prompt is modified (Aria acknowledges birthday)
- [ ] Community post created

### Phase 46 — Life Story Archive
Navigate to `/dashboard/life-story`:
- [ ] You can add a written entry
- [ ] You can upload a voice memo
- [ ] Entry marked as public appears in the cultural circle feed

---

## M16 — Grief & Life Transitions

### Phase 47 — Physical Goods
AI triggers a milestone birthday D-0:
- [ ] Terminal shows stub log of birthday card order (AI shows you the output)
- [ ] Goods order logged — not actually sent until real provider is configured

### Phase 48 — Grief Support
Navigate to `/dashboard/grief-support`:
- [ ] Page tone is warm and human — not clinical
- [ ] "You don't have to face this alone" sentiment is prominent
- [ ] 4 category cards visible

Submit a grief support request. Check your email (care team):
- [ ] Email arrives within 2 minutes
- [ ] Subject clearly identifies the member and type of support
- [ ] Tone is urgent but calm

Check Supabase → `members`:
- [ ] `check_in_frequency` updated to `daily` for that member

**After the AI sets up the holiday sensitivity test:** Confirm that no celebratory nudges appear for a member with a recent loss near significant dates.

### Phase 49 — Life Transition Pathways
AI creates a nursing home transition record:
- [ ] Navigator task appears in the navigator console
- [ ] Community farewell event option appears on the member's dashboard

---

## M17 — Services Marketplace

### Phase 50 — Marketplace Foundation
Navigate to `/dashboard/services`:
- [ ] 6 service category cards visible: Transport, Home Services, Health Services, Legal & Financial, Meals & Nutrition, Tech Help
- [ ] Each card links to its own page
- [ ] "Request help" creates a booking row (AI shows Supabase evidence)

### Phase 51 — Transportation
Request a transport booking:
- [ ] Terminal shows "[StubTransport] Would book ride..." logged
- [ ] `transport_bookings` row in Supabase

Request a volunteer-driver trip:
- [ ] Volunteer match request created in addition to booking row

Set up a recurring trip ("every Tuesday"):
- [ ] Multiple scheduled booking rows created (one per occurrence)

### Phase 52 — Home Services
Browse home service providers:
- [ ] Providers filtered by your zip code
- [ ] Only `is_vetted = true` providers shown

Request grocery delivery:
- [ ] Terminal shows stub log with correct dietary restrictions from member profile

### Phase 53 — Health Services
Initiate a telehealth session:
- [ ] `service_bookings` row with telehealth type
- [ ] Warm handoff note visible in navigator console (not just a link)

### Phase 54 — Legal & Financial Hub
Upload a document to document vault:
- [ ] File retrieves correctly
- [ ] Metadata visible in `document_vault_items`

Open advisor directory:
- [ ] Only vetted advisors listed

Fraud alert (weekly):
- [ ] Realtime notification arrives for active members on schedule

### Phase 55 — Meals & Nutrition
Order a meal:
- [ ] `service_bookings` row created with correct dietary preferences from member profile

Social dining event:
- [ ] Appears as a `local_events` entry with transport option

### Phase 56 — Tech Help Services
Call the tech helpline (AI gives you the number):
- [ ] Call is answered, transcribed, and logged in `check_in_calls`

Book an in-home tech help session:
- [ ] `service_bookings` row created

Tech safety event:
- [ ] Appears on events calendar with correct category

---

## M18 — Enterprise

### Phase 57 — Outcomes Dashboard
Navigate to `/admin/outcomes`:
- [ ] All charts render (not blank)
- [ ] Date range picker works

Download PDF report:
- [ ] PDF downloads
- [ ] Open it — readable, professional layout, no individual member data

### Phase 58 — AI Care Plan Generation
Navigate to `/dashboard/care-plan` for a member with 30+ days of data:
- [ ] Plan appears with multiple sections
- [ ] All sections are warm, non-clinical
- [ ] "Top Strengths" shows 3 positive items
- [ ] "Family Talking Points" shows conversation starters

Read the care plan as if it were about your parent:
- [ ] Nothing would cause unnecessary alarm
- [ ] Recommendations are specific, not generic

### Phase 59 — MA Reporting API
AI makes an authenticated API request and shows you the JSON response:
- [ ] Response contains aggregated numbers (no individual names or IDs)
- [ ] No individual member health data visible anywhere in the response

AI makes a request for a cohort of fewer than 10:
- [ ] Response shows a suppression message, not the data

### Phase 60 — University Portal
Download a student service record PDF:
- [ ] Student name, university name, visit dates, hours, total all correct
- [ ] Looks official — you would accept this as a service record

### Phase 61 — Full Multilingual Platform
Confirm with a native Spanish speaker (if you have one):
- [ ] The grief support page in Spanish reads naturally
- [ ] Health-related strings don't sound machine-translated
- [ ] They would trust it to communicate health information accurately

---

## Final Gate — Before Going Live with Real Members & Live Stripe Keys

Read every item below. Only mark APPROVED when ALL are confirmed:

- [ ] Every Phase 1–61 human review completed
- [ ] Test payment with card 4242 4242 4242 4242 succeeded
- [ ] All HIPAA BAAs signed and stored (all 5 vendors)
- [ ] axe-cli shows zero violations on all pages
- [ ] Real 65+ adult completed onboarding without assistance
- [ ] At least 10 test users through the complete call → Realtime → SMS → email flow
- [ ] Services marketplace stubs logged correctly for at least 1 request per category
- [ ] You personally understand what happens when a senior says something concerning on a call

**Only after all items above: switch Stripe keys from `sk_test_` to `sk_live_`. Real charges will be possible from that moment.**
