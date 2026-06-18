# ThriveAtHome — Advanced Features Build Prompt (v1.0)
# M13–M18: Volunteer Network, Cultural Circles, Services Marketplace, Grief Support, Celebrations, Enterprise

> **Read this entire file before writing a single line of code.**
> The agentic loop protocol from prompt.md Section 1 applies here exactly as before.
> One phase at a time. Human approval before every phase transition.
> BLOCKED after 3 failed hypotheses.
> All service interfaces and stubs from V1 are already in place.

---

## SCOPE AND BUILD ORDER

## STRATEGIC VISION

**ThriveAtHome is a consumer brand first.** Families trust ThriveAtHome. Partners use ThriveAtHome. The brand always belongs to ThriveAtHome.

### Brand Strategy
- **Own the consumer relationship end-to-end**
- **B2B partners amplify, never own** — agencies bring members TO ThriveAtHome, not away from it
- **White-label available but controlled** — always "Powered by ThriveAtHome"
- **Never white-label to direct competitors**

### Launch Sequence
1. Months 1–3: 20 real families in Bay Area, manually enrolled, charge $1 or free
2. Months 4–6: Charge real prices, $3K–$10K MRR, collect testimonials
3. Months 7–12: First employer pilot, senior center partnerships
4. Year 2: First employer contract, first Medicare Advantage conversation
5. Year 3: MA contract signed, 10+ employer clients

### B2B Model
Agencies use ThriveAtHome. Families trust ThriveAtHome. The brand always belongs to ThriveAtHome.

---

## THE THREE CORE ROLES

Every feature maps to one of three roles — maintain this distinction in all UI and copy:

| Role | Type | Purpose | Plans |
|------|------|---------|-------|
| **Aria** | AI | Daily structured check-ins, wellness data, alerts, celebrations | All plans |
| **Human Buddy** | Human relationship | Assigned person, regular calls/visits, remembers what matters, relationship-focused | Connect, Complete, Premier |
| **Navigator** | Human admin/care | Caseload management, crisis response, service dispatch | Complete + Premier (shared pool Basics/Connect urgent only) |

---

Build order is prioritised by consumer value first, then B2B enablement:

| Milestone | Phases | Delivers | Brand Impact |
|-----------|--------|---------|------|
| M13 — Volunteer Network | 29–33 | Application, matching, scheduling, student portal, VSO integration | Free (Checkr ~$30/check when volunteers join) |
| M14 — Community Features | 34–38 | Cultural circles, virtual events, skill exchange, interest groups, benefits finder | Free |
| M15 — Celebrations & Life Story | 39–41 | Birthday arcs, milestone recognition, life story archive | Free (physical goods deferred) |
| M16 — Grief & Transitions | 42–44 | Grief circles, life transition pathways, professional referral network | Free |
| M17 — Services Marketplace | 45–50 | Transport, home services, meals, health services, legal/financial, tech help | Free to build; services cost money to use |
| M18 — Enterprise | 51–55 | Employer portal, outcomes dashboard, university partnerships, Medicare Advantage | Free to build |

---

## ARCHITECTURE NOTES

**Launch strategy — Parallel Blitz (Strategy D from Strategy v4):**
Launch B2C subscriptions + free cultural circles + MSW university partnerships simultaneously from Month 1. Aria calls must be live in Week 1. Delivery partner schedule: Meals on Wheels Month 3, GoGoGrandparent + Instacart Month 6, Lyft Healthcare + Angi Month 9, Teladoc Month 12. First university contract Month 4. Buddy assignments Month 5.

**Aria adaptive call frequency model (from Aria Research v4):**
- **Daily** (default for all members at sign-up) — richest MA dataset, 365 data points/yr
- **3x/week** (member/family opt-down) — clinically validated by CLOVA CareCall, Mon/Wed/Fri
- **Weekly** (resistant seniors) — minimum viable signal, 52 data points/yr
- Adaptive call frequency: on third call Aria explicitly offers choice: "Do you prefer I call every day, or would a few times a week suit you better?"
- Family can change frequency any time in dashboard preferences
- Navigator can update frequency based on case knowledge

**Aria language rules (from research evidence):**
- NEVER use in any UI or Aria speech: "monitoring", "wellness check", "safety call", "check-up", "assessment"
- ALWAYS use: "morning catch-up", "friendly call", "daily chat", "Aria's call"
- Aria first call must include: "Our conversations are private. Your family only sees a friendly summary — not a recording or transcript."
- Aria third call must offer frequency choice: "Do you prefer I call every day, or would a few times a week suit you better?"
- Aria must reference a previous conversation from the very first week — this is the primary retention mechanism
- Family dashboard shows AI summary ONLY — never the raw transcript (trust design + HIPAA)
- Average call length target: 15 minutes (budget Retell AI costs accordingly)
- Adaptive frequency: daily (default), 3x/week (opt-down), weekly (resistant) — configured in member preferences

**Brand integrity rule** — every page, notification, email, and PDF must display the ThriveAtHome brand. B2B portals are "powered by ThriveAtHome" — never invisible. Family-facing pages always show ThriveAtHome branding. Member ownership: every member belongs to ThriveAtHome, not the referring agency.

**Three roles rule** — Aria (AI), Human Buddy (relationship), Navigator (admin/care) must be clearly distinguished in all UI, copy, and plan descriptions. Never conflate these roles.

**No new service interfaces needed** — all 8 interfaces from V1 cover the services in M13–M18. `TransportProvider`, `MealProvider`, and `GoodsProvider` are already stubbed and ready.

**New database tables** are created via Supabase SQL Editor migrations. Always write the full SQL before running anything.

**New placeholder pages** — any route not in the current app needs a placeholder first, then the real page. Check `/app/` before creating new routes.

**Realtime** — use the existing `push-notification` Edge Function for all new notification types. The `notif_type` enum already includes `volunteer_matched`, `celebration_upcoming`, and `grief_support_assigned`.

---

## ═══ M13 — VOLUNTEER NETWORK ═══

### PHASE 29 — Volunteer Database + Application

**Prerequisites:** No new accounts needed. Checkr account needed only when first volunteer applies.

**New tables (`/supabase/migrations/005_volunteers.sql`):**

```sql
CREATE TYPE volunteer_status AS ENUM ('pending','background_check','active','inactive','suspended');
CREATE TYPE visit_type AS ENUM ('phone_call','in_person_visit','virtual_event','grocery_help','walking_companion','reading_aloud','tech_help');

CREATE TABLE volunteers (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id      uuid UNIQUE,
  full_name             text NOT NULL,
  email                 text NOT NULL,
  phone                 text,
  city                  text,
  state                 text,
  languages             text[] DEFAULT '{}',
  availability_days     text[] DEFAULT '{}',
  hours_per_week        text,
  service_types         visit_type[] DEFAULT '{}',
  interests             text[] DEFAULT '{}',
  why_volunteer         text,
  prior_experience      text,
  status                volunteer_status NOT NULL DEFAULT 'pending',
  background_check_id   text,
  background_check_status text,
  total_hours_logged    numeric DEFAULT 0,
  total_seniors_helped  int DEFAULT 0,
  rating_average        numeric,
  notes                 text
);
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE TABLE volunteer_visits (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  volunteer_id      uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  visit_date        date NOT NULL,
  duration_minutes  int NOT NULL,
  visit_type        visit_type NOT NULL,
  volunteer_notes   text,
  volunteer_rating  int CHECK (volunteer_rating BETWEEN 1 AND 5),
  member_rating     int CHECK (member_rating BETWEEN 1 AND 5),
  verified          boolean NOT NULL DEFAULT false
);
ALTER TABLE volunteer_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE volunteer_matches (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  volunteer_id     uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  match_score      int NOT NULL DEFAULT 0,
  match_reasons    jsonb NOT NULL DEFAULT '[]',
  status           text NOT NULL DEFAULT 'pending',
  matched_at       timestamptz,
  intro_sent_at    timestamptz
);
ALTER TABLE volunteer_matches ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 29 CHECKLIST
[ ] Migration 005 runs without errors in Supabase SQL Editor
    VERIFY: All 3 new tables visible in Supabase Table Editor
    PASS: volunteers, volunteer_visits, volunteer_matches all present

[ ] /app/volunteer/apply/page.tsx — real form replaces placeholder
    VERIFY: Navigate to /volunteer/apply (logged out is fine — public route)
    PASS: Multi-section application form renders, not "Coming soon"

[ ] Form collects all required fields
    VERIFY: Check form has sections for personal info, availability, service types, interests, motivation
    PASS: All sections visible and submittable

[ ] Submission saves to volunteers table
    VERIFY: Submit test application, check Supabase volunteers table
    PASS: Row created with status='pending', all fields populated

[ ] Admin receives email notification on new application
    VERIFY: Submit application, check CARE_TEAM_EMAIL inbox
    PASS: Email received with applicant name and details (stub logs in dev if SendGrid not configured)

[ ] Admin volunteer queue at /app/admin/volunteers/page.tsx
    VERIFY: Log in as admin, navigate to /admin/volunteers
    PASS: List of pending applications with Approve/Reject buttons

[ ] Approve action updates status
    VERIFY: Click Approve on test application
    PASS: status changes to 'background_check' in Supabase

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero errors
```

**Build instructions:**

Volunteer application page (`/app/volunteer/apply/page.tsx`) — public route, no login required. Sections:
- Personal info: name, email, phone, city, state
- Languages spoken (multi-select pills — same pattern as onboarding topic pills)
- Availability: days of week (checkboxes), hours per week (select: 1–2, 3–5, 5–10, 10+)
- Service types willing to do (multi-select: the 6 visit_type options)
- Interests (same 12-option list as member interests — used for matching)
- Motivation: "Why do you want to volunteer?" (textarea, required)
- Prior experience with seniors (textarea, optional)

Admin volunteers page (`/app/admin/volunteers/page.tsx`) — protected, admin role only. Shows pending applications table with: name, email, city, service types, submission date, Approve/Reject actions.

---

### PHASE 30 — Volunteer Matching Algorithm

**What this builds:** When a member needs a volunteer, the system scores all active volunteers and returns the best matches.

**Checklist:**
```
PHASE 30 CHECKLIST
[ ] Match scoring function produces correct results
    VERIFY: npx tsx scripts/test-volunteer-matching.ts
    PASS: Volunteer with same city + 3 shared interests scores higher than volunteer with no overlap

[ ] getTopVolunteerMatches returns ranked results
    VERIFY: Test script confirms top 3 matches returned for test member
    PASS: Results sorted by score descending

[ ] Admin matching UI at /admin/volunteer-matching/page.tsx
    VERIFY: Navigate to /admin/volunteer-matching
    PASS: Page shows pending match requests on left, top 3 suggested volunteers on right

[ ] Confirm match creates volunteer_matches row
    VERIFY: Click Confirm Match in admin UI
    PASS: Row created in volunteer_matches with status='matched'

[ ] Intro notification pushed via Realtime
    VERIFY: Family member dashboard open while admin confirms match
    PASS: 'volunteer_matched' notification appears within 2 seconds

[ ] npx tsc --noEmit passes
```

**Scoring logic (`/lib/volunteers/match.ts`):**

```ts
export function scoreVolunteerForMember(volunteer: Volunteer, member: Member): number {
  let score = 0
  // Location match
  if (volunteer.city?.toLowerCase() === member.address?.toLowerCase()) score += 25
  // Shared interests (max 45 points)
  const sharedInterests = volunteer.interests.filter(i => member.topics_enjoy?.includes(i))
  score += Math.min(sharedInterests.length * 15, 45)
  // Language match (if member non-English primary)
  if (member.preferred_language !== 'english' && volunteer.languages.includes(member.preferred_language)) score += 20
  // Availability (has at least some hours available)
  if (volunteer.hours_per_week && volunteer.hours_per_week !== '0') score += 10
  return score
}
```

---

### PHASE 31 — Volunteer Dashboard

**What this builds:** Approved volunteers have their own portal to manage visits and track impact.

**Checklist:**
```
PHASE 31 CHECKLIST
[ ] Volunteer can log in and reach /volunteer/dashboard
    VERIFY: Create volunteer auth user, set role='volunteer' in family_members, log in
    PASS: Lands on /volunteer/dashboard, not redirected

[ ] Dashboard shows upcoming matched members
    VERIFY: Create a volunteer_match for the test volunteer, reload dashboard
    PASS: Member appears in "Your connections" section (first name + last initial only)

[ ] Log a visit form works
    VERIFY: Fill in visit form (date, duration, type, notes, rating) and submit
    PASS: Row created in volunteer_visits, total_hours_logged updated on volunteer row

[ ] Impact stats update correctly
    VERIFY: Log 2 visits, check dashboard stats
    PASS: Total hours and seniors helped counts are correct

[ ] Privacy: only member first name + last initial shown
    VERIFY: Check all volunteer-facing UI for member names
    PASS: Never shows full name — always "Margaret C." format

[ ] npx tsc --noEmit passes
```

Add `volunteer` to the `user_role` enum or handle via a separate volunteers table auth lookup. Middleware must route `volunteer` role users to `/volunteer/dashboard`.

---

### PHASE 32 — Student Volunteer Portal (University Partnerships Preview)

**What this builds:** A lightweight student portal so university students can log service hours — preview of the full M18 university feature.

**New tables (`/supabase/migrations/006_students.sql`):**

```sql
CREATE TABLE student_volunteers (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id    uuid UNIQUE,
  full_name           text NOT NULL,
  email               text NOT NULL,
  university_name     text,
  major               text,
  graduation_year     int,
  interests           text[] DEFAULT '{}',
  languages           text[] DEFAULT '{}',
  total_hours_logged  numeric DEFAULT 0,
  status              text NOT NULL DEFAULT 'pending'
);
ALTER TABLE student_volunteers ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 32 CHECKLIST
[ ] /app/student/page.tsx — real page replaces placeholder
    VERIFY: Log in as student role, navigate to /student
    PASS: Student portal loads with service hours tracker

[ ] Student can log a visit
    VERIFY: Submit visit log with date, duration, reflection (required for credit)
    PASS: Row created in volunteer_visits with student_volunteer_id

[ ] Service hour total displays correctly
    VERIFY: Log 2 visits of 2 hours each, check total
    PASS: "4 hours of verified community service" shown

[ ] Download service record generates PDF
    VERIFY: Click "Download service record"
    PASS: PDF downloads with student name, hours, dates, university name

[ ] npx tsc --noEmit passes
```

---

### PHASE 33 — VSO Volunteer Network (Veterans)

**What this builds:** A dedicated volunteer track for veterans — veteran-to-veteran connection, VA benefits navigation volunteers.

**Checklist:**
```
PHASE 33 CHECKLIST
[ ] Volunteer application has veteran-specific path
    VERIFY: /volunteer/apply has "Are you a veteran?" toggle
    PASS: Toggle reveals veteran-specific fields (branch, years served, VSO affiliation)

[ ] Veteran volunteers tagged in database
    VERIFY: Submit veteran application, check volunteers table
    PASS: interests array includes 'veteran' tag

[ ] Veteran-to-veteran matching prioritised
    VERIFY: Test matching for a veteran member
    PASS: Veteran volunteers score 20 points higher when matching veteran members

[ ] npx tsc --noEmit passes
```

---

## ═══ M14 — COMMUNITY FEATURES ═══

### PHASE 34 — Cultural Community Circles

**New tables (`/supabase/migrations/007_cultural_circles.sql`):**

```sql
CREATE TABLE cultural_circles (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  circle_name      text NOT NULL,
  primary_language text NOT NULL DEFAULT 'english',
  description      text NOT NULL,
  member_count     int NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  image_placeholder text
);
ALTER TABLE cultural_circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_read_circles" ON cultural_circles FOR SELECT USING (true);

CREATE TABLE circle_memberships (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  circle_id   uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  is_ambassador boolean NOT NULL DEFAULT false,
  UNIQUE(member_id, circle_id)
);
ALTER TABLE circle_memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE circle_posts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  circle_id  uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content    text NOT NULL,
  post_type  text NOT NULL DEFAULT 'update'
);
ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE circle_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  circle_id    uuid NOT NULL REFERENCES cultural_circles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  event_date   date NOT NULL,
  event_time   time,
  format       text NOT NULL DEFAULT 'phone',
  dial_in_number text,
  dial_in_code text,
  video_link   text,
  rsvp_count   int NOT NULL DEFAULT 0,
  is_recurring boolean NOT NULL DEFAULT false
);
ALTER TABLE circle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_read_circle_events" ON circle_events FOR SELECT USING (true);
```

**Seed all 12 circles:**
```sql
INSERT INTO cultural_circles (circle_name, primary_language, description) VALUES
('Latino & Hispanic Community', 'spanish', 'A welcoming space for Latino and Hispanic seniors to connect, share stories, and celebrate our rich cultural heritage.'),
('Chinese-American Community', 'mandarin', 'Connecting Chinese-American seniors across generations — sharing traditions, language, and community.'),
('Vietnamese-American Community', 'vietnamese', 'A warm community for Vietnamese-American seniors to connect, share memories, and support one another.'),
('Korean-American Community', 'korean', 'Celebrating Korean heritage and building connections among Korean-American seniors.'),
('South Asian Community', 'hindi', 'A welcoming space for seniors from India, Pakistan, Bangladesh, Sri Lanka, and Nepal.'),
('Filipino-American Community', 'tagalog', 'Connecting Filipino-American seniors through shared culture, language, and warm community spirit.'),
('African-American Community', 'english', 'A proud and vibrant space celebrating African-American heritage, history, and community.'),
('Jewish-American Community', 'english', 'Connecting Jewish seniors through shared traditions, holidays, and the richness of Jewish culture.'),
('Arab & Middle Eastern Community', 'arabic', 'A welcoming community for Arab and Middle Eastern seniors to share culture and connection.'),
('Caribbean Community', 'english', 'Celebrating the warmth and vibrancy of Caribbean culture — from Jamaica to Haiti to Trinidad.'),
('Eastern European Community', 'polish', 'Connecting seniors with roots in Poland, Ukraine, Russia, and across Eastern Europe.'),
('Native American & Indigenous Community', 'english', 'Honoring Indigenous heritage and building connections among Native American seniors.');
```

**Checklist:**
```
PHASE 34 CHECKLIST
[ ] Migration 007 runs, all 12 circle seed rows created
    VERIFY: Supabase Table Editor → cultural_circles → 12 rows
    PASS: All 12 circles present with correct names and languages

[ ] /dashboard/cultural-circles — real page replaces placeholder
    VERIFY: Log in, navigate to /dashboard/cultural-circles
    PASS: Grid of 12 circle cards visible, not "Coming soon"

[ ] Join a circle
    VERIFY: Click Join on a circle card
    PASS: Button changes to "Joined", member_count increments, circle_memberships row created

[ ] Joined circles appear at top
    VERIFY: Join 2 circles, reload page
    PASS: Joined circles pinned at top with "Your Communities" label

[ ] Individual circle page at /dashboard/cultural-circles/[circleId]
    VERIFY: Click into a circle
    PASS: Circle name, description, community feed, upcoming events visible

[ ] Post to community feed
    VERIFY: Type a message and click Post
    PASS: Post appears in feed immediately, circle_posts row created

[ ] RSVP to a circle event
    VERIFY: Admin creates a test event via Supabase, RSVP from member
    PASS: RSVP confirmed, dial-in details shown prominently

[ ] Leave circle
    VERIFY: Click Leave from circle page
    PASS: Membership row deleted, member_count decremented

[ ] Admin circle management at /admin/cultural-circles
    VERIFY: Log in as admin, navigate to /admin/cultural-circles
    PASS: Can create events, post announcements, see membership counts

[ ] npx tsc --noEmit passes
```

---

### PHASE 35 — Virtual Events Platform

**New tables (`/supabase/migrations/008_events.sql`):**

```sql
CREATE TYPE event_format AS ENUM ('phone_only','video_or_phone','in_person');
CREATE TYPE event_status AS ENUM ('upcoming','live','completed','cancelled');

CREATE TABLE events (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  title            text NOT NULL,
  description      text,
  event_type       text NOT NULL DEFAULT 'general',
  host_name        text,
  event_date       date NOT NULL,
  event_time       time NOT NULL,
  timezone         text NOT NULL DEFAULT 'America/New_York',
  duration_minutes int NOT NULL DEFAULT 60,
  format           event_format NOT NULL DEFAULT 'phone_only',
  dial_in_number   text,
  dial_in_code     text,
  video_link       text,
  max_capacity     int,
  is_recurring     boolean NOT NULL DEFAULT false,
  recurrence_pattern text,
  status           event_status NOT NULL DEFAULT 'upcoming',
  rsvp_count       int NOT NULL DEFAULT 0
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_can_read_events" ON events FOR SELECT TO authenticated USING (true);

CREATE TABLE event_rsvps (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rsvp_date  timestamptz NOT NULL DEFAULT now(),
  attended   boolean NOT NULL DEFAULT false,
  UNIQUE(event_id, member_id)
);
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 35 CHECKLIST
[ ] Migration 008 runs without errors
    VERIFY: events and event_rsvps tables visible in Supabase
    PASS: Both tables present

[ ] /dashboard/events — real page replaces placeholder
    VERIFY: Navigate to /dashboard/events (logged in)
    PASS: Events calendar loads, not "Coming soon"

[ ] Events display correctly
    VERIFY: Admin creates 3 test events via Supabase, reload /dashboard/events
    PASS: Events shown in chronological order with date, time, host, format badge

[ ] RSVP works
    VERIFY: Click RSVP on an event
    PASS: Button changes to "Going!", dial-in details shown prominently below
          "Call [number] and enter [code] when prompted. That's it."

[ ] RSVP for today's event shows "Join Now"
    VERIFY: Create event with today's date
    PASS: "Join Now" button with phone number displayed large

[ ] Cancel RSVP works
    VERIFY: Click "Cancel RSVP" on an RSVPed event
    PASS: Returns to RSVP button, rsvp_count decrements

[ ] Admin event creation at /admin/events/create
    VERIFY: Log in as admin, navigate to /admin/events/create, create an event
    PASS: Event appears in /dashboard/events for members

[ ] npx tsc --noEmit passes
```

---

### PHASE 36 — Skill Exchange / Time Banking

**New tables (`/supabase/migrations/009_skill_exchange.sql`):**

```sql
CREATE TABLE skills_offered (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_name      text NOT NULL,
  skill_category  text NOT NULL DEFAULT 'other',
  description     text NOT NULL,
  delivery_method text NOT NULL DEFAULT 'phone',
  max_group_size  int NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true
);
ALTER TABLE skills_offered ENABLE ROW LEVEL SECURITY;

CREATE TABLE time_credits (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  balance          numeric NOT NULL DEFAULT 0,
  lifetime_earned  numeric NOT NULL DEFAULT 0,
  lifetime_spent   numeric NOT NULL DEFAULT 0
);
ALTER TABLE time_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_own_credits" ON time_credits FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = time_credits.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE TABLE skill_exchanges (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  teacher_member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  learner_member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id            uuid NOT NULL REFERENCES skills_offered(id) ON DELETE CASCADE,
  scheduled_date      timestamptz,
  duration_hours      numeric NOT NULL DEFAULT 1,
  status              text NOT NULL DEFAULT 'scheduled',
  teacher_rating      int CHECK (teacher_rating BETWEEN 1 AND 5),
  learner_rating      int CHECK (learner_rating BETWEEN 1 AND 5),
  credits_transferred numeric
);
ALTER TABLE skill_exchanges ENABLE ROW LEVEL SECURITY;

CREATE TABLE time_credit_transactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount      numeric NOT NULL,
  type        text NOT NULL,
  exchange_id uuid REFERENCES skill_exchanges(id) ON DELETE SET NULL,
  description text NOT NULL
);
ALTER TABLE time_credit_transactions ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 36 CHECKLIST
[ ] Migration 009 runs without errors
    VERIFY: All 4 new tables visible in Supabase
    PASS: skills_offered, time_credits, skill_exchanges, time_credit_transactions present

[ ] /dashboard/skill-exchange — real page replaces placeholder
    VERIFY: Navigate to /dashboard/skill-exchange
    PASS: 3-tab interface loads (Learn, Share, My Credits)

[ ] Register a skill
    VERIFY: Fill in skill form on Share tab, submit
    PASS: skills_offered row created, skill appears in Learn tab for other members

[ ] Request an exchange
    VERIFY: Click "Request this exchange" on a skill
    PASS: skill_exchanges row created with status='scheduled'

[ ] Complete exchange transfers credits
    VERIFY: Mark exchange complete via admin or API
    PASS: Teacher balance +1, transaction rows created, family dashboard shows highlight

[ ] My Credits tab shows balance and history
    VERIFY: After completing an exchange, check My Credits tab
    PASS: Balance shown as a number, transactions listed with dates

[ ] npx tsc --noEmit passes
```

---

### PHASE 37 — Interest Groups + Benefits Finder

**Interest groups (`/supabase/migrations/010_interest_groups.sql`):**

```sql
CREATE TABLE interest_groups (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  name         text NOT NULL,
  description  text,
  interest_tag text NOT NULL,
  member_count int NOT NULL DEFAULT 0,
  cadence      text NOT NULL DEFAULT 'weekly',
  format       text NOT NULL DEFAULT 'phone'
);
ALTER TABLE interest_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_groups" ON interest_groups FOR SELECT TO authenticated USING (true);

CREATE TABLE group_memberships (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  group_id   uuid NOT NULL REFERENCES interest_groups(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(group_id, member_id)
);
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 37 CHECKLIST
[ ] /dashboard/groups — real page replaces placeholder
    VERIFY: Navigate to /dashboard/groups
    PASS: Interest group discovery page loads with available groups

[ ] Join and leave a group works
    VERIFY: Join a group, confirm membership row, leave, confirm deleted
    PASS: member_count updates correctly both ways

[ ] /dashboard/benefits — real page replaces placeholder
    VERIFY: Navigate to /dashboard/benefits
    PASS: 5-question benefits finder loads, not "Coming soon"

[ ] Benefits questionnaire returns relevant results
    VERIFY: Answer as low-income veteran in California
    PASS: VA Aid & Attendance and 3+ relevant benefits shown

[ ] Benefits disclaimer visible
    VERIFY: Check results page
    PASS: "This is a general guide. A navigator can help you determine exact eligibility." visible

[ ] npx tsc --noEmit passes
```

Benefits finder uses a static data file at `/lib/benefits/data.ts` — 15+ federal and common programs with eligibility rules, estimated value, apply URL, and category. No external API needed.

---

### PHASE 38 — Employer Portal MVP

**New tables (`/supabase/migrations/011_employer.sql`):**

```sql
CREATE TABLE employer_accounts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  company_name    text NOT NULL,
  contact_name    text NOT NULL,
  contact_email   text NOT NULL,
  plan_tier       text NOT NULL DEFAULT 'essentials',
  seats_purchased int NOT NULL DEFAULT 0,
  seats_used      int NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active'
);
ALTER TABLE employer_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE employer_leads (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  company_name  text NOT NULL,
  contact_name  text NOT NULL,
  email         text NOT NULL,
  phone         text,
  company_size  text,
  notes         text,
  status        text NOT NULL DEFAULT 'new',
  next_follow_up_date date
);
ALTER TABLE employer_leads ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 38 CHECKLIST
[ ] /employers — real page replaces placeholder
    VERIFY: Navigate to /employers (logged out)
    PASS: Employer landing page loads with value proposition and demo request form

[ ] Demo request form submits
    VERIFY: Fill in and submit demo request form
    PASS: employer_leads row created, sales team notified via stub email

[ ] /employer-admin page exists (placeholder for now)
    VERIFY: Navigate to /employer-admin
    PASS: Coming soon with "Contact us to set up your employer account"

[ ] npx tsc --noEmit passes
```

---

## ═══ M15 — CELEBRATIONS & LIFE STORY ═══

### PHASE 39 — Personalized Celebrations Engine

**New tables (`/supabase/migrations/012_celebrations.sql`):**

```sql
CREATE TABLE celebration_events (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  celebration_type     text NOT NULL,
  event_date           date NOT NULL,
  status               text NOT NULL DEFAULT 'scheduled',
  ai_message           text,
  family_notified_at   timestamptz,
  community_posted_at  timestamptz
);
ALTER TABLE celebration_events ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 39 CHECKLIST
[ ] Birthday detection cron runs correctly
    VERIFY: Set test member DOB to 7 days from today, trigger cron
    PASS: celebration_events row created with celebration_type='birthday'

[ ] D-7 family notification sends
    VERIFY: Trigger celebration cron for member with birthday in 7 days
    PASS: Realtime notification pushed to family: "Margaret's birthday is in 7 days"

[ ] D-0 dashboard shows birthday banner
    VERIFY: Set test member DOB to today's date, load dashboard
    PASS: Birthday banner visible on family dashboard

[ ] /dashboard/celebrations — real page replaces placeholder
    VERIFY: Navigate to /dashboard/celebrations
    PASS: Upcoming celebrations and past milestones page loads

[ ] AI personalisation generates correctly
    VERIFY: aiProvider.generateCelebrationPersonalisation() called
    PASS: Stub returns placeholder text "[STUB] Celebration message" — real Anthropic in M8

[ ] npx tsc --noEmit passes
```

Add to `vercel.json` crons:
```json
{ "path": "/api/cron/celebrations", "schedule": "0 8 * * *" }
```

---

### PHASE 40 — Life Story Archive

**New tables (`/supabase/migrations/013_life_story.sql`):**

```sql
CREATE TABLE life_story_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title        text NOT NULL,
  content      text NOT NULL,
  era          text,
  entry_type   text NOT NULL DEFAULT 'memory',
  created_by   uuid REFERENCES family_members(id) ON DELETE SET NULL,
  is_private   boolean NOT NULL DEFAULT false
);
ALTER TABLE life_story_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_life_story" ON life_story_entries FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = life_story_entries.member_id AND fm.supabase_auth_id = auth.uid()));
```

**Checklist:**
```
PHASE 40 CHECKLIST
[ ] /dashboard/life-story — real page replaces placeholder
    VERIFY: Navigate to /dashboard/life-story
    PASS: Life story archive loads with "Add a memory" prompt

[ ] Add a memory entry
    VERIFY: Fill in title, content, era, submit
    PASS: Entry appears in timeline, life_story_entries row created

[ ] Edit and delete entries work
    VERIFY: Edit an entry, save; delete an entry
    PASS: Changes persist correctly, deleted entry disappears

[ ] Timeline view organised by era
    VERIFY: Add entries with different eras (Childhood, Young adult, Career, Family)
    PASS: Entries grouped by era in chronological timeline

[ ] npx tsc --noEmit passes
```

---

### PHASE 41 — Milestone Recognition

**Checklist:**
```
PHASE 41 CHECKLIST
[ ] Milestone detection: first check-in call completed
    VERIFY: Mark first check_in_call as completed for test member
    PASS: Milestone notification pushed to family via Realtime

[ ] Milestone detection: 30-day streak
    VERIFY: Create 30 consecutive daily call records
    PASS: "30-day streak" celebration event created

[ ] Milestones visible on dashboard
    VERIFY: Check family dashboard after milestone created
    PASS: Milestone card visible in a celebrations section

[ ] npx tsc --noEmit passes
```

---

## ═══ M16 — GRIEF & LIFE TRANSITIONS ═══

### PHASE 42 — Grief Support Circles

**New tables (`/supabase/migrations/014_grief.sql`):**

```sql
CREATE TABLE grief_support_requests (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loss_type             text NOT NULL,
  circle_type_requested text,
  availability_preference text,
  status                text NOT NULL DEFAULT 'pending',
  navigator_notes       text,
  matched_at            timestamptz
);
ALTER TABLE grief_support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_grief_requests" ON grief_support_requests FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = grief_support_requests.member_id AND fm.supabase_auth_id = auth.uid()));
```

**Checklist:**
```
PHASE 42 CHECKLIST
[ ] /dashboard/grief-support — real page replaces placeholder
    VERIFY: Navigate to /dashboard/grief-support
    PASS: Warm landing page loads with 4 category cards, not "Coming soon"

[ ] Grief support request form submits
    VERIFY: Click "Loss of a loved one", fill in request form, submit
    PASS: grief_support_requests row created with status='pending'

[ ] Care team notified via stub email
    VERIFY: Submit request, check stub logs
    PASS: "[STUB][EMAIL] Would send grief support notification to care team"

[ ] Check-in frequency updated to daily on request
    VERIFY: Submit grief request for a member, check members table
    PASS: check_in_frequency updated to 'daily'

[ ] Navigator can see requests in console
    VERIFY: Log in as navigator, check navigator console
    PASS: Grief support requests appear in a dedicated queue

[ ] npx tsc --noEmit passes
```

---

### PHASE 43 — Life Transition Support Pathways

**What this builds:** Structured support flows for major life transitions — not just loss, but nursing home moves, health diagnoses, loss of driving, cognitive diagnosis.

**Checklist:**
```
PHASE 43 CHECKLIST
[ ] Transition support page shows 5 pathway cards
    VERIFY: Navigate to /dashboard/grief-support (extended)
    PASS: 5 pathway cards: Loss of loved one, Major health diagnosis, Moving to care setting,
          Loss of driving independence, Another major life change

[ ] Each pathway has a request form
    VERIFY: Click "Major health diagnosis" pathway
    PASS: Form appears with relevant support options

[ ] Behavioral monitoring: prolonged grief detection
    VERIFY: Insert 90 days of low mood scores (3-4) for test member
    PASS: Navigator task created: "Review for prolonged grief support"

[ ] Holiday sensitivity: near loss anniversaries
    VERIFY: Add a loss anniversary date to a grief request, check cron behavior near that date
    PASS: Check-in frequency increases to daily in the week before the anniversary

[ ] npx tsc --noEmit passes
```

---

### PHASE 44 — Professional Referral Network

**Checklist:**
```
PHASE 44 CHECKLIST
[ ] Grief support results include professional referral option
    VERIFY: Submit grief request, check confirmation page
    PASS: "Talk to a navigator" button and professional referral info visible
          Never just a phone number — always a warm handoff description

[ ] Professional resources listed on grief support page
    VERIFY: Check /dashboard/grief-support resources section
    PASS: 5-6 reputable organizations listed with brief descriptions (no detailed content reproduction)

[ ] Navigator can refer to external professional from console
    VERIFY: Open member detail panel for a member with a grief request
    PASS: "Refer to external support" action available with referral note field

[ ] npx tsc --noEmit passes
```

---

## ═══ M17 — SERVICES MARKETPLACE ═══

### PHASE 45 — Transport Services

**New tables (`/supabase/migrations/015_services.sql`):**

```sql
CREATE TYPE booking_status AS ENUM ('requested','confirmed','in_progress','completed','cancelled');

CREATE TABLE service_bookings (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_type      text NOT NULL,
  provider_name     text,
  booking_details   jsonb NOT NULL DEFAULT '{}',
  status            booking_status NOT NULL DEFAULT 'requested',
  requested_for     timestamptz,
  confirmed_at      timestamptz,
  completed_at      timestamptz,
  provider_booking_id text,
  cost_estimate     numeric,
  notes             text
);
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_bookings" ON service_bookings FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = service_bookings.member_id AND fm.supabase_auth_id = auth.uid()));
```

**Checklist:**
```
PHASE 45 CHECKLIST
[ ] Migration 015 runs without errors
    VERIFY: service_bookings table visible in Supabase
    PASS: Table present with correct columns

[ ] /dashboard/services — real page replaces placeholder
    VERIFY: Navigate to /dashboard/services
    PASS: Services marketplace hub loads with 6 category cards, not "Coming soon"

[ ] Transport booking request form works
    VERIFY: Request a ride (pickup address, destination, date/time)
    PASS: service_bookings row created with service_type='transport', status='requested'

[ ] Stub provider logs correctly
    VERIFY: Submit transport request, check terminal
    PASS: "[STUB][Transport] Would book ride for member [id]: [pickup] → [destination]"

[ ] Family dashboard shows booked transport
    VERIFY: Create a transport booking, reload family dashboard
    PASS: Upcoming transport visible in a "Scheduled services" section

[ ] Navigator can see and manage bookings
    VERIFY: Log in as navigator, check member detail panel
    PASS: Service bookings visible for assigned members

[ ] npx tsc --noEmit passes
```

**Service hub page (`/dashboard/services/page.tsx`):**
Six category cards:
1.  Transport — rides to appointments, errands, social outings
2.  Home Services — cleaning, maintenance, safety assessments
3.  Meals & Nutrition — meal delivery, grocery help, cooking groups
4.  Health Services — telehealth, medication management, mental health
5. ⚖️ Legal & Financial — vetted advisor directory, document vault
6.  Tech Help — phone and in-home tech support

Each card links to its own section with service request forms.

---

### PHASE 46 — Home Services + Meals

**Checklist:**
```
PHASE 46 CHECKLIST
[ ] Home services request form works
    VERIFY: Request a home safety assessment
    PASS: service_bookings row created with service_type='home_service'

[ ] Meals request form works
    VERIFY: Request grocery delivery
    PASS: service_bookings row created, stub MealProvider logs

[ ] Seasonal reminders cron runs
    VERIFY: Check vercel.json for seasonal reminder cron
    PASS: Cron exists to remind families about seasonal home safety checks

[ ] AI grocery list generation (stub)
    VERIFY: Request grocery list generation from member dietary preferences
    PASS: Stub returns "[STUB] Grocery list based on dietary preferences"

[ ] npx tsc --noEmit passes
```

---

### PHASE 47 — Health Services + Legal/Financial + Tech Help

**Checklist:**
```
PHASE 47 CHECKLIST
[ ] Health services section: telehealth request form works
    VERIFY: Request a telehealth consultation
    PASS: service_bookings row created with service_type='telehealth'

[ ] Mental health referral tracking
    VERIFY: Submit mental health support request
    PASS: Navigator notified, referral tracking entry created

[ ] Legal/Financial: vetted advisor directory renders
    VERIFY: Navigate to legal/financial section
    PASS: Static list of resource types (elder law attorney, financial advisor) with
          "Our navigators can connect you" CTA — never specific firm names

[ ] Tech help request form works
    VERIFY: Submit tech help request (type: smartphone help)
    PASS: service_bookings row created, navigator task created

[ ] Fraud protection alerts section visible
    VERIFY: Check health/legal pages for fraud awareness content
    PASS: Scam awareness section present with common senior scam types listed

[ ] npx tsc --noEmit passes
```

---

### PHASE 48 — Paid Companion Marketplace

**Prerequisites:** Stripe Connect setup (requires Stripe account — adds ~1–2 weeks setup time)

**New tables (`/supabase/migrations/016_companions.sql`):**

```sql
CREATE TABLE companions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id uuid UNIQUE,
  full_name       text NOT NULL,
  email           text NOT NULL,
  bio             text,
  hourly_rate     numeric NOT NULL DEFAULT 20,
  service_types   text[] DEFAULT '{}',
  languages       text[] DEFAULT '{}',
  city            text,
  state           text,
  stripe_account_id text,
  is_active       boolean NOT NULL DEFAULT false,
  rating_average  numeric,
  total_sessions  int NOT NULL DEFAULT 0
);
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 48 CHECKLIST
[ ] Companion browse page renders
    VERIFY: Navigate to /dashboard/services, click Companion section
    PASS: Companion cards visible with name, bio, rate, services

[ ] Book companion request creates booking
    VERIFY: Click "Book" on a companion card
    PASS: service_bookings row created with service_type='companion'

[ ] Rating prompt after session
    VERIFY: Mark companion booking complete
    PASS: Rating prompt appears (stub — real SMS in M10)

[ ] Note: Stripe Connect payouts deferred until Stripe Connect configured
    VERIFY: Booking works without Stripe Connect active
    PASS: Stub billing provider logs "[STUB][Billing] Would process companion payout"

[ ] npx tsc --noEmit passes
```

---

### PHASE 49 — On-Demand Tech Help

**Checklist:**
```
PHASE 49 CHECKLIST
[ ] Tech helpline page renders with dial-in info
    VERIFY: Navigate to tech help section of /dashboard/services
    PASS: Phone number for tech help visible (use CARE_TEAM_EMAIL phone as placeholder)

[ ] In-home tech help booking works
    VERIFY: Book in-home tech session
    PASS: service_bookings row created, navigator task created

[ ] Scam education content visible
    VERIFY: Check tech help section for scam awareness
    PASS: Common senior tech scams listed with plain-English explanations

[ ] Video tutorial library placeholder
    VERIFY: Tech help section has "Tutorials" link
    PASS: Placeholder page with categories (smartphone basics, video calls, online safety)

[ ] npx tsc --noEmit passes
```

---

### PHASE 50j — Important Dates & Renewals (generalizes Phase 50a Prescription Refill)

**What this builds:** A flexible, member-configurable system for tracking any renewal, subscription, or appointment — prescriptions, home/car/health insurance, driver's license, car registration, AAA membership, passport, gym memberships, and any other date-based item the member wants tracked. Replaces the narrower Phase 50a Prescription Refill Management by making prescriptions one configured item type within this broader system. Members can upload supporting documents (insurance card photo, registration document, appointment confirmation) for each tracked item.

**New table (`/supabase/migrations/035_tracked_items.sql`):**

```sql
CREATE TABLE tracked_items (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  item_type             text NOT NULL DEFAULT 'other',
  -- prescription, home_insurance, car_insurance, health_insurance, drivers_license,
  -- car_registration, aaa_membership, passport, gym_membership, appointment, other
  category              text NOT NULL DEFAULT 'renewal',
  -- 'renewal' or 'appointment'
  item_name             text NOT NULL,
  -- free text e.g. "Honda Civic registration", "Dr. Smith annual physical", "Metformin"
  expiration_or_appointment_date date NOT NULL,
  reminder_lead_days    int NOT NULL DEFAULT 30,
  -- defaults vary by item_type, fully editable per item
  recurrence_cycle_days int,
  -- prescriptions=28, insurance/registration/license=365, AAA=365, null for one-time items
  is_recurring          boolean NOT NULL DEFAULT true,
  renewal_contact_info  text,
  -- phone/website for renewing, optional
  attachments           text[] DEFAULT '{}',
  -- Supabase Storage paths — insurance card photo, registration doc, appointment confirmation
  status                text NOT NULL DEFAULT 'active',
  -- active, snoozed, completed, cancelled
  last_reminded_at      timestamptz,
  snoozed_until         date,
  notes                 text,
  created_by            uuid REFERENCES family_members(id)
);
ALTER TABLE tracked_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_tracked_items" ON tracked_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = tracked_items.member_id
    AND fm.supabase_auth_id = auth.uid()
  ));
```

**Storage:** Reuse pattern from life-story-attachments — create Supabase Storage bucket `tracked-item-attachments` (private), same RLS approach (only family members linked to that member can upload/download).

**Default values by item_type (used to pre-fill the form, all editable per item):**

| item_type | Default reminder_lead_days | Default recurrence_cycle_days | is_recurring |
|---|---|---|---|
| prescription | 5 | 28 | true |
| home_insurance | 30 | 365 | true |
| car_insurance | 30 | 365 | true |
| health_insurance | 30 | 365 | true |
| drivers_license | 30 | 365 (or member-set, e.g. 4-8yr cycles) | true |
| car_registration | 30 | 365 | true |
| aaa_membership | 14 | 365 | true |
| passport | 90 | null | false |
| gym_membership | 14 | 365 | true |
| appointment | 1 (+ optional second reminder at 7) | null | false |
| other | 30 | null (member sets if recurring) | member choice |

**Checklist:**
```
PHASE 50j CHECKLIST
[ ] Migration 035_tracked_items.sql runs without errors
    VERIFY: tracked_items table visible in Supabase
    PASS: Table present with all columns

[ ] tracked-item-attachments Storage bucket created
    VERIFY: Supabase Storage shows the bucket, private
    PASS: Bucket present, RLS policy restricts to linked family members

[ ] Important Dates page exists
    VERIFY: Navigate to /dashboard/important-dates
    PASS: Page loads showing list of tracked items grouped by category (Renewals / Appointments),
          sorted soonest-first, color-coded by urgency (red <7 days, amber <30 days, normal otherwise)

[ ] Add tracked item form
    VERIFY: Click "Add important date", select item_type from preset dropdown with icons
            (💊 Prescription, 🏠 Home Insurance, 🚗 Car Insurance, 🏥 Health Insurance,
            🪪 Driver's License, 📋 Car Registration, 🛣️ AAA Membership, ✈️ Passport,
            🏋️ Gym Membership, 📅 Appointment, ➕ Other), enter item_name, date, optional contact info
    PASS: Form pre-fills reminder_lead_days and recurrence based on item_type defaults table,
          both fields remain editable, tracked_items row created on submit

[ ] Document upload on tracked item
    VERIFY: On add or edit form, upload a photo or PDF (e.g. insurance card)
    PASS: File uploads to tracked-item-attachments bucket, attachment path saved to attachments array,
          thumbnail/paperclip shown on the item card same pattern as life story attachments

[ ] Prescription items migrated from Phase 50a logic
    VERIFY: Existing prescription refill detection from Aria calls now creates/updates tracked_items
            rows with item_type='prescription' instead of the old standalone refill table
    PASS: Refill intent detected in call transcript creates or updates a tracked_items row

[ ] Aria proactive reminder in calls
    VERIFY: Set a tracked item's date so today = expiration_date minus reminder_lead_days, trigger
            the daily automation cron
    PASS: Item flagged for next Aria call; call prompt includes natural mention:
          renewal phrasing "I wanted to remind you that your [item_name] is coming up on [date]" or
          appointment phrasing "I wanted to remind you about your appointment with [item_name] on [date]"

[ ] Member response options work
    VERIFY: From the reminder (dashboard card or post-call notification), test each action:
    PASS: "Remind me again in a week" → snoozed_until set, last_reminded_at reset
    PASS: "Help me renew this" → navigator task created with item_name, date, renewal_contact_info,
          and any attachments referenced
    PASS: "I already took care of it" on a recurring item → expiration_or_appointment_date advances by
          recurrence_cycle_days, status stays active
    PASS: "I already took care of it" on a one-time item (passport) → status set to completed
    PASS: "Reschedule" (appointments only) → opens date picker, navigator notified of new date
    PASS: "Cancel" (appointments only) → status set to cancelled, navigator notified, removed from upcoming list

[ ] Navigator action panel shows tracked items
    VERIFY: Open member detail panel in navigator console
    PASS: "Important Dates" section shows all active tracked_items sorted soonest-first;
          "Help me renew this" requests appear as navigator tasks with full item context;
          navigator can mark task complete with resolution notes

[ ] Family dashboard upcoming items card
    VERIFY: Family dashboard shows tracked items card
    PASS: Card lists upcoming items sorted by date, color-coded by urgency, click-through to detail

[ ] Recurring vs one-time logic correct
    VERIFY: Mark a car_registration item complete
    PASS: New expiration_or_appointment_date = old date + 365 days (recurrence_cycle_days)
    VERIFY: Mark a passport item complete
    PASS: status = completed, no new date calculated (is_recurring = false)

[ ] Configurable reminder lead time
    VERIFY: Edit an item and change reminder_lead_days from default
    PASS: Custom value saved and used for future reminder calculations, overriding the item_type default

[ ] npx tsc --noEmit passes
```

**Build instructions:**

Important Dates page (`/app/dashboard/important-dates/page.tsx`):
- Two sections: "Renewals & Subscriptions" and "Appointments" (filtered by `category`)
- Each item card shows: icon (by item_type), item_name, date, days-until countdown, urgency color, attachment indicator if present
- "Add important date" button opens a form modal with item_type dropdown (pre-fills defaults), item_name, date picker, reminder lead days (editable), recurrence toggle + cycle length (editable), contact info field, file upload zone
- Click any item to expand: full details, attachments (view/download), action buttons appropriate to category and status

Daily automation cron extension (existing Phase 50e automation cron):
- Add `checkTrackedItemReminders()` function — queries tracked_items where `status='active'` and `expiration_or_appointment_date - reminder_lead_days <= today` and `(last_reminded_at IS NULL OR last_reminded_at < today - interval matching reminder cadence)`
- For appointments with date within 7 days, also check if 7-day reminder hasn't fired and item is far enough out to need both reminders
- Updates `last_reminded_at`, queues item context for next Aria call prompt, pushes family dashboard notification

Aria call prompt injection: same pattern as Family Events (Phase 50d) — add flagged tracked_items to the call context so Aria can mention naturally, never robotically reading a list.

Replace all Phase 50a Prescription Refill Management UI and logic with the generalized tracked_items system using item_type='prescription' — do not maintain two parallel systems.

---

### PHASE 50 — Services Dashboard Integration

**Checklist:**
```
PHASE 50 CHECKLIST
[ ] Family dashboard shows upcoming services
    VERIFY: Create service bookings, reload family dashboard
    PASS: "Upcoming services" section shows transport, meals, companion bookings

[ ] Family dashboard shows service history
    VERIFY: Mark some bookings complete, check dashboard
    PASS: Past services accessible from history view

[ ] Navigator console shows all member bookings
    VERIFY: Log in as navigator, open member detail panel
    PASS: All service bookings visible with status badges

[ ] npx tsc --noEmit passes
```

---

## ═══ M18 — ENTERPRISE ═══

### PHASE 51 — Outcomes Dashboard

**Checklist:**
```
PHASE 51 CHECKLIST
[ ] /outcomes — real page replaces placeholder
    VERIFY: Navigate to /outcomes (no login required)
    PASS: Public outcomes page shows aggregate anonymised platform stats

[ ] Stats displayed correctly
    VERIFY: Check stat calculations against Supabase data
    PASS: Total members, average check-in completion rate, active alerts this week all shown

[ ] Enterprise reporting at /admin/outcomes
    VERIFY: Log in as admin, navigate to /admin/outcomes
    PASS: Per-employer charts and date range picker visible (placeholder data)

[ ] npx tsc --noEmit passes
```

---

### PHASE 52 — University Partnership Portal (Full)

**Builds on Phase 32 (student volunteer preview). Adds:**

- University admin portal at `/university-admin/page.tsx`
- Semester CSV export of student hours
- Official service record PDF generation
- University account management

**Checklist:**
```
PHASE 52 CHECKLIST
[ ] /university-admin page exists and is role-protected
    VERIFY: Log in as university_admin role, navigate to /university-admin
    PASS: University admin portal loads with student roster

[ ] Service record PDF downloads correctly
    VERIFY: Generate PDF for a student with logged visits
    PASS: PDF contains student name, university, visit dates, hours, total

[ ] Semester CSV export works
    VERIFY: Click "Export semester hours"
    PASS: CSV downloads with all student hours for the semester

[ ] npx tsc --noEmit passes
```

---

### PHASE 53 — Employer Portal Full Build

**Builds on Phase 38 (employer MVP). Adds:**

- Full employer admin dashboard with utilisation reporting
- Employee invitation flow with tokenised links
- Employer billing integration (PEPM pricing)

**Checklist:**
```
PHASE 53 CHECKLIST
[ ] Employer admin portal shows real utilisation data
    VERIFY: Log in as employer_admin, navigate to /employer-admin
    PASS: Seats used/purchased, check-in count, alert summary visible

[ ] Employee invitation flow works
    VERIFY: Admin sends invitation to a test email
    PASS: Invitation email sent (stub), unique token link generated

[ ] Employee accepts invitation and signs up
    VERIFY: Visit invitation link, complete signup
    PASS: New user linked to employer account automatically

[ ] npx tsc --noEmit passes
```

---

### PHASE 54 — Medicare Advantage Reporting API

**Checklist:**
```
PHASE 54 CHECKLIST
[ ] /api/enterprise/outcomes endpoint exists
    VERIFY: GET /api/enterprise/outcomes with valid partner API key
    PASS: Returns aggregated metrics JSON — never individual-level data

[ ] Minimum cohort size enforced
    VERIFY: Request data for employer with fewer than 10 members
    PASS: Data suppressed with message "Cohort too small to report"

[ ] API access logged
    VERIFY: Make authenticated request, check audit_log
    PASS: Access log entry created

[ ] Rate limiting works
    VERIFY: Make 101 requests with same API key
    PASS: 101st request returns 429

[ ] npx tsc --noEmit passes
```

---

### PHASE 55 — Full Multilingual UI

**Checklist:**
```
PHASE 55 CHECKLIST
[ ] next-intl installed and configured
    VERIFY: npm run build passes with i18n config
    PASS: Zero build errors

[ ] Spanish translation file complete for priority pages
    VERIFY: Set browser language to Spanish, navigate to /onboarding
    PASS: Onboarding form renders in Spanish

[ ] Health-critical strings reviewed by native speaker
    VERIFY: Human review required — cannot be automated
    PASS: Native Spanish speaker confirms accuracy of health-related strings

[ ] No untranslated string keys visible
    VERIFY: Browse all pages in Spanish
    PASS: No raw translation keys (e.g. "onboarding.step1.title") visible anywhere

[ ] npx tsc --noEmit passes
```

Priority languages: Spanish first, then Mandarin, Vietnamese, Tagalog.

---


---

## NEW PHASES (Added June 2026)

### PHASE 50a — Prescription Refill Management
Detect refill intent in Aria calls ("running low", "almost out"). 28-day cycle prediction. Refill coordination in /dashboard/services. Navigator refill panel. Stub pharmacy integration.

### PHASE 50b — Gift Sending Platform
Gift intent detection in calls → family notification. Gift marketplace: Flowers, Food, Gift Cards, Physical Cards, Gift Baskets. 15% platform commission. Stub: 1-800-Flowers, Goldbelly, Amazon.

### PHASE 50c — Family-Initiated Celebrations
Special occasion requests from /dashboard/celebrations. Three tiers: Digital (free), Enhanced ($25), Premier ($75). Personalized Aria calls using life story. Family coordination room.

### PHASE 50d — Family Events Calendar & Senior Gift-Giving
family_events table (birthdays, anniversaries, graduations, travel, parties, holidays, new babies). Aria mentions upcoming family events 7 days before. Senior sends gift/card via platform. Celebration notes (free). Family travel awareness in Aria tone.

### PHASE 50e — Platform Automations (17 rules)
Health: prescription refill prediction, doctor appointment reminder, vaccination reminders, isolation detection.
Safety: extreme weather alerts, seasonal home safety checks, fall risk flag.
Social: volunteer re-engagement, event no-show follow-up, benefits renewal reminder.
Administrative: subscription value summary, inactive family nudge, onboarding completion reminder, navigator caseload warning.
Services: transport follow-up, tech help success check, meal delivery feedback.
Global: max 2 notifications/day/family, family opt-out per member.

### PHASE 50f — Geographic Chapter System
metro_areas table with 10 seeded US metros. Member auto-assigned by zip code. Volunteer matching: same chapter +30pts, same state +15pts. "Near you" badge on local events. Chapter activates at 50+ members. /chapter/[slug] landing page. Rural members get full virtual service.

### PHASE 50g — Member Safety & Fraud Protection
Age: 65+ soft verification via DOB — no ID upload. Background checks for volunteers/companions/navigators ONLY — never for members. Aria detects: gift card requests, new friend money, tech support scams, lottery scams, romance scams. Large purchase notification >$50. New vendor contact alerts. fraud_flags table. Report button. Community guidelines acknowledgment (3 bullet points, single tap).

### PHASE 50h — Three-Layer Social Connection
Layer 1: Circle posts with auto-redact of contact info.
Layer 2: Friend requests (circle/event members only), private messaging inside platform, contact info auto-redacted, money request scanning, report button.
Layer 3: Navigator-facilitated introductions with AI matching.
Deferred: public community feed, full social graph — Year 2 only.

### PHASES 33a–33f — Human Buddy Programme (insert after Phase 33, before Phase 34)

**Phase placement:** These phases insert between Phase 33 (Volunteer Portal Dashboard) and Phase 34 (Grief Support). All depend on volunteer portal tables from Phase 31 and 33.

**Correct plan mapping (from Strategy v4):**
- Basics $19: No assigned buddy — general volunteer pool only
- Connect $39: Assigned volunteer buddy — weekly calls
- Complete $69: Assigned volunteer buddy — weekly calls
- Premier $129: Assigned buddy — bi-weekly + priority matching (within 48 hrs)

**Phase 33a — Buddy database layer:**
buddy_assignments table (full schema from Buddy Build Spec): id, member_id, volunteer_id, assigned_at, status (active/paused/ending/ended), call_frequency (weekly/biweekly), preferred_call_day, preferred_call_time, match_score, match_reasons (jsonb), navigator_notes, ended_at, end_reason, transition_buddy_id (FK for handoff), created_at.
buddy_calls table: id, assignment_id, member_id, volunteer_id, scheduled_at, started_at, duration_minutes, call_quality (1-5), buddy_notes (text — navigator-only), family_note (text — shared with family, optional), concern_flag (boolean), concern_description (text — navigator-only, NEVER shown to family), milestone_flag (boolean), milestone_description, aria_brief_shown, aria_context_snapshot (jsonb), created_at.
Add to volunteers table: buddy_capacity (int default 3), buddy_active_count (int default 0), buddy_preferences (jsonb), buddy_bio (text).
Add to members table: buddy_match_topics (text[]), buddy_match_era (text), buddy_call_length_preference (text), buddy_intro_note (text), has_active_buddy (boolean default false).
RLS: concern_description is navigator-only — family can NEVER see it. Family sees buddy_notes, family_note, milestone fields only.
Data functions at /lib/data/buddies.ts: getActiveBuddyAssignment, getBuddyAssignments, createBuddyAssignment, endBuddyAssignment, getBuddyCalls, createBuddyCall, getUnacknowledgedConcernFlags, generateAriaBrief (calls Claude API claude-sonnet-4-20250514, max 200 tokens, warm 2-3 sentence pre-call brief).

**Phase 33b — Buddy assignment system + admin matching UI:** /app/admin/buddy-matching with unmatched Connect+ members on left, top 5 scored volunteers on right. Score: +20 same city, +15 per shared interest (max 45), +20 language match, +10 availability, -10 if at buddy_capacity. Confirm match → creates assignment, intro emails to buddy and family, increments buddy_active_count, sets has_active_buddy=true.

**Phase 33c — Buddy portal (volunteer dashboard additions):** "My Buddies" section with "Prepare for call" (shows Aria brief) and "Log a call" form. Concern flag → creates navigator task. Milestone marking → family dashboard highlight. Graceful ending: status "ending" before "ended", two-call handoff with transition_buddy_id.

**Phase 33d — Navigator buddy management tools:** Buddy tab in navigator console with concern flag queue, assignment overview, unmatched members queue, buddy roster.

**Phase 33e — Family dashboard buddy section:** Shows when has_active_buddy=true AND plan Connect+. Shows buddy name, last call, next scheduled, buddy_notes, family_note highlighted separately, milestone moments. Locked state on Basics with upgrade prompt. Never shows concern_description.

**Phase 33f — Onboarding buddy matching questions:** 5 questions in Step 2, conditional on Connect+ plan selection: (1) topics senior enjoys (multi-select max 3), (2) era for reminiscing (single select), (3) call length preference, (4) anything buddy should know (free text, optional), (5) buddy preferences (free text, optional). Not required — skip and proceed.

**Critical boundary rule (enforce in UX and volunteer agreement):** A buddy who hears something concerning logs it and flags it. The buddy's job is the relationship. The navigator's job is the response. This boundary must be trained, documented, and enforced.

### PHASE 56 — School Partner Portal
/school-admin for K-12 and universities. Parental consent for minors. Semester CSV export (x2VOL, Track it Forward formats). Bulk student enrollment. Service record PDF generation.

### PHASE 57 — VSO / Veteran Network Portal
/vso-admin for VSO chapters. VA benefits navigation volunteer track. Veteran member identification. VAVS export stub.

### PHASE 58 — Nonprofit Partner Portal
/nonprofit-admin. Grant-ready impact report PDF. Corporate volunteer program tracking. Community partner directory in services page.

---

## ═══ M19 — CARE INDUSTRY PARTNERSHIPS ═══

### PHASE 59 — Home Care Agency Portal
care_agencies, care_workers, care_visits, referrals tables. /agency-admin with client roster and care worker roster. Mobile-friendly care worker check-in/check-out. Billable hours report. ClearCare/AlayaCare/WellSky stub buttons.

### PHASE 60 — White Label / Co-branding
brand_configs table. Agency logo and color customization. Family dashboard shows "Agency Name, Powered by ThriveAtHome" — ThriveAtHome never invisible. /agency-admin/branding page.

### PHASE 61 — Clinical Documentation
soap_notes and care_plan_versions tables. SOAP note form in navigator with sign-and-lock. Care plan versioning. Medicare billing code suggestions. Clinical export.

### PHASE 62 — Multi-location Management
agency_locations table. Parent agency with child locations. Location selector with per-location and aggregate metrics.

---

## ═══ M20 — COMMUNITY ORGANIZATION PORTAL (DEFERRED) ═══

> **⏸ DEFERRED — Do not build until explicitly instructed.**
> Build M19 first. Only begin M20 when a confirmed village network, AAA, or senior center prospect is identified.

### PHASE 63 — Village / Community Organization Portal
member_needs bulletin board. Annual membership dues + sliding scale. org_programs table for aggregate program tracking.

### PHASE 64 — Area Agency on Aging Portal
Multi-county management. Title III service category tracking. NAPIS export. OAA compliance fields.

### PHASE 65 — Senior Center Portal
Drop-in attendance. Activity calendar and room booking. Congregate meal tracking.

### PHASE 66 — Network Federation
Parent network account (VtVN, n4a). Aggregate national reporting. Anonymized benchmarking. Network dues billing.

---

## M13–M18 COMPLETION

When Phase 55 is approved, add to `progress.md`:

```
M13-M18 COMPLETE — ALL ADVANCED FEATURE PHASES APPROVED
Platform is feature-complete across all 5 spec layers.
Remaining deferred items:
- M8 AI Calls (activate with RETELL_API_KEY + TWILIO credentials)
- M9 Concierge Line (activate with second Twilio number)
- M10 Live SMS/Email (activate with SENDGRID_API_KEY + TWILIO credentials)
- Physical goods fulfillment (Artifact Uprising, 1-800-Flowers — Phase 39)
- Stripe Connect for companion payouts (Phase 48)
- Lyft Healthcare, Instacart, Teladoc integrations (Phase 45-47)
- Full multilingual UI beyond Spanish (Phase 55)
```

---

## ENVIRONMENT VARIABLES NEEDED FOR M13–M18

Most of M13–M18 is free to build — new tables, new pages, new logic. The only new paid services:

```bash
# M17 Services Marketplace — activate real providers when ready
LYFT_HEALTHCARE_API_KEY=       # Commercial agreement with Lyft Healthcare required
INSTACART_API_KEY=             # Instacart developer program
TELADOC_API_KEY=               # Teladoc partnership agreement
ARTIFACT_UPRISING_API_KEY=     # Artifact Uprising developer API (Phase 39 physical goods)
ONE800FLOWERS_API_KEY=         # 1-800-Flowers developer API (Phase 39)

# M18 Enterprise
# No new API keys — uses existing Stripe and Supabase
```

All other M13–M18 features use existing infrastructure (Supabase, Realtime, stub providers).
