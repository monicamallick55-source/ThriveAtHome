# ThriveAtHome — Build Phases Reference (v4.0)
# Last updated: June 2026 — reflects actual build state

> This document reflects what has actually been built, what is in progress,
> and what remains. It supersedes all previous versions of the build phases document.

---

## Platform Overview

ThriveAtHome is a senior independence platform with five layers:

| Layer | What It Is |
|-------|-----------|
| **Layer 1 — AI Connection** | Daily AI check-ins, family dashboard, alerts engine |
| **Layer 2 — Human Network** | Volunteers (all types), paid companions, student network |
| **Layer 3 — Community** | Virtual/local events, communities, skill exchange, interest groups |
| **Layer 4 — Services** | Transport, home services, meals, health, legal/financial, tech help |
| **Layer 5 — Celebrations & Transitions** | Celebrations, life story archive, grief support, memory books |

---

## Pricing Model (confirmed)

| Plan | Price | Key Features |
|------|-------|-------------|
| Thrive Basics | $19/mo | Daily AI check-ins, family dashboard, alerts, document vault |
| Thrive Connect | $39/mo | Basics + Communities, events, volunteers, skill exchange, benefits finder |
| Thrive Complete | $69/mo | Connect + care navigator (2 hrs/mo), grief circles, services marketplace |
| Thrive Premier | $129/mo | Complete + dedicated navigator (8 hrs/mo), companion credits ($50/mo), celebrations, concierge |

Memory Book pricing: Premier/Complete = free unlimited; Connect = Book $14.99 / Collage $9.99 / Both $19.99; Basics = Book $19.99 / Collage $12.99 / Both $24.99. Memorial Edition: free Premier/Complete, $24.99 Connect/Basics.

---

## Build Status Summary

| Milestone | Status | Notes |
|-----------|--------|-------|
| M1 Foundation | ✅ COMPLETE | Phases 1–4 |
| M2 Member Data | ✅ COMPLETE | Phases 5–7 |
| M3 UI System | ✅ COMPLETE | Phase 8 — warm luxury design system |
| M4 Realtime | ✅ COMPLETE | Phase 9 |
| M5 Alert Engine | ✅ COMPLETE | Phases 10–11 |
| M6 Family Dashboard | ✅ COMPLETE | Phases 12–14 |
| M7 Navigator Console | ✅ COMPLETE | Phases 15–16 |
| M8 AI Calls | ⏸ DEFERRED | Activate with RETELL_API_KEY + TWILIO credentials |
| M9 Concierge Line | ⏸ DEFERRED | Activate with second Twilio number |
| M10 SMS/Email | ⏸ DEFERRED | Activate with SENDGRID_API_KEY + TWILIO credentials |
| M11 Billing | ✅ COMPLETE | Phases 24–26, Stripe billing live |
| M12 Compliance | ✅ COMPLETE | Phases 27–28, privacy policy, HIPAA baseline |
| M13 Volunteer Network | ✅ COMPLETE | Phases 29–33 |
| M14 Community Layer | ✅ COMPLETE | Phases 34–38 |
| M15 Celebrations & Life Story | ✅ COMPLETE | Phases 39–41 |
| M16 Grief & Transitions | ✅ COMPLETE | Phases 42–44 |
| M17 Services Marketplace | 🔄 IN PROGRESS | Phase 45 transport done, 46–50 remaining |
| M18 Enterprise | ⬜ NOT STARTED | Phases 51–55 |

---

## What Has Been Built (Complete)

### M1–M6 — Foundation + Family Layer
- Next.js 16 app deployed on Vercel
- Supabase database with 45+ tables, RLS, audit logging
- Supabase Auth with role-based access (family, navigator, admin, volunteer, student, employer_admin)
- 8 service interfaces with stub implementations — real services activate via env vars
- Family dashboard: wellness card, mood timeline, alerts, family tasks, messages, document vault
- Real-time alerts via Supabase Realtime + push-notification Edge Function
- Crisis detection with 5-step escalation
- Call history page, family coordination tools

### M7 — Navigator Console
- Caseload table with unified action feed
- Alert queue with acknowledge functionality
- Member detail panel with slide-out
- Navigator notes, pre-call brief (stub)
- Service request dispatch panel with volunteer assignment
- Grief support referral tracking
- Today's tasks with priority badges

### M11 — Stripe Billing
- 4 subscription plans live in Stripe (test mode)
- Checkout flow, webhook handler, billing management page
- Customer portal for self-serve plan changes
- Gift subscriptions feature
- Plan display on dashboard

### M12 — HIPAA Baseline
- Privacy policy page at /privacy
- Data deletion endpoint
- Audit logging on health data access
- HTTPS enforced via Vercel
- BAAs: pending (required before real user data)

### M13 — Volunteer Network
- Volunteer application form at /volunteer/apply
- Volunteer matching algorithm (location +25, interests +15 each, language +20, availability +10)
- Veteran-specific volunteer track with VSO fields
- Driver's license and car insurance fields for transport volunteers
- Volunteer dashboard at /volunteer/dashboard (impact stats, connections, visit log, download service record)
- Student volunteer portal at /student (service hours tracker, PDF service record)
- Admin volunteer queue at /admin/volunteers
- Admin volunteer matching at /admin/volunteer-matching
- Migrations: 005, 006, 007, 008, 009

### M14 — Community Layer
- **Communities** (renamed from Cultural Circles) at /dashboard/communities
  - 12 cultural/ethnic circles seeded
  - 8 interest-based circles seeded (Gardening, Books, Music, Cooking, Faith, Sports, Travel, Crafts)
  - Two sections: "Cultural & Heritage Communities" and "Interest & Hobby Communities"
  - Recommended for you section based on member interests
  - Admin can create new communities at /admin/communities
  - Admin URL renamed from /admin/cultural-circles to /admin/communities
  - URL redirect: /dashboard/cultural-circles → /dashboard/communities
- **Virtual Events** at /dashboard/events
  - Events calendar with RSVP
  - Platform-wide events visible to all members
  - External events discovery (Meetup, Eventbrite, Luma placeholders)
  - In-person event support with location field
  - Interest-based event ordering
  - Hydration error fix for timezone mismatch
- **Skill Exchange** at /dashboard/skill-exchange
  - Register skills, request exchanges, time credit ledger
  - Complete exchange transfers credits
- **Interest Groups** at /dashboard/groups
- **Benefits Finder** at /dashboard/benefits (15+ federal programs)
- **Employer Portal MVP** at /employers (demo request form)
- Migrations: 010, 011, 012, 013, 016, 017

### M15 — Celebrations & Life Story
- **Celebrations Engine** at /dashboard/celebrations
  - Birthday detection cron (D-7 family notification, D-0 dashboard banner)
  - Milestone recognition: First Check-In, 30-Day Streak
  - Gold birthday banner on family dashboard
  - celebration_events table
- **Life Story Archive** at /dashboard/life-story
  - Entry types: Memory, First Memory (⭐ gold star), Milestone, Recipe, Tradition, Wisdom
  - Era grouping: Childhood, Young Adult, Career, Family, Later Life
  - File attachments: photos (thumbnails), PDFs (paperclip + download)
  - Supabase Storage bucket: life-story-attachments (private)
  - Multiple First Memory entries allowed (restriction removed)
- **Memory Book Builder**
  - Two formats: Memory Book PDF (8.5x11 multi-page) + Memory Collage (12x12 frameable)
  - Collage layouts: Grid, Mosaic, Timeline, Magazine
  - Photo count selector, quote prominence, background styles
  - Draft system (saves config references, persists across sessions)
  - Preview with watermark before payment
  - Pricing by plan tier (checked at payment time)
  - 3 free regenerations within 30 days
  - Abuse prevention: blocks new purchase within 30 days
  - Memorial Edition for inactive members
  - @react-pdf/renderer for Shutterfly-quality output
- Migrations: 018, 019, 020, 021, 022

### M16 — Grief & Life Transitions
- **Grief & Transition Support** at /dashboard/grief-support
  - 4 pathway cards: Loss of loved one, Major health diagnosis, Major life change, Support for caregivers
  - Grief support request form → creates grief_support_requests row
  - Check-in frequency auto-updates to daily on submission
  - Trusted resources with clickable external links
  - Support history section
- **Life Transition Pathways** (Phase 43)
  - 5 pathway cards including Loss of driving independence
  - Prolonged grief detection cron
  - Anniversary sensitivity (daily check-ins near loss anniversaries)
- **Professional Referral Network** (Phase 44)
  - Navigator referral panel in member detail
  - External support referral with type select + notes + Record referral button
  - Grief monitoring cron at /api/cron/grief-monitoring
- Migrations: 023, 024

---

## In Progress

### M17 — Services Marketplace (Phases 45–50)

**Phase 45 — Transport Services** ✅ Done
- /dashboard/services hub with 6 category cards
- Transport booking request form
- service_bookings table
- Navigator dispatch panel with volunteer assignment
- Family dashboard shows upcoming services
- Migration: 025

**Phase 46 — Home Services + Meals** 🔄 In progress

**Phase 47 — Health Services + Legal/Financial + Tech Help** ⬜ Not started

**Phase 48 — Paid Companion Marketplace** ⬜ Not started
- Requires Stripe Connect setup

**Phase 49 — On-Demand Tech Help** ⬜ Not started

**Phase 50 — Services Dashboard Integration** ⬜ Not started
- Upcoming services on family dashboard
- Service history view
- Navigator console shows all member bookings

**Phase 50a — Prescription Refill Management** ⚠️ SUPERSEDED by Phase 50j
- Original narrow prescription-only feature
- Replaced by Phase 50j Important Dates & Renewals — prescriptions are now one item_type within
  the broader configurable system rather than a standalone feature

**Phase 50b — Gift Sending Platform** 🔄 In progress
- Gift intent detection in Aria calls → family notification
- Gift marketplace: Flowers, Food, Gift Cards, Handwritten Cards, Gift Baskets
- 15% platform commission on all gift orders
- Stub fulfillment via 1-800-Flowers, Goldbelly, Amazon Gift Cards
- Gift delivery tracking on family dashboard

**Phase 50c — Family-Initiated Celebrations** 🔄 In progress
- Special occasion requests from /dashboard/celebrations
- Three tiers: Digital (free), Enhanced ($25), Premier ($75)
- Personalized Aria celebration calls using life story entries
- Family coordination room for linked family members
- Navigator handles Enhanced and Premier logistics

**Phase 50d — Family Events Calendar & Senior Gift-Giving** 🔄 In progress
- Family events calendar: birthdays, anniversaries, graduations, travel, parties, holidays, new babies
- family_events table with reminder_days_before setting
- Aria mentions upcoming family events in check-in calls
- Senior sends gift to family via platform (stub: 1-800-Flowers, Goldbelly, Amazon)
- Senior sends physical card — $4.99, platform prints and mails
- Celebration notes — free digital message, shareable link or PDF
- Family travel awareness — Aria adjusts call tone during family travel
- New baby/milestone Aria celebration scripts

**Phase 50e — Platform Automations (17 rules)** 🔄 In progress
- Health: prescription refill prediction, doctor appointment reminder, vaccination reminders, isolation detection
- Safety: extreme weather alerts, seasonal home safety checks, fall risk flag
- Social: volunteer re-engagement, event no-show follow-up, benefits renewal reminder
- Administrative: subscription value summary, inactive family nudge, onboarding completion reminder, navigator caseload warning
- Services: transport follow-up, tech help success check, meal delivery feedback
- Global rules: audit logged, family opt-out per member, max 2 notifications/day/family

**Phase 50f — Geographic Chapter System** 🔄 In progress
- metro_areas table with 10 seeded US metros
- Member auto-assigned to chapter by zip code
- Volunteer matching: same chapter +30 pts, same state +15 pts
- "Near you" badge on local chapter events
- Chapter auto-activates at 50+ members
- Chapter landing page at /chapter/[slug]
- Rural members get full virtual service — no degraded experience

**Phase 50g — Member Safety & Fraud Protection** 🔄 In progress
- Soft age verification (65+ DOB) — no ID upload required
- Background checks: volunteers/companions/navigators only — NEVER for members
- Aria detects: gift card requests, new friend money requests, tech support scams, lottery scams, romance scams
- Large purchase notification to family (>$50)
- New vendor contact alerts
- fraud_flags table visible to family and navigator
- Scam education content in tech help section
- "Report a concern" button on family dashboard

**Phase 50h — Three-Layer Social Connection** 🔄 In progress
- Layer 1: Circle posts with auto-redact of contact info (already partially built)
- Layer 2: Friend requests (circle/event members only), private messaging inside platform, contact info auto-redacted, money request scanning
- Layer 3: Navigator-facilitated introductions with AI member matching
- Security: Report button on posts/messages, community guidelines acknowledgment screen
- Deferred to Year 2: public community feed, full social graph, friend feeds, mutual friends visibility

**Phase 50i — Human Buddy Feature** ⚠️ SUPERSEDED by Phases 33a–33f
- Original draft of the Buddy feature, replaced by the fuller Phases 33a–33f spec
  (database layer, matching UI, buddy portal, navigator tools, family dashboard, onboarding questions)

**Phase 50j — Important Dates & Renewals (replaces Phase 50a)** 🔄 In progress
- Generalized tracked_items system covering: prescriptions, home/car/health insurance,
  driver's license, car registration, AAA membership, passport, gym membership, appointments, other
- Member-configurable item types with sensible defaults (reminder lead time, recurrence cycle)
  fully editable per item
- Document upload per item — insurance card photo, registration document, appointment confirmation
  (tracked-item-attachments Storage bucket)
- Aria proactively mentions upcoming items in calls, same pattern as Family Events
- Member response actions: snooze, request navigator help renewing, mark done, reschedule/cancel
  (appointments)
- Recurring items auto-advance to next cycle when marked complete; one-time items (passport) just complete
- Navigator action panel shows all tracked items sorted soonest-first with renewal request tasks
- Family dashboard card showing upcoming items color-coded by urgency

**Phase 50l — Corporate Employee Volunteer Program** 🔄 In progress
- B2B feature distinct from subscription caregiver benefit — second revenue line from
  employer's corporate giving/CSR budget, not just HR/benefits budget
- corporate_volunteer_programs + corporate_volunteer_hours tables
- Volunteer application links employee to their employer's program
- Employer admin exports hours in Benevity-compatible and YourCause-compatible CSV formats
  (the platforms companies like Cisco and Genentech use to match employee volunteer hours
  with cash donations)
- Employee volunteer dashboard shows hours, cap remaining, and estimated matching value
  generated for their employer
- Navigator spot-check verification
- Pricing tiers: Community Partner ($5K-15K/yr), Champion ($15K-35K/yr), Leader ($35K-50K+/yr)
- Can be sold standalone or bundled with subscription PEPM benefit

**Phase 50k — Roadside Assistance & Car Repair** 🔄 In progress
- 9th service category — split into 🚨 Emergency Roadside and 🔧 Car Repair & Maintenance
- Emergency: flat tyre, battery jump, lockout, towing, fuel delivery, other roadside emergency
- Non-emergency: scheduled maintenance, body shop, mechanic (non-urgent), car inspection
- Pre-fills from member's AAA membership or car insurance stored in tracked_items (Phase 50j)
- Urgent flag for roadside emergencies only — bypasses standard dispatch queue; non-emergency
  repair requests follow normal low-priority navigator dispatch
- Navigator dispatch panel shows membership/insurance details pre-populated + ServiceProviderPicker
  for vetted repair shops
- Migration 032_car_repair_providers.sql seeded 2 vetted shops (Tony Martinez, Kevin Park)
- Stub: [STUB][Roadside] Would call AAA/insurance roadside on behalf of member

---

### M18 — Enterprise (Phases 51–54, Phase 55 moved to after M21)

**Phase 51 — Outcomes Dashboard**
- Public outcomes page at /outcomes (anonymised aggregate stats)
- Enterprise reporting at /admin/outcomes (per-employer charts)

**Phase 52 — University Partnership Portal**
- Full university admin portal at /university-admin
- Semester CSV export
- Official service record PDF generation
- Builds on existing student portal from M13

**Phase 53 — Employer Portal Full Build**
- Full employer admin dashboard with utilisation reporting
- Employee invitation flow with tokenised links
- Employer billing integration (PEPM pricing)
- Builds on employer MVP from M14

**Phase 54 — Medicare Advantage Reporting API**
- /api/enterprise/outcomes endpoint
- Aggregated metrics only (minimum cohort 10)
- Rate limiting (100 requests/partner/day)
- API access audit logging

**Phase 55 — Full Multilingual UI** ⏸ MOVED TO LAST — builds after M19, M20, M21, M22, M23, M24, M25, M26, AND M27
- Moved per updated roadmap — builds only after the ENTIRE M19–M27 sequence is complete
- M18 now ends at Phase 54 (Medicare Advantage Reporting API)
- Language Line credentials still activate at Month 6 per Parallel Blitz (env var only, no code change —
  unrelated to the full i18n framework build)
- Full i18n, next-intl, Spanish-first, multilingual Aria is the LAST feature built on the entire roadmap

---

## Deferred — Activate When Ready

| Feature | What's Needed | Est. Cost |
|---------|--------------|-----------|
| M8 AI Calls (Aria) | RETELL_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ANTHROPIC_API_KEY | ~$0.05–0.11/min per call |
| M9 Concierge Line | Second Twilio number, RETELL_CONCIERGE_AGENT_ID, LANGUAGE_LINE credentials | ~$1.15/mo + per-minute |
| M10 Live SMS | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN | ~$0.0079/SMS |
| M10 Live Email | SENDGRID_API_KEY, SENDGRID_FROM_EMAIL | Free up to 100/day |
| Companion payouts | Stripe Connect setup per companion | 2.9% + 30¢ per transaction |
| Physical goods (Memory Book print) | Artifact Uprising API or similar | Per-order cost |
| Lyft Healthcare | Commercial partnership agreement | Per-ride |
| Instacart Business | Instacart developer program | Per-order |
| Teladoc | Healthcare provider agreement | Per-consultation |

---

## Known Issues / To Fix

These are issues identified during testing that need fixing:

1. **Volunteer name shows "James" instead of logged-in volunteer name** — query fetching wrong row, needs supabase_auth_id filter
2. **Connections stat card not scrolling to connections list** — anchor link needs fixing
3. **Service request volunteer dropdown empty** — needs active volunteers with matching service_types seeded
4. **Grief support trusted resources** — fixed (now clickable links) ✅
5. **Navigator "Contact member" wrong navigation** — fixed ✅
6. **Memory Collage not showing selected memories** — collage customization in progress
7. **Pricing page shows 3 plans** — needs Premier plan added, prices corrected to spec
8. **Events hydration error** — timezone mismatch in EventsClient.tsx
9. **Grief support referral card missing from confirmation screen** — in progress
10. **Service request items in navigator panel not clickable** — fixed ✅

---

## Active Migrations (in order)

| Migration | Tables Created | Status |
|-----------|---------------|--------|
| 001_initial_schema | All core tables (17) | ✅ Run |
| 002_audit | Audit triggers | ✅ Run |
| 003_fix_rls | RLS recursion fix | ✅ Run |
| 004_billing_constraints | Billing constraints | ✅ Run |
| 005_volunteers | volunteers, volunteer_visits, volunteer_matches | ✅ Run |
| 006_volunteer_role | volunteer role enum | ✅ Run |
| 007_volunteer_driver_fields | Driver license/insurance columns | ✅ Run |
| 008_students | student_volunteers, student_visits | ✅ Run |
| 009_volunteers_rls | Volunteer RLS policies | ✅ Run |
| 010_cultural_circles | cultural_circles, circle_memberships, circle_posts, circle_events | ✅ Run |
| 011_circle_events_location | location_address, is_platform_wide columns | ✅ Run |
| 012_circle_events_multi_circle | circle_ids array column | ✅ Run |
| 013_events | events, event_rsvps | ✅ Run |
| 014 (inline) | event_rsvps policies | ✅ Run |
| 015 (inline) | service_bookings (Phase 45 prep) | ✅ Run |
| 016_skill_exchange | skills_offered, time_credits, skill_exchanges, time_credit_transactions | ✅ Run |
| 017_employer | employer_accounts, employer_leads | ✅ Run |
| 018_celebrations | celebration_events | ✅ Run |
| 019_life_story | life_story_entries | ✅ Run |
| 020_life_story_attachments | attachments column + storage policies | ✅ Run |
| 021_memory_books | memory_books | ✅ Run |
| 022_memory_books_v2 | format, regeneration_count, purchase_date columns | ✅ Run |
| 023_grief | grief_support_requests | ✅ Run |
| 024_grief_anniversary | anniversary tracking columns | ✅ Run |
| 025_services | service_bookings (full schema) | ✅ Run |

---

## Environment Variables

### Currently Set (in .env.local and Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
CARE_TEAM_EMAIL
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_BASICS
STRIPE_PRICE_ID_CONNECT
STRIPE_PRICE_ID_COMPLETE
STRIPE_PRICE_ID_PREMIER
```

### Needed for Deferred Features
```
RETELL_API_KEY              # M8 AI Calls
RETELL_AGENT_ID             # M8 AI Calls
RETELL_WEBHOOK_SECRET       # M8 AI Calls
TWILIO_ACCOUNT_SID          # M8 + M10
TWILIO_AUTH_TOKEN           # M8 + M10
TWILIO_PHONE_NUMBER         # M8 + M10
RETELL_CONCIERGE_AGENT_ID   # M9 Concierge
TWILIO_CONCIERGE_NUMBER     # M9 Concierge
ONCALL_NAVIGATOR_PHONE      # M9 + M10
LANGUAGE_LINE_ACCOUNT_NUMBER # M9 Concierge
SENDGRID_API_KEY            # M10 Email
SENDGRID_FROM_EMAIL         # M10 Email
ANTHROPIC_API_KEY           # M8 + AI features
```

---

## Supabase Storage Buckets

| Bucket | Access | Used For |
|--------|--------|---------|
| member-documents | Private | Family document vault |
| life-story-attachments | Private | Life story photos and PDFs |
| memory-books | Private | Generated Memory Book PDFs |

---

## Edge Functions Deployed

| Function | Purpose |
|----------|---------|
| push-notification | Realtime notifications to family dashboard |
| create-alert | Create alerts from external triggers |
| check-missed-calls | Detect and escalate missed check-in calls |
| family-nudge-check | Nudge family members who haven't logged in |

---

## Cron Jobs (vercel.json)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| /api/cron/daily-calls | Every hour | Schedule daily check-in calls |
| /api/cron/missed-calls | Every 30 min | Detect missed calls |
| /api/cron/celebrations | Daily 8am | Birthday and milestone detection |
| /api/cron/milestones | Daily | Platform milestone recognition |
| /api/cron/grief-monitoring | Daily | Prolonged grief + anniversary detection |
| /api/cron/weekly-digest | Sundays 9am | Weekly family digest emails |
| /api/cron/monthly-summary | 1st of month 9am | Monthly care summary |

---

## M20 — Community Organization Portal (Phases 63–66) 🔄 IN PROGRESS — Testing underway

M20 builds portals for four types of community organizations. Revenue model: annual license fee per org ($2,400–$15,000/year).

**Phase 63 — Village / Community Organization Portal** 🔄 In progress — issues pending
- community_orgs, org_programs, org_memberships, member_needs tables ✅
- Member needs bulletin board ✅ (member name dropdown bug still pending fix)
- Annual membership dues with sliding-scale tiers ✅
- Org programs tracking ✅ (3 seeded programs confirmed: Friendly Visitor, Tech Help Tuesdays, Ride Share Network)
- Email broadcast to org members 🔄 (limited recipient filtering — enhancement pending Phase 70)
- Document library 🔄 (upload silently fails — Phase 72 bug fix pending)
- Donations tracking 🔄 (Phase 69 — UI incomplete)
- Bay Area Village Network seeded with 3 programs ✅
- /org-admin portal loads and routes correctly ✅
- Issues queued in progress.md: member UUID → name dropdown, membership fee config UI, document upload fix, email recipient filtering

**Phase 64 — Area Agency on Aging Portal** ✅ VERIFIED COMPLETE
- area_agencies_on_aging, aaa_service_units, oaa_client_assessments tables ✅
- Multi-county management (SF/Marin/San Mateo) ✅
- Title III service category tracking (III-B/C1/C2/D/E) ✅
- NAPIS-compliant 17-column CSV export ✅
- OAA demographic fields ✅
- Bay Area AAA seeded (PSA-06) ✅
- /aaa-admin portal — all 4 tabs tested: Overview, Service Log, Counties, Reports ✅
- signed_by_name shows "Agency Admin" instead of actual name (minor issue logged)

**Phase 65 — Senior Center Portal** 🔄 In progress — testing underway
- senior_centers, center_dropins, center_activities, activity_registrations, room_bookings, congregate_meals tables ✅
- SF Senior Center seeded (481 O'Farrell Street, capacity 150) ✅
- /senior-center-admin portal routes correctly ✅
- Testing in progress: drop-ins, activities, room bookings, meals, reports

**Phase 66 — Network Federation** 🔄 In progress — testing underway
- network_accounts, network_dues tables ✅
- Village to Village Network + n4a seeded ✅
- Bay Area Village Network linked to VtVN network ✅
- /network-admin portal routes correctly ✅
- Testing in progress: Overview, Member Organizations, Dues Billing, Aggregate Reports

---

## Platform-Wide Additions — Phases 67–72 (build after M20 Phases 63–66, before M21)

These six phases apply to ALL GTM streams — B2C direct, employer benefits, agency white-label, village/community orgs, Medicare Advantage.

**Build sequence:** M20 (63–66) → Phases 67–72 → M21 → M22 → M23 → M24 → M25 → M26 → M27 → Phase 55 (Multilingual, LAST)

| Phase | Feature | Status | Priority |
|-------|---------|--------|---------|
| **Phase 67** | Member Self-Service Portal — /member-portal, direct member login, post needs, view profile, life story | ⬜ Not built | HIGH |
| **Phase 68** | Volunteer 24/7 Self-Service Claiming — browse and claim open requests directly; urgent still requires navigator | 🔄 Partial | HIGH |
| **Phase 69** | Donations Management — donations table (migration 046), org admin UI, donor CSV export, "Donate" option | ⬜ Not built | MEDIUM |
| **Phase 70** | Email/Newsletter Broadcast — any admin sends to members/employees/clients; filtered subgroups; sent history | ⏸ Stub only | HIGH |
| **Phase 71** | Public Landing Pages — /chapter/[slug], /org/[slug], /employer/[slug] full SEO marketing pages | 🔄 Partial | HIGH |
| **Phase 72** | Document Library — upload/organise/share docs with role-based visibility; "platform-documents" Storage bucket | ⬜ Not built | MEDIUM |

## Competitive Spec Modifications — Phases 73–80 (from Competitive Analysis v2.0, June 2026)

Source: ThriveAtHome_Competitive_Analysis_v2_June2026.docx — 11 spec modifications, 8 not yet in build plan.

**Build sequence:** M20 (63–66) → Platform-Wide (67–72) → Competitive Specs (73–80) → M21–M27 → Phase 55 (Multilingual, LAST)

| Phase | Spec # | Feature | Priority | Competitive Reason |
|-------|--------|---------|---------|-------------------|
| **Phase 73** | #1 | Helpful Village Partnership API + Mon Ami Integration + Pricing Parity | 🔴 NOW | Mon Ami building competing org software — lock in Village orgs first. ALSO: add HV-competitive pricing tiers (In-Development $49/mo, Growth $149/mo, Scale $349/mo), 30-day free trial, $1,500 data migration service |
| **Phase 74** | #4 | Employer Caregiver ROI Dashboard | 🟡 M 6–12 | Homethrive won 2026 Lighthouse Award for measurable employer ROI |
| **Phase 75** | #5 | Grief Welcome Path / 48-hour buddy SLA + hospice referrals | 🟡 M 6–12 | Homethrive added loss support Feb 2026 — ThriveAtHome must differentiate by supporting the bereaved SENIOR directly, not just the family |
| **Phase 76** | #6 | Medicare Advantage Outcomes Data Package | 🟡 URGENT | DUOS raised $130M Oct 2025 targeting same MA plans — ThriveAtHome needs outcomes data now |
| **Phase 77** | #8 | Agency Portal Companion Visit Tracking Upgrade | 🔴 NOW | Sensi.AI already selling to agencies ThriveAtHome needs as partners |
| **Phase 78** | #11 | Agency Referral Partner Program | 🔴 NOW | 10 agency partners = 500–2,000 members at near-zero CAC |
| **Phase 79** | #10 | EHR / FHIR R4 Data Bridge for Hospital Referrals | 🟡 M 6–12 | Zero-CAC acquisition channel via hospital discharge planners |
| **Phase 80** | #7 | Competitor Comparison Landing Pages (SEO) | 🟢 Y2 | Papa, GrandPad, DUOS, Homethrive comparison pages |

**Already in build plan (no new phase needed):**
- Spec #2 Gift subscription viral campaign — ✅ Phase 50b/50c/50d gift platform already built
- Spec #3 Multilingual Aria voice personas — ✅ Phase 55 (Multilingual, built LAST)
- Spec #9 Paid companion mobile app — ✅ Phase 48 (Paid Companion Marketplace) includes mobile app

**Helpful Village feature parity gaps (confirmed June 2026):**
- ✅ Parity achieved: events, volunteer matching, member management basics
- ⚠️ Gap: 24/7 volunteer self-service claiming (Phase 68)
- ⚠️ Gap: Document library upload (Phase 72 — upload bug needs fix)
- ⚠️ Gap: Email recipient filtering (Phase 70 — limited groups)
- ⚠️ Gap: Public village website (Phase 71 — not full marketing page yet)
- ⚠️ Gap: Pricing model — HV charges $50/month for small/forming villages; ThriveAtHome needs equivalent In-Development tier (Phase 73)
- ⚠️ Gap: 30-day free trial — HV offers this; ThriveAtHome must too (Phase 73)
- ⚠️ Gap: Data migration service — needed for HV-to-ThriveAtHome conversions (Phase 73)
- ⬜ Minor gap: Zoom module ($10/month in HV) — add Zoom calendar link field to events
- ⬜ Minor gap: SMS texting ($6/month in HV) — available via Twilio once credentials added
- ⬜ Minor gap: Maps/geocoding ($10/month in HV) — not yet built
- 🏆 ThriveAtHome WINS: Aria daily AI check-ins, family dashboard, Human Buddy, Communities, grief support, skill exchange, life story, services marketplace — none of these exist in HV at any price

**Competitive context — key threats from v2 analysis:**
- **DUOS ($130M raised Oct 2025)** — building toward same MA channel. ThriveAtHome's response: move faster on outcomes data (Phase 76), lead with B2C moat DUOS doesn't have, compete on warmth + community vs DUOS's utilitarian benefit navigation
- **Homethrive ($64M raised)** — most direct employer channel competitor. Differentiation: ThriveAtHome reaches the SENIOR (Aria calls daily); Homethrive is family-only
- **Sensi.AI ($98M raised Oct 2025)** — courting same agencies ThriveAtHome needs. Pitch: "Sensi tells you what's wrong. ThriveAtHome keeps your clients engaged between visits"
- **Mon Ami** — building competing org software for same nonprofits as M20 Village Portal. Must lock in Village orgs via Phase 73 before Mon Ami does
- **Meela** — closest Aria analog but feature-only, no ecosystem. Potential acqui-hire candidate in Year 2

## Full Vision Roadmap — M21–M27, Then Multilingual Last (from Comprehensive Specs)

These are genuine features in the original platform vision, now scheduled into the active build sequence after Phases 67–72. Build order: Phases 67–72 → M21 → M22 → M23 → M24 → M25 → M26 → M27 → **Phase 55 Full Multilingual UI (built LAST, after everything else)**.

### M21 — Expanded Volunteer Ecosystem (6 new categories)
- Retired Professionals Network — doctors, nurses, lawyers, CPAs, teachers, engineers, social workers, chefs volunteering expertise (health literacy circles, legal clinics, VITA tax help, tutoring, home safety tech assessments)
- Faith Community Chaplaincy Network — certified chaplain referrals for spiritual care, non-proselytizing, member-requested only
- Corporate Volunteer Program (3-tier: Community Partner 50-200hrs/yr, Champion 200-500hrs/yr, Leader 500+hrs/yr) with skills-based volunteering
- Neighbor Volunteers — same-zip-code members for informal check-ins and quick errands
- Family Volunteer Reciprocity Program — family members of one senior volunteer for other (unrelated) seniors, earning time credits
- Member Ambassador programme — experienced members welcome and guide new members
- Youth in Schools K-12 curriculum integration — elementary pen-pal letters, middle school "Life Stories" interview project, high school mentorship reversal
- Annual Intergenerational Showcase — student-produced life story collections shared at campus events

### M22 — Device & Smart Home Integration Layer
- Companion Device — pre-configured Thrive Android tablet ($99 one-time or $15/month, free with 2yr+ commitment)
- Amazon Alexa Skills + Google Assistant Actions voice interface
- Smart home integration: Echo, Nest, Ring, ADT, Philips Hue, GrandPad
- Wearable integration: Apple HealthKit, Google Fit, Fitbit, Garmin
- Fall detection via wearable signal — emergency protocol within 60 seconds
- No-motion smart home anomaly detection
- HL7 FHIR / Epic / Cerner EHR connectors for clinical data exchange

### M23 — Advanced AI/ML Layer
- Wellness baseline modeling (custom ML on 30-day wearable/sensor/check-in data)
- Behavioral anomaly detection (Isolation Forest time-series)
- Fall risk prediction (XGBoost on sensor + medication + history)
- Social isolation detection via sentiment NLP + engagement trend analysis (beyond Aria call-based detection)
- Grief pattern monitoring via sentiment NLP + behavioral anomaly detection (prolonged grief disorder risk flags)

### M24 — Professional Services Revenue Layer
- Trusted Advisor Directory with paid annual listing fees ($2,400–$6,000/advisor) for elder law attorneys, financial advisors, benefits counselors
- VITA (Volunteer Income Tax Assistance) integration for free tax prep
- 988 Suicide & Crisis Lifeline + SAMHSA helpline explicit embedding throughout platform
- Document vault for advance directives, insurance cards, estate documents

### M25 — Cultural Programming Depth
- Cultural festival calendars with specific dates (Lunar New Year, Diwali, Tết, Chuseok, Eid, etc.)
- Community Potluck Coordination — platform helps organize local in-person potluck dinners
- Cultural Story Circle — elders share homeland festival memories, recorded for life story archives
- Intergenerational Heritage Event — students learn traditions from elders for school projects
- Cultural Craft & Cooking Class — skill exchange tied to festival season (dumpling folding, diya painting)
- Oral history archive in native languages

### M26 — Premium Subscription Add-Ons
- Caregiver Family Plan — $89/month (1 senior + up to 5 family dashboard seats + monthly coordinator call)
- Long-Distance Caregiver Add-on — $19/month (enhanced alerts, task management, video diary)
- Skill Exchange Premium — $9/month (priority matching)
- Communities Premium — $5/month
- Volunteer Concierge — $19/month (premium matching)
- Annual Care Planning Session — $149/session
- Benefits Maximizer Deep-Dive — $79 one-time
- Milestone Birthday Memory Book physical (70th/75th/80th) — $49 one-time, tied to age milestones specifically
- Extra annual legal consultation — $75/consultation

### M27 — Pet & Companion Life Tracking
- Pet profile in member record — proactive pet birthday/anniversary acknowledgment
- Pet milestone celebrations alongside human milestones
- Pet loss circle (distinct from human bereavement circles)

## Geographic Chapter Model

ThriveAtHome uses a hybrid chapter system — national open platform with soft local chapters:

| Concept | How It Works |
|---------|-------------|
| **Open enrollment** | Any member can enroll anywhere in the US immediately |
| **Metro area grouping** | Members auto-assigned to metro area by zip code |
| **Soft chapter** | Every metro area is a soft chapter from day one |
| **Official chapter** | When metro area reaches 50+ active members → activate as official ThriveAtHome Chapter with local coordinator |
| **Volunteer priority** | Same chapter +30 pts, adjacent metro +15 pts, national virtual +0 pts |
| **Events** | Local chapter events shown with "Near you" badge; virtual events always available nationwide |
| **Services** | In-person services filtered by distance radius; phone/video available nationally |
| **Rural members** | Full virtual service always available — no degraded experience |

**New database tables needed (Phase 50f):**
- `metro_areas` — id, chapter_name, city, state, zip_prefixes (text[]), is_active_chapter, chapter_coordinator_id
- Add `chapter_id` and `metro_area` columns to `members` table

**Launch sequence:**
1. Start in Bay Area — build first 50 members there
2. Activate Bay Area as first official ThriveAtHome Chapter
3. Expand to Chicago, New York, LA once Bay Area model proven
4. Rural/small-town members enrolled nationally on virtual service from day one

---

## The Three Core Roles — Architecture

Every feature in the platform maps to one of three roles. This distinction must be maintained across all UI, copy, and feature development:

| Role | Type | Purpose | Plans |
|------|------|---------|-------|
| **Aria** | AI | Daily structured check-ins, wellness data, alerts, celebrations | All plans |
| **Human Buddy** | Human relationship | Assigned person, regular calls/visits, relationship-focused, remembers what matters | Connect, Complete, Premier |
| **Navigator** | Human admin/care | Caseload management, crisis response, service dispatch, care coordination | Complete + Premier (shared pool for Basics/Connect urgent only) |

### Human Buddy Feature — Build Requirements

The Human Buddy is a distinct feature that needs to be clearly represented in the platform:

**Database:** Add `buddy_assignments` table: id, member_id, buddy_type (volunteer/paid_companion), volunteer_id or companion_id, assigned_at, check_in_frequency (twice_monthly/weekly/on_demand), status (active/paused/ended), notes

**Family dashboard:** Add "Your Buddy" card showing: buddy's first name, photo (optional), last contact date, next scheduled contact, a message from the buddy if they left one

**Volunteer dashboard:** Add "My buddy connections" section — different from general volunteer visits. Buddy connections are ongoing relationships, not one-off visits. Show: member name, how long connected, last contact, next scheduled contact, "Log a buddy check-in" button

**Navigator console:** Show buddy assignment status for each member — assigned/unassigned. Unassigned members on Connect+ plans flagged for buddy matching. Navigator can reassign buddies when needed

**Onboarding:** Step 4 plan selection cards updated to clearly show Human Buddy as a key differentiator between Basics and Connect plans

**Plan gating:** Buddy features (browse buddies, request a buddy, buddy messaging) only visible on Connect, Complete, and Premier plans. Basics plan shows locked state with upgrade prompt

---

## Corporate Structure (from Corporate Structure v1.0 doc)

**Entity:** Delaware C-Corp with Public Benefit Corporation (PBC) designation. Not an LLC.
**B Corp:** Start certification Month 3–4. ~$2K–$5K. Recertify every 3 years.
**Foundation:** ThriveAtHome Foundation (501c3) in Year 2–3 when ARR >$500K. 1% revenue model.
**Equity:** 10M founder shares, 4-year vest, 1-year cliff, 83(b) election within 30 days, 10–15% ESOP.
**Fundraising:** SAFE note pre-seed. Impact investors: Pivotal Ventures, a16z Bio Fund, Obvious Ventures, AARP Foundation.

## Aria Design Rules (from Aria Research v4 doc)

**Never say:** "monitoring", "wellness check", "safety call", "check-up", "assessment"
**Always say:** "morning catch-up", "friendly call", "daily chat", "Aria's call"
**Adaptive frequency:** daily (default), 3x/week (opt-down), weekly (resistant seniors)
**Third call:** Aria offers frequency choice explicitly
**First call:** Aria says "Our conversations are private. Your family only sees a friendly summary."
**Context recall:** Reference previous conversations from first week — primary retention mechanism
**Family dashboard:** Shows AI summary ONLY — never the raw transcript

## Buddy Programme Phases (from Buddy Build Spec v1.0 doc)

Phases 33a–33f insert between Phase 33 (Volunteer Portal) and Phase 34 (Grief Support):

| Phase | Name | Status |
|-------|------|--------|
| 33a | Buddy database layer (buddy_assignments, buddy_calls tables) | ✅ Complete — migration 054_buddy_programme.sql confirmed |
| 33b | Buddy assignment system + admin matching UI | ✅ Complete — /admin/buddy-matching page built and tested |
| 33c | Buddy portal — pre-call brief + call logging | ⚠️ Partial — "My Buddies" tab missing from volunteer dashboard (fix queued) |
| 33d | Navigator buddy management tools | ⚠️ Partial — buddy panel missing from navigator member detail (fix queued) |
| 33e | Family dashboard buddy integration | ⚠️ Partial — buddy card not showing for Connect+ plans (fix queued) |
| 33f | Onboarding buddy matching questions (5 questions, Connect+ only) | ✅ Complete — buddy matching questions added to onboarding |

**Corrected plan tiers:**
- Connect $39: Volunteer buddy, weekly calls
- Complete $69: Volunteer buddy, weekly calls
- Premier $129: Buddy bi-weekly + priority matching (within 48 hrs)

## Launch Strategy (from Strategy v4 doc — Parallel Blitz)

**Strategy D — Parallel Blitz** is the recommended launch strategy:
Launch B2C subscriptions + free Communities (cultural heritage + interest circles) + MSW university partnerships simultaneously from Month 1.
Aria calls must be live Week 1 — not deferred.

**Delivery partner go-live schedule:**
- Month 3: Meals on Wheels (free)
- Month 6: GoGoGrandparent, Instacart Business
- Month 9: Lyft Healthcare, Angi/TaskRabbit
- Month 12: Teladoc/MDLive

## Key Design Decisions Made During Build

1. **"Cultural Circles" renamed to "Communities"** — URL /dashboard/cultural-circles redirects to /dashboard/communities. Database table stays as cultural_circles.
2. **20 total communities** — 12 cultural/ethnic + 8 interest-based. Admin can add more via /admin/communities.
3. **Build order changed** — M17 Services Marketplace moved up before M15/M16 for user value. M11 Billing moved up early.
4. **Stub providers** — all paid services (AI, SMS, email, transport, meals) use stubs until credentials added. providers.ts auto-switches to real implementation when env var is set.
5. **Memory Book two formats** — PDF book (multi-page narrative) + Collage (single-page frameable). Both use @react-pdf/renderer.
6. **Gift subscriptions** — /gift page, gift_subscriptions table, supports 1/3/6/12 month gifts.
7. **Volunteer driver verification** — has_drivers_license, license_state, insurance_provider, insurance_expiry columns added for transport volunteers.
8. **Navigator console redesign** — unified action feed showing all pending items across all members, not just a caseload table.
9. **Services dispatch inline** — navigator can dispatch, assign volunteers, and update status without leaving the member detail panel.
10. **HIPAA BAAs pending** — must be signed before real senior health data enters system. Platform is ready but BAAs with Supabase, Twilio, Retell AI, Anthropic, SendGrid not yet signed.

---

*Document version: 4.0 — Updated June 2026 to reflect actual build state*
*Previous versions: v1.0 (initial spec), v2.0 (48-phase granular), v3.0 (64-phase full spec)*
