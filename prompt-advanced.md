# ThriveAtHome — Advanced Features Build Prompt (v1.0)
# M13–M18: Volunteer Network, Cultural Circles, Services Marketplace, Grief Support, Celebrations, Enterprise

> **Read this entire file before writing a single line of code.**
> The agentic loop protocol from prompt.md Section 1 applies here exactly as before.
> One phase at a time. Human approval before every phase transition.
> BLOCKED after 3 failed hypotheses.
> All service interfaces and stubs from V1 are already in place.

---

## STRATEGIC VISION

**ThriveAtHome is a consumer brand first.** Families trust ThriveAtHome. Partners use ThriveAtHome. The brand always belongs to ThriveAtHome.

### Brand Strategy
- **Own the consumer relationship end-to-end** — families subscribe to ThriveAtHome directly, not through an agency
- **B2B partners amplify, never own** — employers, agencies, and health plans bring members TO ThriveAtHome, but the family's loyalty stays with the ThriveAtHome brand
- **White-label is available but controlled** — agencies can co-brand the platform (Phase 60) but ThriveAtHome is always credited as "Powered by ThriveAtHome"
- **Never white-label to direct competitors** — no company offering the same senior care AI service can license the platform to compete against ThriveAtHome under their own brand

### Launch Sequence (aligned with brand vision)
1. **Months 1–3:** 20 real families, manually enrolled, no charge or $1/mo — learn what actually matters
2. **Months 4–6:** Charge real prices, get to $3K–$10K MRR, collect testimonials
3. **Months 7–12:** First employer pilot, local senior center partnerships, press outreach
4. **Year 2:** First employer contract, first Medicare Advantage conversation, hire first navigator
5. **Year 3:** Medicare Advantage contract signed, 10+ employer clients, consider Series A

### B2B Model (agencies use ThriveAtHome, families trust ThriveAtHome)
B2B partners are channels that bring families to ThriveAtHome — they do NOT own the member relationship.
The distinction: **agencies use ThriveAtHome. Families trust ThriveAtHome.**

---

## SCOPE AND BUILD ORDER

Build order is prioritised by consumer value first, then B2B enablement:

| Milestone | Phases | Delivers | Brand Impact |
|-----------|--------|---------|-------------|
| M13 — Volunteer Network | 29–33 | Human connection layer — what makes ThriveAtHome irreplaceable | High — drives retention and word of mouth |
| M14 — Community Features | 34–38 | Cultural circles, events, skill exchange, benefits finder | High — community drives long-term engagement |
| M15 — Celebrations & Life Story | 39–41 | Emotional depth — Memory Book, birthday arcs, life archive | Very High — most emotionally sticky features |
| M16 — Grief & Transitions | 42–44 | Grief circles, life transition support, professional referrals | High — builds trust in hardest moments |
| M17 — Services Marketplace | 45–50 | Practical daily utility — transport, meals, tech, health, legal | High — makes platform practically essential |
| M18 — Enterprise | 51–55 | Employer portal, outcomes dashboard, Medicare Advantage API | Revenue — B2B channels that amplify consumer growth |
| M19 — Care Industry | 59–62 | Agency portal, white-label, clinical docs, multi-location | Revenue — agencies bring members to ThriveAtHome |
| M20 — Community Orgs | 63–66 | Villages, AAAs, senior centers, network federation (DEFERRED) | Revenue — mission-aligned orgs refer members |

---

## ARCHITECTURE NOTES

**No new service interfaces needed** — all 8 interfaces from V1 cover the services in M13–M18. `TransportProvider`, `MealProvider`, and `GoodsProvider` are already stubbed and ready.

**New database tables** are created via Supabase SQL Editor migrations. Always write the full SQL before running anything.

**New placeholder pages** — any route not in the current app needs a placeholder first, then the real page. Check `/app/` before creating new routes.

**Realtime** — use the existing `push-notification` Edge Function for all new notification types. The `notif_type` enum already includes `volunteer_matched`, `celebration_upcoming`, and `grief_support_assigned`.

**Brand integrity rule** — every page, notification, email, and PDF must display the ThriveAtHome brand. When building B2B portals (employer, agency, university, nonprofit): the portal is "powered by ThriveAtHome" — never invisible. Family-facing pages always show ThriveAtHome branding even when a partner has co-branding configured (Phase 60). The only exception is the white-label option in Phase 60 where agencies pay for co-branding rights.

**B2B portals are admin tools, not consumer products** — employer portals, agency portals, and university portals are for staff/admin users only. Seniors and their families always use the standard ThriveAtHome consumer interface. Never build a separate "agency version" of the family dashboard — there is one family dashboard, one consumer brand, one product.

**Member ownership** — every member record belongs to ThriveAtHome, not to the referring agency or employer. If an agency stops using ThriveAtHome, their members' accounts remain active and the family relationship continues. Contracts must reflect this.

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
         Headline: "Give your caregiving employees the peace of mind they deserve"
         Clear message: employees get ThriveAtHome subscriptions — the ThriveAtHome brand,
         not a generic "employee benefit platform"

[ ] Demo request form submits
    VERIFY: Fill in and submit demo request form
    PASS: employer_leads row created, sales team notified via stub email

[ ] /employer-admin page exists (placeholder for now)
    VERIFY: Navigate to /employer-admin
    PASS: Coming soon with "Contact us to set up your employer account"

[ ] Brand integrity: employer landing page always references ThriveAtHome by name
    VERIFY: Check /employers page for brand references
    PASS: Page clearly states employees will receive ThriveAtHome subscriptions —
          never described as a white-label or generic benefit tool

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
1. 🚗 Transport — rides to appointments, errands, social outings
2. 🏠 Home Services — cleaning, maintenance, safety assessments
3. 🥗 Meals & Nutrition — meal delivery, grocery help, cooking groups
4. 🏥 Health Services — telehealth, medication management, mental health
5. ⚖️ Legal & Financial — vetted advisor directory, document vault
6. 💻 Tech Help — phone and in-home tech support

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

### PHASE 50a — Prescription Refill Management

**What this builds:** Automated prescription refill detection and coordination — one of the most practically valuable automations for seniors who may forget to reorder medications.

**Checklist:**
```
PHASE 50a CHECKLIST
[ ] Refill intent detection in call transcript processing
    VERIFY: Process transcript containing "running low on my medication" or "almost out of pills"
    PASS: medication_supply alert created with severity 'concern', navigator task created

[ ] 28-day refill cycle prediction
    VERIFY: Member with diabetes medication flagged, trigger prediction cron
    PASS: If last refill mention was 23+ days ago, informational alert created: "Margaret may need a Metformin refill soon"

[ ] Refill section in /dashboard/services
    VERIFY: Navigate to /dashboard/services → Medication & Refills section
    PASS: Shows current medications from member profile, last refill flag date, "Request refill coordination" button

[ ] Navigator refill coordination panel
    VERIFY: Open member detail panel in navigator console
    PASS: Medications section shows current meds, last refill flag, "Coordinate refill" button that creates task and notifies family

[ ] Pharmacy stub integration
    VERIFY: Click "Coordinate refill" for a medication
    PASS: Logs [STUB][Pharmacy] Would initiate refill for [medication] for member [id]

[ ] npx tsc --noEmit passes
```

---

### PHASE 50b — Gift Sending Platform

**What this builds:** A way for seniors to send gifts to family members, coordinated through the platform — one of the most emotionally meaningful features for senior dignity and connection.

**New table (`/supabase/migrations/028_gifts.sql`):**
```sql
CREATE TABLE gift_orders (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  occasion          text NOT NULL,
  recipient_name    text NOT NULL,
  gift_type         text NOT NULL,
  -- flowers, food, gift_card, physical_card, celebration_note, gift_basket
  gift_details      jsonb NOT NULL DEFAULT '{}',
  amount_cents      int,
  platform_fee_cents int,
  status            text NOT NULL DEFAULT 'pending',
  -- pending, processing, shipped, delivered, cancelled
  tracking_info     text,
  ordered_by        uuid REFERENCES family_members(id),
  created_from      text NOT NULL DEFAULT 'family_dashboard'
  -- family_dashboard, aria_intent, navigator
);
ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 50b CHECKLIST
[ ] Gift intent detection in call processing
    VERIFY: Process transcript containing "I want to send my daughter flowers for her birthday"
    PASS: gift_intent flag created, navigator task created, family notification pushed:
          "Margaret mentioned wanting to send a gift — would you like to help arrange this?"

[ ] Gift marketplace in /dashboard
    VERIFY: Navigate to /dashboard → "Send a gift" section
    PASS: 5 gift categories visible: Flowers & Plants, Food & Treats, Gift Cards,
          Handwritten Card, Celebration Note

[ ] Gift order creates correctly
    VERIFY: Select Flowers, choose amount, enter recipient name, submit
    PASS: gift_orders row created, stub logs [STUB][Goods] Would order flowers for [recipient]

[ ] Physical card flow
    VERIFY: Select Handwritten Card, type message, submit
    PASS: Order created at $4.99, stub logs [STUB][Goods] Would print and mail card to [address]

[ ] Celebration note (free)
    VERIFY: Select Celebration Note, type message
    PASS: Digital message generated as shareable link or downloadable PDF, no charge

[ ] Platform commission tracked
    VERIFY: Check gift_orders row after flower order
    PASS: platform_fee_cents = amount_cents * 0.15

[ ] Delivery tracking on dashboard
    VERIFY: After gift order, check family dashboard
    PASS: "Gift to Emma — In transit" visible in a gifts section

[ ] npx tsc --noEmit passes
```

---

### PHASE 50c — Family-Initiated Celebrations

**What this builds:** Family members can request special occasion celebrations for their senior, with three service tiers handled by platform staff.

**Checklist:**
```
PHASE 50c CHECKLIST
[ ] Special occasion request form on /dashboard/celebrations
    VERIFY: Navigate to /dashboard/celebrations → "Plan a special occasion"
    PASS: Form shows occasion types: Birthday, Anniversary, Homecoming, Recovery Milestone, Holiday

[ ] Three coordination tiers displayed clearly
    VERIFY: Select Birthday occasion
    PASS: Three options shown with pricing:
          Digital (free): Special personalized Aria call + digital family card
          Enhanced ($25): Digital + volunteer visit + gift coordination
          Premier ($75): Enhanced + video family gathering + physical memory book

[ ] Digital tier — personalized Aria call
    VERIFY: Book Digital tier for Margaret's birthday
    PASS: Special call scheduled, Aria prompt updated to reference life story entries:
          "I heard you loved dancing at the Palomar Ballroom — what a wonderful life, Margaret. Happy 80th birthday!"

[ ] Family coordination room
    VERIFY: Enhanced or Premier tier booked
    PASS: All linked family members see coordination room: contribute messages, coordinate visits, collectively fund gift

[ ] Stripe payment for Enhanced and Premier
    VERIFY: Book Enhanced tier, complete payment
    PASS: $25 Stripe payment processed, navigator task created for logistics

[ ] Navigator receives logistics task
    VERIFY: Book Premier tier
    PASS: Navigator sees task: "Coordinate Premier celebration for Margaret — [date]. Arrange: volunteer visit, video gathering, memory book."

[ ] npx tsc --noEmit passes
```

---

### PHASE 50d — Family Events Calendar & Senior Gift-Giving

**What this builds:** A family events calendar so Aria knows about upcoming family occasions and can remind seniors — and help them send gifts or cards.

**New table (`/supabase/migrations/029_family_events.sql`):**
```sql
CREATE TABLE family_events (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  member_id               uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by              uuid REFERENCES family_members(id),
  event_title             text NOT NULL,
  event_date              date NOT NULL,
  event_type              text NOT NULL DEFAULT 'other',
  -- birthday, anniversary, graduation, travel, party, holiday, new_baby, wedding, other
  person_name             text NOT NULL,
  notes                   text,
  remind_senior_days_before int NOT NULL DEFAULT 7,
  reminder_sent_at        timestamptz,
  is_recurring            boolean NOT NULL DEFAULT false,
  recurrence_pattern      text
  -- annual (for birthdays, anniversaries)
);
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_events" ON family_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = family_events.member_id
    AND fm.supabase_auth_id = auth.uid()
  ));
```

**Checklist:**
```
PHASE 50d CHECKLIST
[ ] Migration 029_family_events.sql runs without errors
    VERIFY: family_events table visible in Supabase
    PASS: Table present

[ ] Family events calendar tab on /dashboard/family
    VERIFY: Navigate to /dashboard/family → Events tab
    PASS: Calendar view shows upcoming family events with add/edit/delete

[ ] Add a family event
    VERIFY: Add "Emma's 16th Birthday" on June 15, recurring annual
    PASS: family_events row created with event_type='birthday', is_recurring=true

[ ] Aria mentions event in check-in call (7 days before)
    VERIFY: Set event date to 7 days from today, trigger celebrations cron
    PASS: Call prompt for next check-in updated to include: "I wanted to remind you that Emma's 16th birthday is coming up Saturday — would you like to send her something special?"

[ ] Gift prompt shown on family dashboard
    VERIFY: 7 days before family event, reload dashboard
    PASS: Gentle prompt visible: "Emma's birthday is in 7 days — help Margaret send something special" with "Send a gift" button

[ ] Travel awareness adjusts Aria tone
    VERIFY: Add family event type='travel' for family member, trigger cron
    PASS: Aria call prompt updated to include awareness that [family member] is traveling

[ ] New baby congratulations
    VERIFY: Add event type='new_baby'
    PASS: Aria call includes congratulations: "Congratulations on the new arrival! How does it feel to be a great-grandmother?"

[ ] Recurring events auto-advance annually
    VERIFY: Check that annual events roll forward after their date passes
    PASS: Next year's date automatically calculated for is_recurring=true events

[ ] npx tsc --noEmit passes
```

---

### PHASE 50e — Platform Automations

**What this builds:** 17 automated detection and notification rules that make the platform proactively helpful — reducing manual work for navigators and keeping families informed without them having to check constantly.

**Checklist:**
```
PHASE 50e CHECKLIST
[ ] Health: Isolation detection cron
    VERIFY: Insert 7 consecutive call records with no social contact mentions
    PASS: Navigator task created "Margaret has not mentioned social contact in 7 days"
          Informational alert on family dashboard

[ ] Health: Vaccination reminder
    VERIFY: Trigger cron in October for a member aged 70+
    PASS: Family dashboard shows "Time for Margaret's annual flu shot"

[ ] Health: Doctor appointment reminder
    VERIFY: Member with diabetes_in_health_conditions, no appointment mention in 90 days
    PASS: Navigator task created "Schedule wellness check for Margaret — no appointment mentioned in 90 days"

[ ] Safety: Extreme weather alert
    VERIFY: Stub weather check returns heat index >100F for member's city
    PASS: Family notification sent, Aria call prompt updated to ask about staying cool

[ ] Safety: Seasonal home safety check
    VERIFY: Trigger cron on October 1 for a member with lives_alone=true
    PASS: Navigator task created "October heating safety check for Margaret"

[ ] Safety: Fall risk flag
    VERIFY: Process transcript with "feeling dizzy" for member with walker in mobility_devices
    PASS: Urgent alert created "Fall risk flag: Margaret mentioned dizziness and uses a walker"

[ ] Social: Volunteer re-engagement
    VERIFY: Set volunteer_matches row last_visit to 31 days ago
    PASS: Navigator task "Check on volunteer match — no visit logged in 30 days"

[ ] Social: Event no-show follow-up
    VERIFY: Set event_rsvps attended=false for past event
    PASS: 24 hours later notification: "We missed you at [event] — hope you are doing well"

[ ] Administrative: Subscription value summary
    VERIFY: Member with renewal_date 7 days from today
    PASS: Family email (stub): "Your month with ThriveAtHome — 28 calls, 2 alerts, 3 events"

[ ] Administrative: Inactive family nudge
    VERIFY: Set family_members.last_login_at to 31 days ago
    PASS: Email sent with recent highlights and mood summary

[ ] Administrative: Navigator caseload warning
    VERIFY: Assign 121 members to a navigator
    PASS: Admin alert "Sarah Williams approaching caseload limit (121/150)"

[ ] Services: Transport follow-up
    VERIFY: Mark medical transport booking as completed
    PASS: Next day Aria call prompt updated to ask "How did your appointment go yesterday?"

[ ] Services: Tech help success check
    VERIFY: Mark tech help visit as completed
    PASS: 3 days later Aria asks "Is your phone working better now?"

[ ] Global: Max 2 notifications per family per day enforced
    VERIFY: Trigger 5 automations for same family member on same day
    PASS: Only 2 notifications sent, others queued for next day

[ ] Global: Family opt-out respected
    VERIFY: Set automation_opt_out for a member, trigger automation
    PASS: No notification sent for that member

[ ] npx tsc --noEmit passes
```

---

### PHASE 50f — Geographic Chapter System

**What this builds:** The hybrid chapter model — a national open platform with soft local chapters. Members can enroll anywhere and get full virtual service immediately. Behind the scenes they are grouped into metro areas. When a metro reaches 50+ active members it becomes an official ThriveAtHome Chapter with a local coordinator, local events, and a local volunteer pool.

**New tables (`/supabase/migrations/030_chapters.sql`):**

```sql
CREATE TABLE metro_areas (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  chapter_name          text NOT NULL,
  -- e.g. "ThriveAtHome Bay Area", "ThriveAtHome Chicago"
  city                  text NOT NULL,
  state                 text NOT NULL,
  zip_prefixes          text[] NOT NULL DEFAULT '{}',
  -- Array of zip code prefixes that belong to this metro
  -- e.g. ARRAY['940','941','942','943','944'] for Bay Area
  is_active_chapter     boolean NOT NULL DEFAULT false,
  -- true when 50+ active members
  active_member_count   int NOT NULL DEFAULT 0,
  chapter_coordinator_id uuid REFERENCES care_navigators(id),
  chapter_slug          text UNIQUE,
  -- e.g. 'bay-area', 'chicago', 'new-york'
  launched_at           timestamptz
);

-- Add chapter assignment to members
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS metro_area_id uuid REFERENCES metro_areas(id),
  ADD COLUMN IF NOT EXISTS metro_area_name text;

-- Seed initial metro areas
INSERT INTO metro_areas (chapter_name, city, state, zip_prefixes, chapter_slug) VALUES
('ThriveAtHome Bay Area', 'San Francisco', 'CA', ARRAY['940','941','942','943','944','945','946','947','948','949'], 'bay-area'),
('ThriveAtHome Los Angeles', 'Los Angeles', 'CA', ARRAY['900','901','902','903','904','905','906','907','908','910','911','912','913','914','915','916','917','918'], 'los-angeles'),
('ThriveAtHome Chicago', 'Chicago', 'IL', ARRAY['600','601','602','603','604','605','606','607','608'], 'chicago'),
('ThriveAtHome New York', 'New York', 'NY', ARRAY['100','101','102','103','104','110','111','112','113','114','115','116','117','118','119'], 'new-york'),
('ThriveAtHome Houston', 'Houston', 'TX', ARRAY['770','771','772','773','774','775','776','777'], 'houston'),
('ThriveAtHome Phoenix', 'Phoenix', 'AZ', ARRAY['850','851','852','853','854','855','856','857'], 'phoenix'),
('ThriveAtHome Philadelphia', 'Philadelphia', 'PA', ARRAY['190','191','192','193','194'], 'philadelphia'),
('ThriveAtHome San Antonio', 'San Antonio', 'TX', ARRAY['782','783','784','785'], 'san-antonio'),
('ThriveAtHome Dallas', 'Dallas', 'TX', ARRAY['750','751','752','753','754','755','756','757','758'], 'dallas'),
('ThriveAtHome Seattle', 'Seattle', 'WA', ARRAY['980','981','982','983','984','985'], 'seattle');
```

**Checklist:**
```
PHASE 50f CHECKLIST
[ ] Migration 030_chapters.sql runs without errors
    VERIFY: metro_areas table visible in Supabase with 10 seeded metro areas
    PASS: All 10 rows present, members table has metro_area_id and metro_area_name columns

[ ] Member auto-assigned to metro area on enrollment
    VERIFY: Enroll a test member with zip code 94403 (San Mateo, CA)
    PASS: member.metro_area_id = Bay Area metro UUID, metro_area_name = "ThriveAtHome Bay Area"

[ ] Members with no matching metro area still enroll successfully
    VERIFY: Enroll a test member with zip code 59001 (rural Montana)
    PASS: member.metro_area_id = null, metro_area_name = "ThriveAtHome National" — no error

[ ] Volunteer matching prioritizes same chapter
    VERIFY: Run matching for Bay Area member with Bay Area and Chicago volunteers
    PASS: Bay Area volunteer scores 30 points higher than Chicago volunteer (same chapter bonus)

[ ] Events show "Near you" badge for local chapter events
    VERIFY: Create event tagged to Bay Area chapter, log in as Bay Area family member
    PASS: Event shows "Near you" badge, appears above national virtual events

[ ] Chapter activation at 50 members
    VERIFY: Set Bay Area metro active_member_count to 50
    PASS: Admin alert created "ThriveAtHome Bay Area has reached 50 members — ready to activate as official chapter"
         is_active_chapter automatically set to true

[ ] Chapter landing page at /chapter/[slug]
    VERIFY: Navigate to /chapter/bay-area
    PASS: Page shows: chapter name, active member count, upcoming local events, local volunteer count,
          "Join ThriveAtHome Bay Area" CTA for new families

[ ] Rural member gets full virtual service
    VERIFY: Log in as member with no metro area assigned
    PASS: Full dashboard loads, virtual events and national volunteer pool available,
         no error or degraded messaging

[ ] Navigator assigned from local chapter
    VERIFY: Enroll Bay Area member, check navigator assignment
    PASS: System suggests navigators with metro_area_id matching Bay Area first

[ ] npx tsc --noEmit passes
```

**Build instructions:**

Create a `getMetroArea(zipCode: string): MetroArea | null` function in `/lib/geo/chapters.ts`:
- Takes a zip code string
- Checks first 3 digits against all `zip_prefixes` arrays in metro_areas table
- Returns matching metro area or null for rural/unmatched

Call `getMetroArea` during member onboarding API route — set `metro_area_id` and `metro_area_name` on the new member record.

Update volunteer matching in `/lib/volunteers/match.ts`:
```ts
// Chapter proximity bonus
if (volunteer.metro_area_id && volunteer.metro_area_id === member.metro_area_id) {
  score += 30  // Same chapter
} else if (volunteer.state === member.state) {
  score += 15  // Adjacent or same state
}
```

Update events query in `/app/dashboard/events/page.tsx`:
- Add `is_near_you` boolean to each event result
- `is_near_you = true` if event has matching metro_area_id OR if event is within 25 miles of member address
- Show "📍 Near you" badge on local events
- Sort: active today → near you upcoming → virtual upcoming → other

Chapter landing page (`/app/chapter/[slug]/page.tsx`) — public, no login required:
- Fetch metro area by slug
- Show: chapter name, city, member count (if active), upcoming public events, volunteer count, "Join ThriveAtHome" CTA
- If not yet active chapter: "Coming soon to [city] — join the waitlist"

Admin chapter management (`/app/admin/chapters/page.tsx`):
- List all metro areas with member counts
- "Activate chapter" button for metros with 50+ members
- Assign chapter coordinator (from care_navigators)
- View chapter-specific metrics

---

### PHASE 50g — Member Safety & Fraud Protection

**What this builds:** Fraud detection and protection features that keep seniors safe from financial exploitation — without treating them as suspects. Plus the soft age verification approach for member enrollment.

**Philosophy:** Protect seniors FROM harm, not FROM the platform. Background checks are for volunteers and workers, never for members. Age verification is soft (DOB field) not hard (ID upload).

**New tables (`/supabase/migrations/031_fraud_protection.sql`):**

```sql
CREATE TABLE fraud_flags (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  flag_type         text NOT NULL,
  -- large_purchase, new_vendor_contact, gift_card_mention, new_friend_money,
  -- unsolicited_offer, tech_support_scam, romance_scam, lottery_scam
  flag_source       text NOT NULL,
  -- aria_call, service_booking, navigator_report, family_report
  description       text NOT NULL,
  severity          text NOT NULL DEFAULT 'informational',
  -- informational, concern, urgent
  acknowledged      boolean NOT NULL DEFAULT false,
  acknowledged_by   uuid REFERENCES family_members(id),
  acknowledged_at   timestamptz,
  navigator_notes   text
);
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_all_own_fraud_flags" ON fraud_flags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = fraud_flags.member_id
    AND fm.supabase_auth_id = auth.uid()
  ));
```

**Checklist:**
```
PHASE 50g CHECKLIST
[ ] Migration 031_fraud_protection.sql runs without errors
    VERIFY: fraud_flags table visible in Supabase
    PASS: Table present

[ ] Age verification: DOB validates 60+ at onboarding
    VERIFY: Try enrolling a senior with DOB less than 60 years ago
    PASS: Gentle message shown "ThriveAtHome is designed for adults 60 and older"
         Form does not hard-block but shows the message clearly

[ ] Age verification: family member DOB not required
    VERIFY: Sign up as a family member — no age field shown
    PASS: Family signup has no age or DOB field — not required

[ ] Aria call: gift card mention detection
    VERIFY: Process transcript containing "they asked me to buy gift cards"
    PASS: fraud_flag created with flag_type='gift_card_mention', severity='urgent'
         Family notified immediately: "Margaret mentioned someone asking her to buy gift cards — this is a common scam. Please check in with her."

[ ] Aria call: new friend money mention detection
    VERIFY: Process transcript containing "my new friend online needs money" or "someone asked me to send money"
    PASS: fraud_flag created with flag_type='new_friend_money', severity='urgent'
         Navigator task created: "Potential romance/friendship scam — follow up with Margaret immediately"

[ ] Aria call: tech support scam detection
    VERIFY: Process transcript containing "Microsoft called me" or "my computer has a virus and they need access"
    PASS: fraud_flag created with flag_type='tech_support_scam', severity='urgent'

[ ] Aria call: unsolicited offer detection
    VERIFY: Process transcript containing "I won a prize" or "they said I owe back taxes"
    PASS: fraud_flag created with flag_type='unsolicited_offer', severity='concern'

[ ] Large purchase notification to family
    VERIFY: Create service_booking with amount_cents > 5000 ($50)
    PASS: Family notification pushed: "A $75 service was booked for Margaret — tap to review"

[ ] New vendor contact alert
    VERIFY: First time a new service_provider contacts a member
    PASS: Family notification: "A new provider has been connected with Margaret — [provider name]"

[ ] Fraud flag visible on family dashboard
    VERIFY: Create test fraud_flag, reload dashboard
    PASS: Fraud flag appears in alerts panel with appropriate severity badge and plain-English description

[ ] Fraud flag visible in navigator console
    VERIFY: Log in as navigator, check member detail panel
    PASS: Fraud flags section visible with all active flags, acknowledge button

[ ] Scam education in Aria calls
    VERIFY: Check Aria system prompt for scam awareness content
    PASS: Aria system prompt includes: if member mentions winning a prize, being owed a refund,
         needing to buy gift cards, or a new online friend asking for money —
         respond warmly and gently: "That sounds like it could be a scam — I would talk to your
         family before doing anything. Would it be okay if I asked them to check in with you?"

[ ] Family fraud report button
    VERIFY: Navigate to /dashboard, find fraud/safety section
    PASS: "Report a concern" button allows family to manually flag a potential scam situation

[ ] npx tsc --noEmit passes
```

**Build instructions:**

Add fraud detection to call transcript processing in the webhook handler. Scan transcripts for:

```ts
const FRAUD_PATTERNS = {
  gift_card_mention: ['gift card', 'itunes card', 'google play card', 'buy cards', 'send cards'],
  new_friend_money: ['online friend', 'new friend', 'send money', 'wire money', 'western union', 'zelle'],
  tech_support_scam: ['microsoft called', 'apple called', 'computer virus', 'remote access', 'tech support called'],
  unsolicited_offer: ['won a prize', 'won the lottery', 'back taxes', 'owe the irs', 'lawsuit against you', 'arrest warrant'],
  romance_scam: ['met someone online', 'dating site', 'military overseas', 'needs money to come home'],
  lottery_scam: ['claim your winnings', 'processing fee', 'customs fee', 'release the money'],
}
```

For any match: create `fraud_flags` row, push urgent Realtime notification to family, create navigator task.

Large purchase notification: add to service booking creation API — if `amount_cents > 5000`, push Realtime notification to all linked family members.

Scam education section on `/dashboard/services` under Tech Help — "Protecting yourself from scams" with common scam types listed in plain English, what to do if contacted, how to report to the platform.

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

### PHASE 56 — School Partner Portal (K-12 + University)

**What this builds:** A partner portal for schools to manage their student volunteers, verify service hours, and export records for registrars — covering both K-12 community service requirements and university service-learning programs.

**New tables (`/supabase/migrations/028_school_partners.sql`):**

```sql
CREATE TABLE school_partners (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  school_name       text NOT NULL,
  school_type       text NOT NULL DEFAULT 'university', -- 'k12' or 'university'
  contact_name      text NOT NULL,
  contact_email     text NOT NULL,
  contact_phone     text,
  city              text,
  state             text,
  partnership_tier  text NOT NULL DEFAULT 'free', -- 'free', 'basic' ($5k), 'partner' ($10k), 'partner_large' ($20k)
  active_students   int NOT NULL DEFAULT 0,
  start_date        date,
  renewal_date      date,
  status            text NOT NULL DEFAULT 'active',
  requires_consent  boolean NOT NULL DEFAULT false -- true for K-12 (minor consent)
);
ALTER TABLE school_partners ENABLE ROW LEVEL SECURITY;

CREATE TABLE parental_consents (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  student_id        uuid NOT NULL REFERENCES student_volunteers(id) ON DELETE CASCADE,
  guardian_name     text NOT NULL,
  guardian_email    text NOT NULL,
  guardian_phone    text,
  consent_given     boolean NOT NULL DEFAULT false,
  consent_date      timestamptz,
  consent_method    text -- 'email', 'in_person', 'digital_signature'
);
ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 56 CHECKLIST
[ ] Migration 028_school_partners.sql runs without errors
    VERIFY: school_partners and parental_consents tables visible in Supabase
    PASS: Both tables present

[ ] /school-admin page exists and is role-protected
    VERIFY: Log in as school_admin role, navigate to /school-admin
    PASS: School admin portal loads with student roster

[ ] Student roster shows all enrolled students with hours
    VERIFY: School admin can see all student_volunteers linked to their school
    PASS: Table shows student name, hours logged, visits completed, status

[ ] Parental consent workflow for K-12
    VERIFY: Create K-12 school partner (requires_consent=true), enroll a student
    PASS: Consent request sent to guardian email (stub), student shows 'pending_consent' status until approved

[ ] Semester CSV export works
    VERIFY: Click "Export semester hours" with date range
    PASS: CSV downloads with all student names, hours, visit dates for the selected period

[ ] Official service record PDF generates
    VERIFY: Click "Generate service record" for a student with logged visits
    PASS: PDF downloads with school name, student name, total hours, visit dates, ThriveAtHome seal

[ ] Bulk student enrollment
    VERIFY: Upload a CSV of student emails from admin portal
    PASS: Students receive invitation emails (stub), accounts created with school_id linked

[ ] Integration hooks for x2VOL and Track it Forward
    VERIFY: Check /school-admin for export format options
    PASS: Export options include "x2VOL format" and "Track it Forward format" CSV downloads

[ ] npx tsc --noEmit passes
```

**Build instructions:**

School admin portal (`/app/school-admin/page.tsx`) — role: `school_admin`. Shows:
- School name and partnership tier
- Student roster table: name, enrollment date, total hours, visits, status, service record button
- Semester summary: total students, total hours, average hours per student
- Export section: date range picker + format selector (Standard CSV, x2VOL, Track it Forward)
- Bulk enrollment: CSV upload field for student emails
- Pending consents queue (for K-12 schools)

For K-12 schools (`requires_consent=true`): when a student under 18 is enrolled, automatically send a consent request email to the guardian email on file. Student shows `pending_consent` status and cannot log visits until consent is recorded.

---

### PHASE 57 — VSO / Veteran Network Portal

**What this builds:** A dedicated portal for Veterans Service Organizations (VSOs) and veteran volunteer networks to manage their chapter's volunteers, track veteran-to-veteran connections, and provide VA benefits navigation services.

**New tables (`/supabase/migrations/029_vso_partners.sql`):**

```sql
CREATE TABLE vso_partners (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  organization_name text NOT NULL,
  vso_type          text NOT NULL, -- 'VFW', 'American Legion', 'DAV', 'AMVETS', 'Other'
  chapter_number    text,
  contact_name      text NOT NULL,
  contact_email     text NOT NULL,
  contact_phone     text,
  city              text,
  state             text,
  status            text NOT NULL DEFAULT 'active'
);
ALTER TABLE vso_partners ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 57 CHECKLIST
[ ] Migration 029_vso_partners.sql runs without errors
    VERIFY: vso_partners table visible in Supabase
    PASS: Table present

[ ] /vso-admin page exists and is role-protected
    VERIFY: Log in as vso_admin role, navigate to /vso-admin
    PASS: VSO admin portal loads with chapter volunteer roster

[ ] VSO volunteer roster shows chapter volunteers
    VERIFY: VSO admin sees only volunteers linked to their VSO chapter
    PASS: Table shows volunteer name, service types, hours, veteran-to-veteran connections

[ ] Veteran member flag on volunteer application
    VERIFY: Check /volunteer/apply for veteran section
    PASS: "Are you a veteran?" toggle reveals branch, years served, VSO affiliation, discharge status fields

[ ] Veteran-to-veteran matching priority confirmed
    VERIFY: Run matching algorithm for a veteran member
    PASS: Volunteers with veteran flag score 20 points higher in matching results

[ ] VA benefits navigation volunteer track
    VERIFY: Check volunteer service_types includes 'va_benefits_navigation'
    PASS: New service type visible in volunteer application and matching

[ ] Impact report for VSO chapter
    VERIFY: VSO admin clicks "Chapter impact report"
    PASS: Report shows total volunteers, total hours, seniors connected, veteran-to-veteran pairs

[ ] VAVS integration placeholder
    VERIFY: Check /vso-admin for VAVS export option
    PASS: "Export for VAVS reporting" button present (stub — logs [STUB] Would export to VA Volunteer Service system)

[ ] npx tsc --noEmit passes
```

**Build instructions:**

VSO admin portal (`/app/vso-admin/page.tsx`) — role: `vso_admin`. Shows:
- Chapter name, VSO type, chapter number
- Volunteer roster filtered to volunteers with `vso_partner_id` matching this chapter
- Veteran-to-veteran connection pairs
- Chapter impact stats: total hours, seniors helped, veteran members connected
- VAVS export stub button
- Referral form: refer a veteran senior to ThriveAtHome from the VSO admin

Add `va_benefits_navigation` to the `visit_type` enum via migration. Add `vso_partner_id` column to `volunteers` table.

Add veteran member identification to member profiles: `is_veteran boolean`, `branch_of_service text`, `years_served text` columns on `members` table. Show in onboarding Step 3 as optional fields.

---

### PHASE 58 — Nonprofit Partner Portal

**What this builds:** A portal for nonprofit organizations, corporate volunteer programs, and community groups to manage their volunteers, track impact, and generate grant-ready reports.

**New tables (`/supabase/migrations/030_nonprofit_partners.sql`):**

```sql
CREATE TABLE nonprofit_partners (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  organization_name   text NOT NULL,
  org_type            text NOT NULL DEFAULT 'nonprofit', -- 'nonprofit', 'corporate', 'faith_based', 'community_group'
  ein_number          text, -- for 501(c)(3) orgs
  contact_name        text NOT NULL,
  contact_email       text NOT NULL,
  contact_phone       text,
  city                text,
  state               text,
  partnership_tier    text NOT NULL DEFAULT 'community', -- 'community' (free), 'partner' ($5k), 'corporate' ($15k)
  active_volunteers   int NOT NULL DEFAULT 0,
  grant_reporting     boolean NOT NULL DEFAULT false,
  status              text NOT NULL DEFAULT 'active'
);
ALTER TABLE nonprofit_partners ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 58 CHECKLIST
[ ] Migration 030_nonprofit_partners.sql runs without errors
    VERIFY: nonprofit_partners table visible in Supabase
    PASS: Table present

[ ] /nonprofit-admin page exists and is role-protected
    VERIFY: Log in as nonprofit_admin role, navigate to /nonprofit-admin
    PASS: Nonprofit admin portal loads

[ ] Volunteer roster shows org volunteers
    VERIFY: Nonprofit admin sees volunteers linked to their organization
    PASS: Table shows volunteer name, service types, hours logged, impact metrics

[ ] Impact report generates in grant format
    VERIFY: Click "Generate grant impact report" with date range
    PASS: PDF report downloads with: org name, date range, total volunteers, total hours,
          number of seniors served, types of services provided, demographic breakdown
          formatted for foundation grant compliance reporting

[ ] Corporate volunteer program integration
    VERIFY: Create a corporate partner (org_type='corporate'), enroll employees as volunteers
    PASS: Employees can log volunteer hours, corporate admin sees company-wide impact

[ ] Mutual referral tracking
    VERIFY: Nonprofit admin clicks "Refer a senior to ThriveAtHome"
    PASS: Referral form creates a lead in admin system with nonprofit source tracking

[ ] Faith-based organization support
    VERIFY: Create faith_based org type partner
    PASS: Portal shows faith community-appropriate language, congregation volunteer management

[ ] Community partner directory
    VERIFY: Navigate to /dashboard/services → Community Resources section
    PASS: Approved nonprofit partners visible as community resources members can connect with

[ ] npx tsc --noEmit passes
```

**Build instructions:**

Nonprofit admin portal (`/app/nonprofit-admin/page.tsx`) — role: `nonprofit_admin`. Shows:
- Organization name, type, EIN (if nonprofit), partnership tier
- Volunteer roster filtered to their organization's volunteers
- Impact dashboard: total volunteers, hours, seniors helped, services provided
- Grant reporting section (if `grant_reporting=true`): date range picker + "Generate grant report" PDF button
- Referral form: refer seniors in their community to ThriveAtHome
- Corporate volunteer hours: for corporate partners, track employee volunteer hours separately

Grant report PDF format (foundation-friendly):
- Organization letterhead area with ThriveAtHome co-branding
- Executive summary: key impact numbers in large format
- Breakdown by service type (transport, meals, companionship, tech help)
- Month-by-month activity table
- Individual volunteer hours (anonymised option available)
- Certification statement: "This report certifies community service hours logged through ThriveAtHome platform"

Add `nonprofit_partner_id` column to `volunteers` table linking volunteers to their sponsoring nonprofit.

Add community partner directory section to `/dashboard/services` showing approved nonprofit partners as local resources members can contact.

---

---

## ═══ M19 — CARE INDUSTRY PARTNERSHIPS ═══

### PHASE 59 — Home Care Agency Portal

**What this builds:** A dedicated portal for home care agencies to manage their care workers, clients, and billable hours — making ThriveAtHome a platform home care agencies can adopt alongside or instead of their existing software.

**New tables (`/supabase/migrations/031_care_agencies.sql`):**

```sql
CREATE TABLE care_agencies (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  agency_name         text NOT NULL,
  license_number      text,
  contact_name        text NOT NULL,
  contact_email       text NOT NULL,
  contact_phone       text,
  city                text,
  state               text,
  agency_type         text NOT NULL DEFAULT 'home_care',
  billing_model       text NOT NULL DEFAULT 'pmpm',
  monthly_rate        numeric,
  active_clients      int NOT NULL DEFAULT 0,
  active_care_workers int NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'active',
  integration_type    text DEFAULT 'standalone'
);
ALTER TABLE care_agencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE care_workers (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  agency_id         uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  supabase_auth_id  uuid UNIQUE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text,
  role              text NOT NULL DEFAULT 'aide',
  certifications    text[] DEFAULT '{}',
  active_clients    int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'active'
);
ALTER TABLE care_workers ENABLE ROW LEVEL SECURITY;

CREATE TABLE care_visits (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  agency_id         uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  care_worker_id    uuid NOT NULL REFERENCES care_workers(id) ON DELETE CASCADE,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  visit_date        date NOT NULL,
  check_in_time     timestamptz,
  check_out_time    timestamptz,
  duration_minutes  int,
  visit_type        text NOT NULL,
  tasks_completed   text[] DEFAULT '{}',
  notes             text,
  billing_code      text,
  verified          boolean NOT NULL DEFAULT false,
  verified_by       uuid REFERENCES care_workers(id)
);
ALTER TABLE care_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE referrals (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  referring_agency_id uuid REFERENCES care_agencies(id),
  referring_type      text NOT NULL DEFAULT 'agency',
  member_id           uuid REFERENCES members(id),
  referral_status     text NOT NULL DEFAULT 'pending',
  referral_notes      text,
  converted_at        timestamptz
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 59 CHECKLIST
[ ] Migration 031_care_agencies.sql runs without errors
    VERIFY: care_agencies, care_workers, care_visits, referrals tables visible in Supabase
    PASS: All 4 tables present

[ ] /agency-admin page exists and is role-protected
    VERIFY: Log in as agency_admin role, navigate to /agency-admin
    PASS: Agency admin portal loads with client roster and care worker roster

[ ] Client roster shows all agency clients
    VERIFY: Seed test agency with 2 clients linked to members table
    PASS: Client table shows name, care worker assigned, last visit, next scheduled visit, status

[ ] Care worker mobile visit logging
    VERIFY: Log in as care_worker role, navigate to /care-worker
    PASS: Mobile-friendly interface shows today's visits, check-in/check-out buttons, task checklist

[ ] Check-in/check-out time tracking works
    VERIFY: Click check-in on a visit, wait 1 minute, click check-out
    PASS: care_visits row created with correct times and duration_minutes

[ ] Billable hours report generates
    VERIFY: Agency admin clicks "Generate billing report" for a date range
    PASS: Report shows hours per client, hours per care worker, total billable hours

[ ] Referral intake workflow
    VERIFY: Agency admin clicks "Refer a client to ThriveAtHome"
    PASS: Referral form creates referral row, admin team notified

[ ] Integration hook stubs visible
    VERIFY: Check /agency-admin for integration settings
    PASS: Shows "Connect to ClearCare", "Connect to AlayaCare", "Connect to WellSky" stub buttons

[ ] npx tsc --noEmit passes
```

---

### PHASE 60 — White Label / Co-branding

**What this builds:** Allows adult care companies to co-brand the ThriveAtHome platform with their own logo and colors — while ThriveAtHome branding is always present. Families see "Agency Name, Powered by ThriveAtHome" — not a fully white-labeled product with ThriveAtHome invisible.

**Brand rule for Phase 60:** ThriveAtHome is never invisible. The footer, the "Powered by" badge, and the support contact always reference ThriveAtHome. This protects the consumer brand and ensures families know who to trust. Agencies that want fully white-labeled (ThriveAtHome completely hidden) must negotiate a separate enterprise license agreement — this is not the default behavior.

**New tables (`/supabase/migrations/032_white_label.sql`):**

```sql
CREATE TABLE brand_configs (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  agency_id           uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE UNIQUE,
  brand_name          text NOT NULL,
  logo_url            text,
  primary_color       text NOT NULL DEFAULT '#1B3A6B',
  secondary_color     text NOT NULL DEFAULT '#2A9D8F',
  support_email       text,
  support_phone       text,
  custom_domain       text,
  footer_text         text,
  welcome_message     text
);
ALTER TABLE brand_configs ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 60 CHECKLIST
[ ] Migration 032_white_label.sql runs without errors
    VERIFY: brand_configs table visible in Supabase
    PASS: Table present

[ ] Agency admin can configure branding
    VERIFY: Log in as agency_admin, navigate to /agency-admin/branding
    PASS: Branding form shows logo upload, color pickers, support contact, welcome message

[ ] Brand config applies to family dashboard
    VERIFY: Family member linked to branded agency loads /dashboard
    PASS: Dashboard shows agency logo and brand name instead of ThriveAtHome logo

[ ] Brand colors apply correctly
    VERIFY: Set primary color to test color, reload dashboard
    PASS: Navigation and buttons reflect custom primary color

[ ] Unbranded members see default ThriveAtHome branding
    VERIFY: Log in as family member not linked to any agency
    PASS: Default ThriveAtHome branding shown

[ ] npx tsc --noEmit passes
```

---

### PHASE 61 — Clinical Documentation

**What this builds:** SOAP notes, care plan versioning, and clinical export for home health agencies that need clinical-grade documentation for Medicare/Medicaid billing.

**New tables (`/supabase/migrations/033_clinical_docs.sql`):**

```sql
CREATE TABLE soap_notes (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  care_worker_id    uuid REFERENCES care_workers(id),
  navigator_id      uuid REFERENCES care_navigators(id),
  visit_date        date NOT NULL,
  subjective        text NOT NULL,
  objective         text NOT NULL,
  assessment        text NOT NULL,
  plan              text NOT NULL,
  billing_code      text,
  signed_by         text,
  signed_at         timestamptz,
  is_locked         boolean NOT NULL DEFAULT false
);
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE care_plan_versions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  version_number    int NOT NULL DEFAULT 1,
  created_by        text NOT NULL,
  goals             jsonb NOT NULL DEFAULT '[]',
  interventions     jsonb NOT NULL DEFAULT '[]',
  review_date       date,
  approved_by       text,
  approved_at       timestamptz,
  status            text NOT NULL DEFAULT 'draft'
);
ALTER TABLE care_plan_versions ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 61 CHECKLIST
[ ] Migration 033_clinical_docs.sql runs without errors
    VERIFY: soap_notes and care_plan_versions tables visible in Supabase
    PASS: Both tables present

[ ] SOAP note form in navigator member detail panel
    VERIFY: Open member detail panel in navigator console
    PASS: "Add SOAP note" button opens structured S/O/A/P form

[ ] SOAP note locks after signing
    VERIFY: Complete and sign a SOAP note
    PASS: Note locked, edit button disappears, signed_by and signed_at recorded

[ ] Care plan versioning works
    VERIFY: Create v1, approve, create v2
    PASS: Both versions visible, v1 superseded, v2 current

[ ] Clinical export generates
    VERIFY: Agency admin exports clinical records for a client
    PASS: PDF/CSV downloads with SOAP notes, care plan, visit history

[ ] Billing code suggestions shown
    VERIFY: SOAP note form shows billing code field
    PASS: Common Medicare codes shown as suggestions (G0179, G0181, T1019, T1020)

[ ] AI SOAP draft stub
    VERIFY: Click "Generate SOAP draft from call summary"
    PASS: [STUB][AI] Would generate SOAP note from last check-in call summary

[ ] npx tsc --noEmit passes
```

---

### PHASE 62 — Multi-location Management

**What this builds:** Allows home care franchises and senior living chains to manage multiple locations from a single parent admin account with aggregate and per-location reporting.

**New tables (`/supabase/migrations/034_multi_location.sql`):**

```sql
CREATE TABLE agency_locations (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  parent_agency_id  uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  location_name     text NOT NULL,
  address           text,
  city              text NOT NULL,
  state             text NOT NULL,
  zip               text,
  location_manager  text,
  manager_email     text,
  active_clients    int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'active'
);
ALTER TABLE agency_locations ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 62 CHECKLIST
[ ] Migration 034_multi_location.sql runs without errors
    VERIFY: agency_locations table visible in Supabase
    PASS: Table present

[ ] Parent agency admin sees all locations
    VERIFY: Create parent agency with 2 locations, log in as parent agency_admin
    PASS: /agency-admin shows location selector — "All locations" or individual location

[ ] Per-location metrics filter correctly
    VERIFY: Select a specific location
    PASS: All metrics filter to that location only

[ ] Aggregate metrics across all locations
    VERIFY: Select "All locations"
    PASS: Totals shown with breakdown table by location

[ ] Location manager role restricts data access
    VERIFY: Log in as location manager
    PASS: Sees only their location's data — not other locations

[ ] Multi-location billing report
    VERIFY: Generate billing report for all locations
    PASS: Report shows totals with per-location breakdown

[ ] npx tsc --noEmit passes
```

---

## M19 COMPLETION

When Phase 62 is approved, add to `progress.md`:

```
M19 COMPLETE — CARE INDUSTRY PARTNERSHIPS APPROVED
ThriveAtHome is enterprise-ready for adult care industry partners.
Phases complete: 59 (Agency Portal), 60 (White Label), 61 (Clinical Docs), 62 (Multi-location)
Deferred: ClearCare/AlayaCare/WellSky API sync, custom subdomain DNS routing,
AI SOAP notes (activate with ANTHROPIC_API_KEY), Medicare billing clearinghouse.
```

---

## M13–M18 COMPLETION

When Phase 58 is approved, add to `progress.md`:

```
M13-M18 COMPLETE — ALL ADVANCED FEATURE PHASES APPROVED
Platform is feature-complete across all 5 spec layers including all partner portals.
Remaining deferred items:
- M8 AI Calls (activate with RETELL_API_KEY + TWILIO credentials)
- M9 Concierge Line (activate with second Twilio number)
- M10 Live SMS/Email (activate with SENDGRID_API_KEY + TWILIO credentials)
- Physical goods fulfillment (Artifact Uprising, 1-800-Flowers — Phase 39)
- Stripe Connect for companion payouts (Phase 48)
- Lyft Healthcare, Instacart, Teladoc integrations (Phase 45-47)
- Full multilingual UI beyond Spanish (Phase 55)
- VAVS integration for veteran volunteer reporting (Phase 57)
- x2VOL and Track it Forward integration for school partners (Phase 56)
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

---

## ═══ M20 — COMMUNITY ORGANIZATION PORTAL (DEFERRED) ═══

> **⏸ DEFERRED — Do not build until explicitly instructed.**
> Build M19 first. Begin M20 only when you have a confirmed village network,
> Area Agency on Aging, or senior center prospect actively requesting the platform.
> The M19 architecture is designed to extend cleanly into M20 — no rework needed.

### When to Start M20

Start M20 when ANY of the following is true:
- A Village to Village network member has requested a demo
- An Area Agency on Aging has expressed interest in a contract
- A senior center has asked about the platform
- The Village to Village Network national office has been contacted
- n4a (National Association of Area Agencies on Aging) has been engaged

### Architecture Notes for M20

The following M19 decisions were made specifically to support M20 without rework:
- `care_agencies.agency_type` supports: 'village_network', 'area_agency_on_aging', 'senior_center', 'faith_community', 'norc'
- `agency_locations` table works for multi-county AAA structure
- `brand_configs` works for village co-branding
- `referrals` table tracks member referrals from community orgs
- No schema changes needed to start M20 — only new portal pages

---

### PHASE 63 — Village / Community Organization Portal

**What this builds:** A lightweight coordinator portal for Village to Village networks, NORCs, and similar member-governed community organizations — focused on member-to-member help, volunteer coordination, and program tracking.

**Key differences from M19 agency portal:**
- Coordinator role is lighter than navigator — often a part-time volunteer themselves
- Members can post needs directly to the volunteer pool (not just through coordinator)
- Annual membership dues model instead of monthly subscription
- Program-level tracking (aggregate metrics) not just individual service bookings
- Governance tools for nonprofit board management

**New tables (`/supabase/migrations/035_community_orgs.sql`):**

```sql
-- Extend care_agencies with community org fields
ALTER TABLE care_agencies 
  ADD COLUMN IF NOT EXISTS membership_model text DEFAULT 'monthly',
  -- Values: monthly, annual, sliding_scale, free
  ADD COLUMN IF NOT EXISTS annual_dues_amount numeric,
  ADD COLUMN IF NOT EXISTS sliding_scale_min numeric,
  ADD COLUMN IF NOT EXISTS sliding_scale_max numeric,
  ADD COLUMN IF NOT EXISTS geographic_area text,
  ADD COLUMN IF NOT EXISTS member_count int DEFAULT 0;

CREATE TABLE member_needs (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  need_title        text NOT NULL,
  need_description  text,
  service_type      text NOT NULL,
  needed_by         timestamptz,
  status            text NOT NULL DEFAULT 'open',
  -- open, claimed, completed, cancelled
  claimed_by        uuid REFERENCES volunteers(id),
  claimed_at        timestamptz,
  completed_at      timestamptz
);
ALTER TABLE member_needs ENABLE ROW LEVEL SECURITY;

CREATE TABLE org_programs (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  org_id            uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  program_name      text NOT NULL,
  program_type      text NOT NULL,
  -- tech_help, transportation, social, health, home_services, meals
  frequency         text,
  -- weekly, monthly, drop_in, one_time
  members_served    int NOT NULL DEFAULT 0,
  volunteers_active int NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true
);
ALTER TABLE org_programs ENABLE ROW LEVEL SECURITY;
```

**Checklist:**
```
PHASE 63 CHECKLIST
[ ] Migration 035_community_orgs.sql runs without errors
    VERIFY: member_needs and org_programs tables visible in Supabase
    PASS: Both tables present, care_agencies has new columns

[ ] /community-admin page exists and is role-protected
    VERIFY: Log in as community_admin role, navigate to /community-admin
    PASS: Community org portal loads — lighter design than agency portal

[ ] Member needs board (bulletin board style)
    VERIFY: Member posts a need "Need a ride to eye doctor Thursday 2pm"
    PASS: Need appears on coordinator dashboard and volunteer dashboard as claimable

[ ] Volunteer claims a need
    VERIFY: Volunteer clicks "I can help" on a posted need
    PASS: Need status updates to claimed, member notified, volunteer and member connected

[ ] Annual membership dues billing
    VERIFY: Set org to annual membership model, enroll a test member
    PASS: Stripe annual subscription created at correct annual amount

[ ] Sliding scale pricing
    VERIFY: Set org sliding_scale_min=$100, max=$600
    PASS: Enrollment flow shows income-based pricing options

[ ] Program tracking
    VERIFY: Create a "Tuesday Tech Help" program, log 5 attendees
    PASS: org_programs row shows members_served=5, report shows program metrics

[ ] npx tsc --noEmit passes
```

---

### PHASE 64 — Area Agency on Aging (AAA) Portal

**What this builds:** Multi-county management, Title III grant reporting, and NAPIS export for Area Agencies on Aging receiving Older Americans Act funding.

**Checklist:**
```
PHASE 64 CHECKLIST
[ ] AAA org type supported in care_agencies
    VERIFY: Create agency with agency_type='area_agency_on_aging'
    PASS: AAA-specific fields and reporting available

[ ] Multi-county region management
    VERIFY: Create AAA with 3 county locations
    PASS: /agency-admin shows county selector, metrics filter by county

[ ] Title III service categories tracked
    VERIFY: Service bookings can be tagged with Title III categories
    PASS: Categories available: III-B (supportive services), III-C (nutrition),
          III-D (disease prevention), III-E (caregiver support)

[ ] NAPIS export format
    VERIFY: Generate NAPIS report for a quarter
    PASS: CSV downloads in National Aging Program Information System format
          with required fields: unduplicated count, units of service, demographic data

[ ] Older Americans Act compliance fields
    VERIFY: Member enrollment captures OAA-required demographics
    PASS: Age, income level, minority status, rural status, disability status collected

[ ] Title III grant report PDF
    VERIFY: Generate grant report for a funding period
    PASS: PDF shows: units of service by category, unduplicated client count,
          demographic breakdown, outcome measures — formatted for state unit on aging submission

[ ] npx tsc --noEmit passes
```

---

### PHASE 65 — Senior Center Portal

**What this builds:** Drop-in program attendance, activity calendar, room booking, and congregate meal tracking for senior centers.

**Checklist:**
```
PHASE 65 CHECKLIST
[ ] Drop-in attendance tracking
    VERIFY: Center staff marks attendance for a drop-in program
    PASS: Attendance record created with date, program, count

[ ] Activity calendar management
    VERIFY: Center admin creates weekly activity schedule
    PASS: Calendar visible to members at /dashboard/events filtered to their center

[ ] Room/resource booking
    VERIFY: Volunteer books the computer lab for a tech help session
    PASS: Room booking created, conflict detection prevents double-booking

[ ] Congregate meal tracking
    VERIFY: Log 45 meal participants for Tuesday lunch
    PASS: Meal count recorded, monthly meal total updates for Title III-C reporting

[ ] Center membership vs community membership
    VERIFY: Member enrolled at a senior center has center-specific features
    PASS: Member dashboard shows center events, programs, and meal schedule

[ ] npx tsc --noEmit passes
```

---

### PHASE 66 — Network Federation

**What this builds:** A parent network account (e.g. Village to Village Network national office, n4a) that can aggregate data across all member organizations for national reporting and benchmarking.

**Checklist:**
```
PHASE 66 CHECKLIST
[ ] Network parent account type
    VERIFY: Create network account with child member organizations
    PASS: Network admin sees all member orgs in a directory

[ ] Aggregate national reporting
    VERIFY: Network admin generates national impact report
    PASS: Report shows totals across all member orgs: members served, volunteer hours,
          services provided, geographic coverage map

[ ] Anonymized benchmarking
    VERIFY: Individual org admin views benchmarking data
    PASS: "Your village serves 127 members — median for villages your size is 89" shown
          All individual org data anonymized in benchmarks

[ ] Member org directory
    VERIFY: Navigate to network directory page
    PASS: Public-facing directory of member organizations with location and contact info

[ ] Network dues billing
    VERIFY: Network admin sets annual dues for member orgs
    PASS: Stripe invoices generated for each member org at correct annual amount

[ ] npx tsc --noEmit passes
```

---

## M20 ENVIRONMENT VARIABLES

No new environment variables needed for M20. All M20 features use existing Supabase, Stripe, and Realtime infrastructure.

The only additions when activating real integrations:
```bash
NAPIS_SUBMISSION_ENDPOINT=    # State Unit on Aging NAPIS submission URL (per state)
VTV_NETWORK_API_KEY=          # Village to Village Network API if they build one
N4A_REPORTING_ENDPOINT=       # n4a national reporting API if available
```

---

## M20 PARTNERSHIP NOTES

Before building M20, establish relationships with:

| Organization | Why | Contact |
|-------------|-----|---------|
| **Village to Village Network** | National umbrella for 350+ villages | vtnetwork.org |
| **n4a** | National Association of Area Agencies on Aging | n4a.org |
| **NISC** | National Institute of Senior Centers | ncoa.org/nisc |
| **USAging** | Rebranded n4a — federal AAA advocate | usaging.org |
| **NCOA** | National Council on Aging — benefits finder partnership | ncoa.org |

These organizations can refer their entire member network to ThriveAtHome if you establish the right partnership — potentially hundreds of organizations at once.

---

*M20 is deferred. Do not build until explicitly instructed. Begin only after M19 is complete and a qualified community organization prospect has been identified.*
