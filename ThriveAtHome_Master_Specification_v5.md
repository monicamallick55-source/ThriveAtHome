# THRIVEATHOME — COMPREHENSIVE PLATFORM SPECIFICATION
## Architecture, Vision, Build Status & Monetization — Master Edition
### Version 5.0 — June 2026 — Supersedes all prior specification documents

> **This is the single authoritative ThriveAtHome reference document.**
> It contains everything from the original Comprehensive Specs vision (May 2025)
> PLUS every feature, decision, and addition made since (June 2026).
> Nothing from the original vision has been removed. Nothing built since has been lost.
> Status tags show what is ✅ Built, 🔄 In Progress, ⬜ Not Started, or ⏸ Deferred.

---

# 1. VISION & MISSION

ThriveAtHome is a comprehensive digital and human-services platform designed to help adults aged 65 and older live with confidence, safety, purpose, and connection in their own homes — for as long as they choose. It bridges AI-powered intelligence with warm human relationships, volunteer community networks, paid companion services, intergenerational student programs, skill exchange economies, and proactive family engagement.

| Target Users | Core Promise | Launch Markets | Version |
|---|---|---|---|
| Adults 65+ living at home | Independence with community & care | US metros + rural (Bay Area chapter first) | Master Edition — June 2026 |

## 1.1 The Problem We Solve

| Challenge | Current Reality | ThriveAtHome Solution |
|---|---|---|
| Isolation & Loneliness | 40% of seniors report chronic loneliness | Daily AI check-ins, peer connection, volunteer visits, interest groups, Human Buddy programme |
| Safety at Home | Every 11 seconds a senior visits ER for a fall | Smart monitoring (roadmap), fall detection (roadmap), 24/7 concierge line, medication reminders |
| Family Anxiety | Adult children live avg. 400 miles from parents | Proactive family dashboards, real-time health nudges, weekly digests |
| Care Coordination | Seniors navigate 6+ providers with no coordinator | AI care concierge + human navigator + care coordination team on-call |
| Cognitive Decline | 62M+ seniors face mild cognitive impairment | Cognitive engagement tools, skill exchange, early warning alerts |
| Access to Services | Many seniors unaware of benefits they qualify for | Benefits navigator, volunteer matching, paid companion marketplace, service directory |
| Purposelessness | Retirement can rob seniors of identity and contribution | Skill exchange lets seniors teach others; student network brings intergenerational meaning |
| Nutrition & Meals | 25%+ seniors face food insecurity or poor nutrition | Meal delivery, nutrition plans, social dining events coordinated through platform |
| Family Connection Gaps | Families miss occasions, lose touch with senior's life events | Family Events Calendar, senior gift-giving, celebration coordination, Aria proactive reminders |
| Financial Exploitation | Seniors are the most targeted demographic for fraud | Aria scam detection, fraud_flags system, large purchase alerts, never background-checks members |

## 1.2 Core Principles

- AI augments — never replaces — human connection and judgment
- Dignity first: seniors are contributors and teachers, not just recipients of care
- Family is looped in proactively, not reactively
- Community volunteers, paid companions, students, and an assigned human Buddy are core to the ecosystem
- Skill exchange recognizes seniors' wisdom as an asset to be shared
- Cultural identity and belonging are foundational to wellbeing
- Grief and life transitions are met with compassionate, sustained support
- Accessibility and simplicity are non-negotiable for UX
- Privacy, data ethics, and trust are foundational
- **ThriveAtHome is a consumer brand first** — families trust ThriveAtHome; partners use ThriveAtHome; the brand always belongs to ThriveAtHome
- Members are never background-checked — only volunteers, companions, and navigators are
- Age verification is soft (date of birth) — dignity over surveillance

---

# 2. PLATFORM ARCHITECTURE — FIVE-LAYER MODEL

ThriveAtHome is built as a modular, cloud-native platform organized into five integrated service layers feeding a central member data hub. Each layer is independently scalable while sharing context through the unified member profile.

## 2.1 Five-Layer Architecture — Detail

### LAYER 1 — AI CONNECTION & SUPPORT

| Component | Function | Status | Technology | Key Detail |
|---|---|---|---|---|
| Check-In Calls | Daily/adaptive outbound AI voice calls (Aria) | ⏸ Built, deferred until credentials added | Retell AI + Twilio + Anthropic | Conversational, not scripted; adaptive frequency (daily/3x-week/weekly); references prior conversations from week 1 |
| Concierge Line | 24/7 inbound phone line — seniors call for anything | ⏸ Deferred (M9) | AI triage + human escalation | Can request services, just talk, or be routed to care team |
| Family Updates | Post-call summaries + wellness signals sent to family | ✅ Built | LLM summarization | Plain-language, non-clinical; AI summary ONLY shown — never transcript |
| Alerts Engine | Missed call flags, wellness drift detection, crisis routing | ✅ Built | Behavioral rule-based thresholds | Configurable sensitivity; 5-step escalation to navigator or 911 |
| Adaptive Call Frequency | Daily (default) / 3x-week / weekly options | ✅ Designed, ⏸ activates with Aria | Member/family/navigator configurable | Third call offers explicit frequency choice |

**Aria language rules (evidence-based):** Never say "monitoring," "wellness check," "safety call," "check-up," "assessment." Always say "morning catch-up," "friendly call," "daily chat," "Aria's call." First call: "Our conversations are private. Your family only sees a friendly summary — not a recording or transcript." Average call length target: 15 minutes.

### LAYER 2 — HUMAN COMPANION NETWORK

| Component | Function | Status | Model | Key Detail |
|---|---|---|---|---|
| Volunteers | Vetted community companions for phone + in-person visits | ✅ Built (M13) | Free — matched on interests, location, sub-type | Background checked via Checkr; 20+ specific service sub-types |
| **Human Buddy Programme** | Assigned relationship-focused person — distinct from Aria (AI) and Navigator (admin) | 🔄 In progress (Phases 33a–33f) | Connect: weekly volunteer buddy; Complete: weekly volunteer buddy; Premier: bi-weekly + priority companion buddy | Buddy logs calls, flags concerns to navigator, never acts alone on concerns |
| Paid Companions | Errand escorts, event attendance, social visits | 🔄 In progress (Phase 48) | Marketplace: $15–$25/hr; platform takes 20% fee | Requires Stripe Connect setup |
| Student Network | Intergenerational service-hours program | ✅ Built (M13) | University partnership; students earn credit hours | Service hours tracker, PDF service record |
| **Corporate Volunteer Program** | Employee volunteer hours tracked/exported for employer's CSR matching programs | 🔄 In progress (Phase 50l, moved up from M21) | Benevity/YourCause/Bright Funds-compatible CSV export | Distinct from subscription benefit — captures employer's CSR/giving budget separately from HR/benefits budget |
| Care Coordination (Navigators) | Case managers, appointment escorts, crisis support | ✅ Built (M7) | Staff + contracted navigators | Unified action feed console; ratio 1:150 standard, 1:50 Premier (vision target) |

**The Three Core Roles (clear delineation, must never blur in UI/copy):**

| Role | Type | Purpose | Plans | Caseload |
|---|---|---|---|---|
| **Aria** | AI | Daily structured check-ins, wellness data, alerts, celebrations | All plans | Unlimited — 100K+ at same cost |
| **Human Buddy** | Human relationship | Assigned person, regular calls/visits, remembers what matters, relationship-focused | Connect, Complete, Premier | 3–5 seniors per buddy |
| **Navigator** | Human admin/care | Caseload management, crisis response, service dispatch | Complete + Premier (shared pool Basics/Connect, urgent only) | Up to 150 members |

*The boundary that must never blur: a buddy who hears something concerning logs it and escalates to the navigator. The buddy's job is the relationship. The navigator's job is the response.*

### LAYER 3 — COMMUNITY & EVENTS

| Component | Function | Status | Format | Key Detail |
|---|---|---|---|---|
| Virtual Events | Phone-joinable + video group experiences | ✅ Built (M14) | Book clubs, music, trivia, etc. | Dial-in option, no smartphone required |
| Local Events | In-person community gatherings at vetted venues | 🔄 Partial | Libraries, cafés, parks, faith spaces | Transport coordination built in |
| Skill Exchange | Seniors teach skills to other seniors and community members | ✅ Built (M14) | Time banking — teach 1hr, earn 1hr credit | Cooking, crafts, history, languages, gardening, life wisdom |
| Interest Groups (Communities — Interest & Hobby) | Persistent, member-led recurring groups | ✅ Built (M14) — 8 circles seeded: Gardening, Books, Music, Cooking, Faith, Sports, Travel, Crafts | Weekly cadence; self-organizing with platform facilitation | **Vision gap:** original spec also named veterans, LGBTQ+ seniors, widows/widowers support, and professional identity groups as distinct interest groups — not yet built as named circles |
| **Communities — Cultural & Heritage** (formerly "Cultural Circles") | 12 dedicated sub-communities by ethnic/cultural heritage — Latino/Hispanic, Chinese-American, Vietnamese, Korean, South Asian, Filipino, African-American, Jewish, Arab/Middle Eastern, Caribbean, Eastern European, Native American | ✅ Built (M14) — all 12 seeded | Language, content, festivals, matching | Member-led with platform support |
| **Communities** (unified name) | Combines Cultural + Interest circles under one feature | ✅ Built | 20 total communities at launch | Admin can add more via /admin/communities |
| Geographic Chapters | Hybrid national + soft local chapter model | 🔄 In progress (Phase 50f) | metro_areas table, 10 US metros seeded | Bay Area first chapter; auto-activates at 50+ members |

### LAYER 4 — SERVICES MARKETPLACE

| Component | Function | Status | Partners/Method | Revenue Model |
|---|---|---|---|---|
| Transport | Rides to appointments, errands, events | ✅ Built (Phase 45) | Lyft Healthcare (deferred), volunteer drivers | Per-ride fee; 10–15% referral commission |
| Home Services | Repair, cleaning, grocery delivery, tech help | 🔄 In progress (Phase 46) | Vetted local providers, service_providers table | Lead-gen fee + 12–18% commission |
| Health Services | Care navigation, medication reminders, telehealth links | ⬜ Not started (Phase 47) | Teladoc, MDLive (deferred) | Referral fee + subscription |
| Legal / Financial | Estate planning, benefits access, trusted advisors | ⬜ Not started (Phase 47) | Elder law firms, financial advisors | Referral fee; advisors pay directory listing fee (vision) |
| Meals | Meal delivery, nutrition plans, social dining events | 🔄 In progress (Phase 46) | Meals on Wheels (Month 3), Instacart (Month 6) | Per-meal commission |
| Tech Help | In-home tech assistance, scam education | ⬜ Not started (Phase 49) | Volunteers, students, paid specialists | Tiered: free helpline → volunteer visit → paid companion |
| **Companionship & Social** | Walking companion, friendly visits, phone friendship | ✅ Built (7th service category) | Volunteer-matched | Free, part of subscription |
| **Travel Assistance** | Flight/hotel booking help, accessible travel research | 🔄 In progress (8th service category) | Navigator-coordinated, volunteer travel companions | Free coordination |
| **Important Dates & Renewals** (supersedes Prescription Refill Mgmt) | Member-configurable tracking for prescriptions, insurance, licenses, registrations, AAA, passport, gym, appointments — with document upload | 🔄 In progress (Phase 50j, replaces 50a) | Stub: NimbleRx, PillPack for prescriptions specifically | Free, navigator-coordinated |

**Important Dates & Renewals — Full Detail:**

A single flexible system replaces the original narrow Prescription Refill Management feature. Members or family can add any date-based item they want tracked, choosing from 11 preset types or "Other" for full flexibility:

💊 Prescription · 🏠 Home Insurance · 🚗 Car Insurance · 🏥 Health Insurance · 🪪 Driver's License · 📋 Car Registration · 🛣️ AAA Membership · ✈️ Passport · 🏋️ Gym Membership · 📅 Appointment · ➕ Other

**Each tracked item supports:**
- Custom name (e.g. "Honda Civic registration," "Dr. Smith annual physical")
- Expiration or appointment date
- Reminder lead time — sensible defaults per type (5 days for prescriptions, 30 days for insurance/registration/license, 14 days for AAA, 90 days for passport, 1 day plus an optional 7-day reminder for appointments) — fully editable per item
- Recurrence cycle — prescriptions renew every 28 days, insurance/registration/license/AAA every 365 days, passport is one-time — all overridable
- Renewal contact info (phone or website) if known
- **Document upload** — photograph or PDF of the insurance card, registration, or appointment confirmation, stored securely per item

**How it works:** Aria proactively mentions upcoming items during regular check-in calls, the same warm way she mentions family events — "I wanted to remind you that your car registration is coming up on the 15th." The member or family can then choose: snooze the reminder, ask the navigator to help renew it, mark it already handled (which automatically advances recurring items to their next cycle), or — for appointments — reschedule or cancel through the navigator. This turns a single-purpose prescription reminder into a complete life-administration safety net for the senior, with the navigator standing by to actually help when asked.

### LAYER 5 — CELEBRATIONS, CULTURE & TRANSITIONS

| Component | Function | Status | Format | Key Detail |
|---|---|---|---|---|
| Personalized Celebrations | Birthdays, milestones — customized, family-coordinated | ✅ Built (M15) | 7-day arc, gold banner, milestone recognition | celebration_events table |
| Life Story Archive | Personal history preservation | ✅ Built (M15) | 7 entry types incl. First Memory, era grouping | Photo/PDF attachments |
| Memory Book / Collage | Keepsake document generation | ✅ Built (M15) | PDF (multi-page) + Collage (12x12 frameable) | @react-pdf/renderer, Shutterfly-quality |
| Cultural Community Circles | Ethnic-specific communities, festival programming | ✅ Built (M14) | 12 circles | See Section 6 for full detail |
| Grief & Life Transition Support | Bereavement, transitions, diagnosis support | ✅ Built (M16) | Navigator-led; 4 + 5 pathway cards | Anniversary sensitivity, professional referral |
| **Family-Initiated Celebrations** | Family requests special occasion coordination | 🔄 In progress (Phase 50c) | 3 tiers: Digital (free) / Enhanced ($25) / Premier ($75) | Family coordination room |
| **Family Events Calendar & Gift-Giving** | Aria reminds senior of family occasions; senior sends gifts | 🔄 In progress (Phase 50d) | family_events table | Birthdays, anniversaries, graduations, travel, new babies |
| **Gift Sending Platform** | Member-to-family and family-to-member gift coordination | 🔄 In progress (Phase 50b) | Flowers, food, gift cards, cards, baskets | 15% platform commission |

## 2.2 Central Member Profile & Data Hub

| Data Domain | What Is Stored | Who Uses It | Privacy Control |
|---|---|---|---|
| Call History & Transcripts | AI check-in recordings, summaries | Care team; family sees SUMMARY ONLY, never transcript | Senior controls family access level |
| Connection History | Volunteer visits, buddy calls, companion bookings, student interactions | Matching engine, care coordinators | Private; aggregate stats shared with family |
| Service History | Transport, home services, meals, health appointments | Care coordinators, family dashboard | Senior-controlled sharing |
| Wellness Signals | Mood trends, activity, medication adherence, alert history | Family dashboard, care team | Granular consent per data type |
| Community Engagement | Events attended, groups joined, skills taught/learned | Engagement AI, family highlights feed | Senior can hide from family if preferred |
| Celebrations & Milestones | Birthday arcs, achievement celebrations | Family, AI personalization | Member controls public vs private per milestone |
| Grief & Transition Records | Loss events, transition support progress | Navigator, care team only — not shared with family without consent | Highest privacy tier |
| **Buddy Call Records** | Buddy notes, concern flags, family notes, milestone flags | Navigator sees everything; family sees buddy_notes + family_note ONLY | `concern_description` is navigator-only — family NEVER sees this field |
| Preferences & Profile | Communication style, interests, routine, dietary needs, language, cultural background | All layers | Senior editable at any time |
| **Fraud Flags** | Scam detection flags, large purchase alerts | Navigator, family | Visible to family for protection, not punitive |

---

# 3. TECHNOLOGY STACK

## 3.1 Frontend & Interfaces (Built / Active)

- Family Web App: Next.js 16 + Tailwind CSS v4 + TypeScript progressive web app — ✅ Built
- Senior App: React Native (iOS/Android) — ⬜ Vision, not yet built (current platform is phone-call-first, no app required)
- Voice Interface: Amazon Alexa Skills + Google Assistant Actions — ⬜ Roadmap (M22)
- Companion Device: Pre-configured Android tablet — ⬜ Roadmap (M22), $99 one-time or $15/month
- Dial-In Access: Twilio-powered phone number — ⏸ Built, deferred until Twilio credentials added
- Volunteer / Companion / Buddy Portal: Web dashboard — ✅ Built
- Care Coordinator (Navigator) Console: Unified action feed — ✅ Built, redesigned from original caseload-table concept
- Communities Platform (formerly Cultural Circles): 20 community spaces at /dashboard/communities — ✅ Built (English UI; full i18n is Phase 55, builds LAST after M27)

## 3.2 AI & Intelligence Engine

| AI Capability | Technology | Status | Data Inputs | Outputs |
|---|---|---|---|---|
| Voice Check-In Agent (Aria) | Retell AI + Anthropic Claude | ⏸ Built, deferred | Senior voice, prior call history | Structured wellness data, mood score, alert flags |
| Concierge Line Triage | LLM routing | ⏸ Deferred (M9) | Inbound call transcript | Service dispatch or human transfer |
| Wellness Baseline Modeling | Custom ML | ⬜ Roadmap (M23) | 30-day check-in/sensor data | Personalized anomaly thresholds |
| Behavioral Anomaly Detection | Time-series (Isolation Forest) | ⬜ Roadmap (M23) | Behavioral baseline vs current | Alert triggers |
| Family Summary Generation | Anthropic Claude | ✅ Built | Call transcripts, platform events | Plain-language digest |
| Volunteer & Buddy Matching | Constraint scoring algorithm | ✅ Built | Interests, location, language, sub-type | Match scores (+20 city, +15/interest, +20 language, +10 availability) |
| Skill Exchange Matching | Interest graph + time bank ledger | ✅ Built | Skills offered/wanted | Recommended exchanges |
| Fall Risk Prediction | Gradient boosting | ⬜ Roadmap (M23) | Sensor, medication, history | Risk score |
| Social Isolation Detection (NLP-based) | Sentiment NLP | ⬜ Roadmap (M23) — currently rule-based (7 consecutive calls no social mention) | Check-in sentiment, attendance | Outreach triggers |
| Benefits Discovery Engine | Rules engine | ✅ Built (15+ programs) | Zip, income, conditions | Ranked benefits list |
| Celebration Personalization | LLM + life story data | ✅ Built | Life story entries, preferences | Personalized celebration messages |
| Grief Pattern Monitoring | Sentiment NLP + behavioral | ✅ Built (rule-based version) | Check-in sentiment, isolation signals | Prolonged grief risk flags |
| **Fraud / Scam Detection** | Pattern matching on call transcripts and messages | 🔄 In progress (Phase 50g) | Call transcripts, messages | fraud_flags: gift cards, romance scams, tech support scams, lottery scams |
| **Buddy Pre-Call Brief Generator** | Anthropic Claude (claude-sonnet-4, max 200 tokens) | 🔄 In progress (Phase 33a) | Last 2 Aria call summaries | Warm 2–3 sentence brief for buddy before their call |

## 3.3 Backend, Data & Integrations

- Core API: Next.js API routes + Supabase Edge Functions — ✅ Built
- Database: Supabase (PostgreSQL) — ✅ Built, 45+ tables, RLS policies, audit logging
- Real-time: Supabase Realtime + Edge Functions — ✅ Built
- File/Media: Supabase Storage — ✅ Built (member-documents, life-story-attachments, memory-books buckets)
- Phone Infrastructure: Twilio Programmable Voice — ⏸ Built, deferred
- i18n Framework: ⬜ Roadmap (Phase 55, builds LAST after M19–M27 complete) — currently English-only UI

### Key Integration Partners — Status

| Category | Integrations | Status |
|---|---|---|
| AI & Voice | Retell AI, Anthropic Claude, Twilio | ⏸ Built, deferred until credentials |
| Email | SendGrid | ⏸ Built, deferred |
| Background Checks | Checkr | ⏸ Built, deferred |
| Payments | Stripe | ✅ Built (subscriptions, gifts); Stripe Connect for companions 🔄 in progress |
| Transportation | Lyft Healthcare, GoGoGrandparent | ⬜ Not started — Month 6/9 target per Parallel Blitz |
| Meals & Groceries | Meals on Wheels, Instacart Business | ⬜ Not started — Month 3/6 target |
| Telehealth | Teladoc, MDLive | ⬜ Not started — Month 12 target |
| Language Access | Language Line Solutions | ⬜ Not started — Month 6 target |
| Physical Goods | Artifact Uprising, 1-800-Flowers, Goldbelly | ⬜ Not started — Month 6 target |
| Health (Smart Home/Wearables) | Apple HealthKit, Fitbit, Garmin, Echo, Nest, Ring | ⬜ Roadmap (M22) — not in near-term plan |
| Education | Handshake, x2VOL, Track it Forward | 🔄 Handshake Month 1; others roadmap (Phase 56) |
| Volunteer Management | Checkr | ⏸ Deferred |

## 3.4 Security & Compliance

- HIPAA-compliant infrastructure — ✅ Architecture ready; BAAs ⬜ pending signature (Supabase, Twilio, Retell AI, Anthropic, SendGrid)
- SOC 2 Type II — ⬜ Not started; Type I targeted to begin Month 10–11 per Strategy v4
- WCAG 2.1 AA accessibility — ✅ Built and audited
- End-to-end encryption for health data — ✅ Built via Supabase
- Role-based access control — ✅ Built (family, navigator, admin, volunteer, student, employer_admin, agency_admin roles)
- AI audit trails — ✅ Built (audit_log table)
- Grief and transition data: highest privacy tier — ✅ Built, navigator-only by default
- **Buddy concern_description: navigator-only, never shown to family** — ✅ Designed (Phase 33a)
- **Fraud flags visible to family** (different from grief data — these protect, not restrict) — 🔄 In progress

---

# 4. PRODUCT FEATURES & SPECIFICATIONS

## 4.1 Layer 1: AI Connection & Support

### A. Daily AI Check-In Calls (Aria)
- Outbound AI voice call at senior's preferred time — ⏸ built, deferred until Retell AI/Twilio credentials added
- Adaptive frequency: daily (default) / 3x-week (opt-down) / weekly (resistant seniors) — third call offers explicit choice
- Covers: mood, energy, pain, sleep, activity, medication, social connection, appetite
- Multilingual: Spanish + Mandarin priority Phase 1 — ⬜ not yet built (English only currently)
- References prior conversations from the first week — primary retention mechanism
- Senior can skip any day without penalty

### B. 24/7 Concierge Phone Line
- ⏸ Deferred (M9) — dedicated inbound number, AI triage, human escalation within 2 minutes

### C. Family Updates & Reporting
- ✅ Built: weekly digest, post-call summaries, real-time alerts, monthly care summary, milestone celebrations, health timeline
- **AI summary only — never the raw transcript** (trust design + HIPAA)

### D. Alerts & Escalation Engine
- ✅ Built: tiered system (informational → concern → urgent → emergency)
- Missed call: 1 = nudge, 2 consecutive = navigator call, 3 = welfare check protocol
- Wellness drift: 7-day declining trend → care team review
- Crisis language detection: zero AI-only response, immediate human escalation
- Grief monitoring: prolonged grief signals flagged

## 4.2 Layer 2: Human Companion Network

### A. Volunteer Program — ✅ Built (M13)
- Application, Checkr background check (deferred until activated), training modules (vision: 4hrs online, not yet built as formal LMS)
- Smart matching on location, interests, sub-type, language, availability
- 20+ specific service sub-types (medical_transport, grocery_transport, house_cleaning, meal_delivery, smartphone_help, friendly_visit, etc.)
- Impact tracking, visit logging, PDF service record download

### B. Human Buddy Programme — 🔄 In progress (Phases 33a–33f, NEW since original vision)
- Distinct from Aria (AI) and Navigator (admin) — the relationship layer
- Plan tiers: Basics = no buddy; Connect/Complete = weekly volunteer buddy; Premier = bi-weekly + priority companion buddy
- 5 onboarding matching questions for Connect+ members (topics, era, call length, intro note, preferences)
- Matching score: +20 same city, +15/shared interest (max 45), +20 language, +10 availability, -10 at capacity
- Pre-call brief generated by Claude from last 2 Aria summaries
- Post-call logging: duration, quality, notes, optional family note, optional concern flag, milestone marking
- Graceful transitions: "ending" status, two-call handoff with new buddy
- **Critical rule: buddy logs and escalates concerns — never acts alone. Navigator responds.**

### C. Paid Companion Marketplace — 🔄 In progress (Phase 48)
- Vetted workers, background checked, insured, rated
- $15–$25/hr; platform takes 20% fee
- Requires Stripe Connect (not yet activated — build when first real companion ready to onboard)
- **Distinct from free Companionship & Social service request** — paid marketplace is for dedicated/high-commitment companionship (travel, hospital stays, special occasions); free volunteer match is for regular casual connection

### D. Student Network — ✅ Built (M13)
- University partnerships, service hours tracking, PDF service records
- Annual partnership fee vision: $5,000–$20,000/campus
- ⬜ Roadmap: Annual Intergenerational Showcase not yet built

### E. Care Coordination (Navigators) — ✅ Built (M7), redesigned
- Unified action feed (redesigned from original caseload-table concept) — shows all pending items across all members prioritized by urgency
- Service dispatch panel: inline assignment, reassign, reschedule, cancel with reason
- Vision ratio: 1:150 standard, 1:50 Premier

## 4.3 Layer 3: Community & Events

### A. Virtual Events — ✅ Built (M14)
- Phone-dial-in + video, no smartphone required
- Platform-wide events visible to all members
- External events discovery (Meetup, Eventbrite, Luma placeholders)

### B. Local In-Person Events — 🔄 Partial
- Location field built; full venue curation and transport-in-single-booking not yet built

### C. Skill Exchange (Time Banking) — ✅ Built (M14)
- Register skills, time credit ledger, automatic transfer on completion
- Family dashboard highlight: "[Senior] taught her first cooking class!"

### D. Interest Groups / Communities — ✅ Built (M14)
- **8 interest circles built:** Gardening, Books, Music, Cooking, Faith, Sports, Travel, Crafts
- **Vision gap — not yet built as named circles:** veterans support group, LGBTQ+ seniors group, widows/widowers support group, professional identity groups (these were named in the original spec's Interest Groups section and should be considered for addition)
- Admin can create new communities at /admin/communities

### E. Cultural Community Circles — ✅ Built (M14), see Section 6 for full detail

### F. Geographic Chapters — 🔄 In progress (Phase 50f, NEW since original vision)
- Hybrid model: national open enrollment + soft local chapters
- 10 US metros seeded (Bay Area, LA, Chicago, NY, Houston, Phoenix, Philadelphia, San Antonio, Dallas, Seattle)
- Auto-activates as official chapter at 50+ members with local coordinator
- Volunteer/buddy matching prioritizes same chapter (+30) then same state (+15)
- Rural members get full virtual service — no degraded experience

## 4.4 Layer 4: Services Marketplace

7 service categories built (8th — Travel — in progress):

| Category | Status | Sub-types |
|---|---|---|
| Transport | ✅ Built (Phase 45) | Medical, grocery, social, religious, PT, other |
| Home Services | 🔄 In progress (Phase 46) | Cleaning, laundry, yard, safety assessment, repairs, decluttering |
| Meals & Nutrition | 🔄 In progress (Phase 46) | Delivery, grocery shopping, cooking assistance, meal planning |
| Health Services | ⬜ Not started (Phase 47) | Telehealth, medication review, mental health, PT coordination, hospice referral |
| Legal & Financial | ⬜ Not started (Phase 47) | Elder law, estate planning, financial advisor, benefits counseling, fraud assistance |
| Tech Help | ⬜ Not started (Phase 49) | Smartphone, computer, video calling, WiFi, scam prevention, TV/streaming |
| Companionship & Social | ✅ Built | Walking companion, friendly visit, phone friendship, event escort, reading companion |
| **Travel Assistance** (8th, NEW) | 🔄 In progress | Flight booking, hotel research, airport transport, accessible travel, itinerary planning, travel companion, insurance guidance |
| **Roadside Assistance & Car Repair** (9th, NEW) | 🔄 In progress (Phase 50k) | Flat tyre, battery jump, lockout, towing, fuel delivery, minor repair, mechanic referral. Pre-fills from member's AAA membership or car insurance stored in Important Dates & Renewals. Urgent flag bypasses standard queue for roadside emergencies. |

All categories use a single source-of-truth `SERVICE_TYPES` constant — every sub-type, label, icon, and matched volunteer skill is defined once and propagated everywhere (volunteer application, matching, navigator dispatch, family dashboard, all portals).

## 4.5 Layer 5: Celebrations, Culture & Transitions

See Sections 5, 6, 7 for full detail on each component.

---

# 5. PERSONALIZED CELEBRATIONS LAYER

## 5.1 Birthday Celebrations — ✅ Built (M15), 🔄 Enhancements in progress

### Built today:
- Birthday detection cron (D-7 family notification, D-0 dashboard gold banner)
- Milestone recognition: First Check-In, 30-Day Streak

### Vision elements not yet built:
- 7-day celebration arc (currently single-day detection, not full week-long arc)
- Community feed post with hearts/voice messages from other members
- Birthday virtual gathering room
- Volunteer special visit coordination tied specifically to birthday
- Birthday meal delivery from partner restaurant
- Milestone Birthday Special Programs table (70th: life story video; 75th: memory book + special navigator call; 80th: professional phone interview audio recording; 85th/90th/95th/100th: full platform celebration with community toast, governor/mayor letter facilitation)

### NEW since original vision — Family-Initiated Celebrations (Phase 50c):
- Family requests special occasions (Birthday, Anniversary, Homecoming, Recovery Milestone, Holiday) directly from /dashboard/celebrations
- **Three coordination tiers:** Digital (free — personalized Aria call using life story entries + digital family card) / Enhanced ($25 — + volunteer visit + gift coordination) / Premier ($75 — + navigator-coordinated video family gathering + physical memory book)
- Family coordination room for all linked family members
- Navigator handles Enhanced and Premier logistics

## 5.2 Anniversaries & Relationship Milestones
- ✅ Built: wedding anniversary, widowhood anniversary detection via grief module's anniversary sensitivity
- ⬜ Not yet built: friendship anniversaries, pet milestones (roadmap M27)

## 5.3 Personal Achievement Celebrations
- ✅ Partial: 30-day streak badge built
- ⬜ Not yet built: full achievement table (skill-taught-first-time highlights, 1-year platform anniversary card, "returned home from hospital" welcome flow, major life document completion acknowledgment)

## 5.4 Family Events Calendar & Senior Gift-Giving — 🔄 In progress (Phase 50d, NEW since original vision)
- `family_events` table: birthdays, anniversaries, graduations, travel, parties, holidays, new babies
- Aria mentions upcoming family events naturally in check-in calls (7 days before and day-of)
- Senior can send gift to family member via platform (Gift Sending Platform, see 5.6)
- Senior sends physical card — $4.99, platform prints and mails with senior's name signed
- Celebration notes — free digital message from senior to family, shareable link or PDF
- Family travel awareness — Aria adjusts call tone when family member is traveling
- New baby/milestone events — Aria congratulates senior, helps coordinate gift

## 5.5 Gift Sending Platform — 🔄 In progress (Phase 50b, NEW since original vision)
- Gift intent detection in Aria calls → family notification: "[Senior] mentioned wanting to send a gift"
- Gift marketplace: Flowers & Plants, Food & Treats, Books & Activities, Handwritten Cards, Gift Cards, Gift Baskets
- Stub fulfillment: 1-800-Flowers, Goldbelly, Amazon Gift Cards (real integration Month 6 per Parallel Blitz)
- 15% platform commission on all gift orders
- Delivery tracking on family dashboard

## 5.6 Technology Behind Celebrations
- Celebration Calendar Engine: ✅ Built (celebration_events + family_events tables)
- Personalization Layer: ✅ Built — pulls from life story entries, preferences, family notes via Anthropic Claude
- Physical goods fulfillment: ⬜ Not yet integrated (Artifact Uprising, 1-800-Flowers — Month 6 target)
- Celebration Coordinator role: ⬜ Not hired (vision: 1 FTE per 2,000 members)

---

# 6. COMMUNITIES (CULTURAL & INTEREST CIRCLES)

✅ **Built (M14)** — 20 Communities live at /dashboard/communities. Two types: 12 Cultural & Heritage circles (Latino/Hispanic, Chinese-American, etc.) and 8 Interest & Hobby circles (Gardening, Books, Music, Cooking, Faith, Sports, Travel, Crafts). The feature was renamed from "Cultural Circles" to "Communities" — URL /dashboard/cultural-circles redirects to /dashboard/communities. Database table name remains cultural_circles internally.

## 6.1 Communities Framework — Built Today

| Circle Feature | Description | Status |
|---|---|---|
| Cultural Community Space | Dedicated group page: feed, posts, event calendar | ✅ Built |
| Language Settings | Full platform UI in member's language | ⬜ Roadmap (Phase 55, builds LAST after M27) — English only currently |
| Cultural Event Calendar | Festivals and heritage events | 🔄 Generic events built; specific festival calendar with dates not yet built |
| Cultural Content Feed | Culturally relevant content | ⬜ Not yet built |
| Cultural Companion Matching | Volunteer/buddy matching by cultural compatibility | 🔄 Language match scored (+20); specific cultural-heritage matching not yet built |
| Intergenerational Cultural Bridge | Student matched by cultural heritage | ⬜ Not yet built |

## 6.2 Launch Communities — All 12 Cultural & Heritage Circles Seeded ✅

| Cultural Community | Primary Languages | Key Festivals & Observances |
|---|---|---|
| Latino/Hispanic Community | Spanish, Portuguese | Día de los Muertos, Three Kings Day, Posadas, Fiestas Patrias |
| Chinese-American Community | Mandarin, Cantonese | Lunar New Year, Mid-Autumn Festival, Qingming, Dragon Boat, Chongyang |
| Vietnamese-American Community | Vietnamese | Tết, Mid-Autumn Festival, Hung Kings' Day, Buddha's Birthday |
| Korean-American Community | Korean | Chuseok, Seollal, Respect for the Aged Day (Sept 15) |
| South Asian Community | Hindi, Urdu, Punjabi, Bengali, Tamil | Diwali, Holi, Eid al-Fitr, Eid al-Adha, Navratri, Pongal |
| Filipino-American Community | Tagalog, Ilocano, Cebuano | Pasko, Fiesta season, All Saints Day, Flores de Mayo |
| African-American Community | English | Juneteenth, Kwanzaa, Black History Month, MLK Day |
| Jewish-American Community | English, Yiddish, Hebrew | High Holidays, Passover Seder, Hanukkah, Shabbat circles |
| Arab/Middle Eastern Community | Arabic, Farsi, Turkish | Ramadan, Eid al-Fitr, Eid al-Adha, Nowruz |
| Caribbean Community | English, Haitian Creole, French | Carnival, Haitian Flag Day, Caribbean Heritage Month |
| Eastern European Community | Polish, Russian, Ukrainian, Czech | Easter (Orthodox + Catholic), Christmas Eve, independence days |
| Native American / Indigenous | English + tribal languages | Pow Wow season, Native American Heritage Month |

**At launch, M14 build prioritized Latino/Hispanic and Chinese-American circles to go live FREE in Month 1 per Parallel Blitz strategy — the other 10 follow per the build queue.**

## 6.3 Cultural & Interest Programming — Vision, Not Yet Built
- Virtual Festival Gathering, Community Potluck Coordination, Cultural Story Circle (recorded to life story archive), Intergenerational Heritage Event, Cultural Craft & Cooking Class — all ⬜ roadmap (M25, in normal build sequence after M24)

## 6.4 Language Access Across the Platform — Vision, Not Yet Built
- Full i18n framework and multilingual Aria calls — ⬜ Phase 55, builds LAST only after M19 through M27 are all complete. Language Line concierge integration is separate and activates at Month 6 per Parallel Blitz (env var only, does not require the full i18n framework).

---

# 7. GRIEF & LIFE TRANSITION SUPPORT

✅ **Built (M16)** — Core grief and transition pathways are live.

## 7.1 Loss of a Loved One — Bereavement Support

### Built today:
- Grief support request form at /dashboard/grief-support → creates grief_support_requests row
- Check-in frequency auto-updates to daily on submission
- Navigator referral panel: external support referral with type select + notes + Record referral button
- Trusted resources with clickable external links (GriefShare, NAGC, SAMHSA, Hospice Foundation, AFSP, Veterans Crisis Line)
- Anniversary sensitivity — daily check-ins near loss anniversaries
- Prolonged grief detection cron

### Vision elements not yet built:
- Structured immediate response protocol (24hr navigator call, community care message, immediate bereavement companion assignment)
- Formal grief circle groups with specific facilitation model (spousal loss, loss of adult child, sibling/friend loss, pet loss, anticipatory grief, cultural-specific circles)
- Life story "tribute story" recording specifically tied to a loss

## 7.2 Grief Support Groups — Specification (Vision, Not Yet Built)

| Group Type | Members | Facilitation | Cadence |
|---|---|---|---|
| Spousal Loss Circle | 4–8 | Licensed social worker/trained facilitator | Weekly 8wks, then bi-weekly |
| Loss of Adult Child | 4–6 | MSW + peer co-facilitator | Weekly 8wks |
| Loss of Sibling/Friend | 6–10 | Trained peer facilitator | Bi-weekly |
| Pet Loss Circle | 6–12 | Trained peer facilitator | Weekly 4wks, ongoing optional |
| Anticipatory Grief | 4–8 | Palliative social worker | Weekly |
| General Loss & Transition | 8–12 | Trained grief facilitator | Weekly, open enrollment |
| Cultural-Specific Grief Circles | Per community | Culturally matched facilitator | Per need |

## 7.3 Nursing Home / Care Facility Transition Support — Partial
- ✅ Built: "Loss of driving independence" pathway, life transition pathway cards
- ⬜ Not yet built: facility research support, structured 4–6 week pre-move planning, facility liaison protocol, transition circle support group

## 7.4 Life Transition Support Pathways — ✅ Built (Phase 43)
5 pathway cards built: Loss of a loved one, Major health diagnosis, Major life change, Support for caregivers, Loss of driving independence

**Vision additions not yet built as distinct pathways:** divorce/late-life separation, cognitive diagnosis (dementia/MCI) specific pathway, adult child moving away, housing insecurity/forced move

## 7.5 Professional Support Network — Partial
- ✅ Built: navigator referral tracking, external trusted resources with links
- ⬜ Not yet built: formal licensed therapist/counselor network with warm-introduction scheduling, telehealth mental health sessions, chaplaincy network

---

# 8. EXPANDED VOLUNTEER ECOSYSTEM

The vision calls for **8 distinct volunteer categories.** Status today:

| Volunteer Category | Status | Who They Are | What They Do |
|---|---|---|---|
| Community Volunteers (General) | ✅ Built (M13) | Adults applying directly | Phone calls, visits, errands, events |
| College Students | ✅ Built (M13) | University students | Tech help, companionship, life story projects |
| Veteran Volunteers | 🔄 Partial (Phase 57) | Veterans + VSO members | Peer support, benefits navigation, flag ceremonies |
| Youth in Schools (K-12) | 🔄 Partial (Phase 56) | K-12 students | School Partner Portal built; specific curriculum programs (pen-pal, Life Stories project, mentorship reversal) not yet built |
| Retired Professionals | ⬜ Not built | Retired doctors, lawyers, CPAs, teachers, engineers | Health literacy circles, legal clinics, VITA tax help, tutoring, tech help |
| Faith Community Volunteers | 🔄 Partial | Congregation members | Faith community circle built within Communities; chaplaincy referral network not yet built |
| Corporate Volunteer Teams | ⬜ Not built | Employee groups | 3-tier programme (Partner/Champion/Leader) not yet built |
| Neighbor Volunteers | ⬜ Not built | Same zip code members | Informal check-ins, light coordination |
| **Family Volunteers (Reciprocity)** | ⬜ Not built | Other members' family caring for unrelated seniors | Earn time credits helping other families |
| **Human Buddy (NEW category)** | 🔄 In progress | Volunteer or paid companion, assigned relationship | Weekly/bi-weekly relationship-focused calls — distinct from general volunteering |

## 8.2 Youth in Schools Program — Vision Detail (Roadmap M21/Phase 56)
- Elementary (K-5): pen-pal letter writing
- Middle School (6-8): "Life Stories" interview project
- High School (9-12): mentorship reversal — seniors mentor on life skills, students provide tech help
- Safe by design: all communications facilitated through platform, no direct contact info exchanged

## 8.3 Veteran Volunteer Network — Partial (Phase 57)

| VSO Partner | Volunteer Type | Primary Service | Status |
|---|---|---|---|
| VFW | Combat veterans | Peer support, benefits navigation, flag ceremonies | ⬜ Named partnership not yet built |
| American Legion | All-era veterans | Companionship, community events | ⬜ Not yet built |
| DAV | Disabled veterans | Benefits navigation, medical escorts | ⬜ Not yet built |
| AMVETS | All-era veterans | Community service, peer support | ⬜ Not yet built |
| MOAA | Retired officers | Professional mentorship, leadership skills | ⬜ Not yet built |
| USO / Student Veterans of America | Active duty families, student vets | Intergenerational programming | ⬜ Not yet built |

VA benefits navigation volunteer track and VAVS export stub are part of Phase 57 build plan.

## 8.4 Retired Professionals Network — ⬜ Not Built (Roadmap M21)
Health literacy circles (retired physicians/nurses), legal clinics (retired lawyers — literacy not advice), VITA tax help (retired accountants), tutoring/book clubs (retired teachers), tech help/home safety (retired engineers), grief facilitation (retired social workers), cooking classes (retired chefs).

## 8.5 Faith Community Volunteer Network — Partial
- ✅ Built: Faith circle exists as one of the 8 interest communities
- ⬜ Not built: formal denominational MOU partnerships, chaplain referral network for spiritual care (non-proselytizing, member-requested only)

## 8.5a Platform-Wide Additions — Phases 67–72 (build after M20, before M21)

These six features benefit every channel — B2C direct, employer benefits, agency white-label, village/community orgs, and Medicare Advantage. They are not village-specific; they are core platform capabilities that make ThriveAtHome competitive across all markets.

| Feature | What It Does | Applies To | Status |
|---------|-------------|-----------|--------|
| **Phase 67 — Member Self-Service Portal** | Members log in directly (not only through family) to view profile, post needs, see events, update preferences, access life story | All members on all plans | ⬜ Not built — platform currently family-first only |
| **Phase 68 — Volunteer Self-Service 24/7 Claiming** | Volunteers browse and claim open service requests and member needs directly, without navigator/admin intervention | All volunteer categories | 🔄 Partial — navigator dispatch exists, direct claiming not built |
| **Phase 69 — Donations Management** | Record donations, track totals, export donor list for tax receipts, "Donate" option for families | All org types + B2C | ⬜ Not built |
| **Phase 70 — Email/Newsletter Broadcast** | Any admin composes and sends email to their members/employees/clients; filtered subgroups; schedule; basic stats | All admin roles | ⏸ Stub only — activates with SendGrid credentials |
| **Phase 71 — Public Landing Pages** | /chapter/[slug], /org/[slug], /employer/[slug] as proper public-facing marketing pages with about, programs, events, volunteer opps, contact form, SEO | All chapters/orgs/employers | 🔄 Partial — basic /chapter/[slug] exists, not full marketing page |
| **Phase 72 — Document Library** | Upload/organize/share documents (policies, forms, newsletters, care plans) with role-based visibility; Supabase Storage | All admin roles | ⬜ Not built |

**Why these matter across all GTM streams:**
- B2C families: member self-service means seniors can engage directly, not just through an adult child's account
- Employer partners: HR admins need email broadcast to enrolled employees and a public landing page for their benefits portal
- Agency partners: care coordinators need document library for care plans, policies, training materials
- Village/community orgs: all six features are essential for daily village operations
- Medicare Advantage: member self-service and document library are required for clinical-grade care management

## 8.6 Corporate Volunteer Program — 🔄 In Progress (Phase 50l, built early within M17)

A B2B feature distinct from the subscription caregiver benefit — employees volunteer their time on ThriveAtHome (helping seniors generally, not just their own parents), and hours are tracked and exported in formats compatible with corporate giving and volunteer-matching platforms such as Benevity, YourCause, and Bright Funds — the systems companies like Cisco and Genentech use to match employee volunteer hours with cash donations. This captures employer budget from a second line item: the corporate social responsibility/giving budget, separate from the HR/benefits budget that funds the subscription product.

| Tier | Annual Price | Hours/Year | Activities | Recognition |
|---|---|---|---|---|
| Community Partner | $5,000–$15,000 | 50–200 | Group volunteer days, meal delivery, event hosting | Partner badge, press support |
| Community Champion | $15,000–$35,000 | 200–500 | + skills-based volunteering, mentorship | Champion recognition, impact video |
| Community Leader | $35,000–$50,000+ | 500+ | + strategic partnership, employee ambassador | Naming rights, CEO recognition |

**Can be sold standalone or bundled** with the subscription PEPM caregiver benefit — an employer relationship can include either, both, or grow from one to the other over time.

## 8.7 Volunteer Platform Infrastructure

| Feature | Status |
|---|---|
| Unified Volunteer Portal | ✅ Built (single portal, role-based views in progress) |
| Background Check Integration (Checkr) | ⏸ Built, deferred until activated |
| Training Library | ⬜ Not built — formal LMS modules not yet created |
| Smart Matching Engine | ✅ Built (location, interests, sub-type, language, availability scoring) |
| Impact Dashboard | ✅ Built — hours, visits, connections; ⬜ LinkedIn credential integration not built |
| Recognition System (badges, milestones) | ⬜ Not built — 50/100/250/500hr milestone recognition not yet implemented |

---

# 9. FAMILY ENGAGEMENT LAYER

## 9.1 Family Dashboard — ✅ Built (M1–M6)
- Real-time wellness summary, mood timeline, alerts
- Recent highlights, care team directory
- **NEW since original vision:** "Your Buddy" card (Connect+ plans), Family Events Calendar tab, fraud flag alerts, service request details with plain-English status

## 9.2 Proactive Communication System — ✅ Built (core), ⏸ deferred (delivery channels)

| Communication Type | Frequency | Channel | Status |
|---|---|---|---|
| Daily check-in summary | Within 30 min of call | App, SMS | ⏸ Built, deferred (needs Twilio/SendGrid) |
| Weekly wellness digest | Sundays | Email, app | ✅ Cron built |
| Monthly care summary | 1st of month | Email, app | ✅ Cron built |
| Real-time alerts | On trigger | Push, SMS | ✅ Built (Realtime), SMS deferred |
| Milestone celebrations | On event | Email, app, physical card option | ✅ Built |
| Gentle nudge to family | 7+ days no contact | SMS, app | 🔄 In progress (automation rule, Phase 50e) |

## 9.3 Family Coordination Tools — ✅ Built (M1–M6), 🔄 enhanced
- Shared family task board, secure messaging, document vault, care planning
- **NEW:** Family coordination room for celebrations (Phase 50c), Family Events Calendar (Phase 50d),
  Important Dates & Renewals tracker with document upload (Phase 50j — supersedes narrower
  Prescription Refill Management from Phase 50a)
- ⬜ Not yet built: Family onboarding call as a paid $29 SKU, remote caregiving resource library

---

# 10. HUMAN + AI BALANCE — DESIGN SPECIFICATIONS

## 10.1 Human-AI Escalation Matrix

| Interaction | AI Role | Human Role | Escalation Trigger | Status |
|---|---|---|---|---|
| Daily Check-In | Conducts conversation, logs data | Navigator reviews flagged summaries | 3+ concerning check-ins | ✅ Built |
| Concierge Line | Triages request | Human transfer for complex needs | Distress detected | ⏸ Deferred (M9) |
| Medication Reminder | Sends reminders, tracks adherence | Navigator outreach | 72hr non-adherence | 🔄 Partial — refill prediction in progress |
| Emergency SOS | Detects anomaly | Navigator + family + 911 | Any SOS trigger | ✅ Built |
| Social Isolation Risk | Detects withdrawal | Buddy/volunteer outreach | Isolation score threshold | 🔄 Rule-based version built (7-call rule) |
| **Buddy Concern Flag** | N/A | Buddy logs, navigator decides response | Any concern flag | 🔄 In progress (Phase 33a–33d) |
| Crisis / Mental Health | Detects concerning language; NEVER handles alone | Immediate human navigator | ANY flagged crisis language | ✅ Built — zero AI-only response |
| Celebration Coordination | Generates personalized plan | Navigator handles Enhanced/Premier tiers | Milestone birthdays, sensitive anniversaries | 🔄 In progress |
| **Fraud Detection** | Detects scam patterns in calls/messages | Navigator reviews flag, contacts family | Any fraud pattern match | 🔄 In progress (Phase 50g) |
| Life Transition Support | Detects transition signals | Navigator leads all pathways | Any reported transition | ✅ Built |

## 10.2 Care Navigator Model
- Navigators are care coordinators (vision: MSW/RN/gerontology-certified)
- Unified action feed shows all pending items across all members, prioritized by urgency — redesigned from original simple caseload table concept
- AI prepares navigators before interactions (vision: full pre-call brief; built: alert context shown in member detail panel)
- Vision ratio: 1:150 standard, 1:50 Premier

---

# 11. MONETIZATION MODELS — FULL 10-STREAM VISION

| # | Model | Primary Buyer | Mechanism | Status |
|---|---|---|---|---|
| M1 | Nonprofit / Grant Funded | Foundations, government, donors | Grants + sliding-scale fees | ⬜ Not started — ThriveAtHome Foundation planned Year 2–3 |
| M2 | Corporate Employee Benefits | Employers | PEPM | 🔄 Employer portal MVP built; full PEPM billing not yet built |
| M3 | Government Programs | Medicare Advantage, Medicaid, VA | Capitated + PMPM | ⬜ Not started — outreach begins after 12mo outcome data |
| M4 | Insurance Partnerships | Health insurers, LTC insurers | License + outcomes PMPM | ⬜ Not started |
| M5 | B2C — Seniors Direct | Adults 65+ | Subscription | ✅ Built — Stripe billing live |
| M6 | B2C — Adult Children | Family caregivers | Gift sub + family plan | 🔄 Gift subscriptions built; Caregiver Family Plan ($89/mo) not yet built |
| M7 | Community Hub (Travel + Premium) | Members + B2B | Trip fees, commissions | 🔄 Travel Assistance category in progress |
| M8 | Celebrations & Cultural | Members + sponsors | Add-ons, sponsorships, physical goods | 🔄 In progress (Phases 50b/c/d) |
| M9 | Professional Services Network | Members + providers | Referral fees + directory | ⬜ Not started — paid advisor directory listing model not built |
| M10 | Corporate Volunteer Program | Employer clients | Partner fees + employee hour matching (Benevity/YourCause export) | 🔄 In progress (Phase 50l) |

## 11.2–11.7 — Full Pricing Detail (B2C, Employer, Government, Insurance — Vision Reference)

### M5 — B2C Direct (✅ BUILT AND LIVE)

| Plan | Monthly | Annual | What's Included |
|---|---|---|---|
| Thrive Basics | $19/mo | $180/yr | Daily check-ins, alerts, family updates, document vault |
| Thrive Connect | $39/mo | $380/yr | Basics + Communities, events, volunteers, skill exchange, benefits finder, **weekly Human Buddy** |
| Thrive Complete | $69/mo | $660/yr | Connect + navigator (2hr/mo), grief circles, services marketplace, **weekly Human Buddy** |
| Thrive Premier | $129/mo | $1,188/yr | Complete + dedicated navigator (8hr/mo), companion credits ($50/mo), concierge, **bi-weekly priority Buddy** |

### M6 — B2C Adult Children (Vision — Partial Built)

| Product | Price | Status |
|---|---|---|
| Gift Subscription (3 month) | $129 one-time | ✅ Built |
| Gift Subscription (1 year) | $399 one-time | ✅ Built |
| Caregiver Family Plan | $89/month | ⬜ Not built |
| Long-Distance Caregiver Add-on | $19/month | ⬜ Not built |
| Family Onboarding Call | $29 one-time | ⬜ Not built |

### Companion Device Bundle (Vision — Not Built)
$99 one-time or $15/month, included free with 2+ year plan — ⬜ Roadmap M22

### Marketplace & Add-On Revenue (Vision Targets vs Built)

| Revenue Stream | Mechanism | Status |
|---|---|---|
| Paid Companion Marketplace | 20% platform fee | 🔄 In progress (Phase 48) |
| Transportation Referral | 10–15% commission | ⬜ Not started |
| Home Services Marketplace | 12–18% commission | 🔄 In progress (Phase 46) |
| Meals & Nutrition | Per-meal commission | 🔄 In progress (Phase 46) |
| Trusted Advisor Directory | $2,400–$6,000/advisor/yr | ⬜ Not started |
| University Partnerships | $5K–$20K/campus/yr | ⬜ Portal not built; first contract targeted Month 4 |
| Gift Sending Commission | 15% per order | 🔄 In progress (Phase 50b) |
| Celebration Add-Ons | $25/$75 coordination fees | 🔄 In progress (Phase 50c) |
| Skill Exchange / Communities Premium | $5–9/month add-ons | ⬜ Not built |

### Premium Add-On Services Catalog (Full Vision — Mostly Not Built)

| Add-On | Price | Status |
|---|---|---|
| Extra Care Navigator hours | $25/hour | ⬜ Not built |
| Companion Device | $99 one-time or $15/mo | ⬜ Not built |
| Paid Companion Credit Bundle | $100 for $120 credits | ⬜ Not built |
| Home Safety Assessment (virtual) | $49 one-time | ⬜ Not built |
| Annual Care Planning Session | $149/session | ⬜ Not built |
| Family Onboarding Call | $29 one-time | ⬜ Not built |
| Benefits Maximizer Deep-Dive | $79 one-time | ⬜ Not built |
| Milestone Birthday Memory Book (70th/75th/80th specifically) | $49 one-time | 🔄 General Memory Book built; age-milestone-triggered version not built |
| Physical Birthday Card (family co-signed) | $9.99 one-time | 🔄 Senior-to-family card built ($4.99); family-co-signed-to-senior version not built |
| Skill Exchange Premium | $9/month | ⬜ Not built |
| Communities Premium | $5/month | ⬜ Not built |
| Volunteer Concierge (premium matching) | $19/month | ⬜ Not built |
| Extra annual legal consultation | $75/consultation | ⬜ Not built |

---

# 12. PHASED PRODUCT ROADMAP — RECONCILED

The original vision's Phase 0–4 roadmap and the actual build's M1–M27 milestone structure are different numbering systems for the same journey. Here's the mapping:

| Original Vision Phase | Maps to Actual Build Milestones | Status |
|---|---|---|
| Phase 0 — Foundation (Months 1–3) | M1–M6 (Foundation), M7 (Navigator), M11 (Billing), M12 (HIPAA) | ✅ Complete |
| Phase 1 — Launch (Months 4–6) | M13 (Volunteers), M17 partial (Services), early M8/M9/M10 activation | 🔄 In progress |
| Phase 2 — Community (Months 7–12) | M14 (Community), M15 (Celebrations), M16 (Grief) | ✅ Complete |
| Phase 3 — Enterprise (Year 2) | M18 (Enterprise), M19 (Care Industry Partnerships) | ⬜ Not started |
| Phase 4 — National Scale (Year 3) | M20 (Community Orgs, no longer deferred), M21–M27 (Future Roadmap) | ⬜ Not started |
| Final — Language Access | Phase 55 Full Multilingual UI — builds LAST, only after M19 through M27 are all complete | ⬜ Not started |

## Actual Build Status Detail (M1–M20)

| Milestone | Phases | Status |
|---|---|---|
| M1–M6 Foundation | 1–28 | ✅ COMPLETE |
| M7 Navigator Console | 15–16 | ✅ COMPLETE (redesigned to unified action feed) |
| M8 AI Calls | — | ⏸ DEFERRED (built, awaiting Retell AI credentials) |
| M9 Concierge Line | — | ⏸ DEFERRED |
| M10 SMS/Email | — | ⏸ DEFERRED |
| M11 Billing | 24–26 | ✅ COMPLETE |
| M12 Compliance | 27–28 | ✅ COMPLETE (BAAs pending signature) |
| M13 Volunteer Network | 29–33 | ✅ COMPLETE |
| **Phases 33a–33f Human Buddy** | 33a–33f | 🔄 IN PROGRESS (NEW — not in original vision) |
| M14 Community Layer | 34–38 | ✅ COMPLETE |
| M15 Celebrations & Life Story | 39–41 | ✅ COMPLETE |
| M16 Grief & Transitions | 42–44 | ✅ COMPLETE |
| M17 Services Marketplace | 45–50 + 50a–50k | 🔄 IN PROGRESS |
| M18 Enterprise | 51–54 (Phase 55 moved to after M21) | ⬜ NOT STARTED |
| M19 Care Industry Partnerships | 59–62 | ⬜ NOT STARTED |
| M20 Community Organizations | 63–66 | 🔄 IN PROGRESS — Phase 64 complete, Phases 63/65/66 in progress |

**M20 Detail — Phase by Phase:**

| Phase | Name | What It Builds | Status |
|-------|------|---------------|--------|
| 63 | Village / Community Organization Portal | community_orgs, org_programs, org_memberships, member_needs tables; sliding-scale dues; needs bulletin board; Bay Area Village Network seeded with 3 programs | 🔄 In progress |
| 64 | Area Agency on Aging Portal | area_agencies_on_aging, aaa_service_units, oaa_client_assessments tables; Title III tracking (III-B/C1/C2/D/E); NAPIS 17-column CSV export; Bay Area AAA seeded | ✅ Complete |
| 65 | Senior Center Portal | senior_centers, center_dropins, center_activities, room_bookings, congregate_meals tables; drop-in tracking; activity calendar; room booking; SF Senior Center seeded | 🔄 In progress |
| 66 | Network Federation | network_accounts, network_dues tables; VtVN and n4a seeded; aggregate reporting; anonymized benchmarking; /network-admin portal | 🔄 In progress |

**Revenue model:** Annual license fee per organization — $2,400 (Starter, up to 100 members), $6,000 (Growth, up to 500 members), $15,000 (Scale, unlimited members). Separate from per-member B2C subscription revenue.
| M21–M27 Future Roadmap | See table below | ⬜ NOT STARTED — builds after M20, in sequence |
| Phase 55 Full Multilingual UI | — | ⬜ NOT STARTED — builds LAST, only after M27 completes |

## Future Roadmap — M21–M27 (Captures Remaining Original Vision Gaps)

| Milestone | Captures From Original Vision |
|---|---|
| M21 — Expanded Volunteer Ecosystem | Retired Professionals, Chaplaincy, Neighbor Volunteers, Family Reciprocity, Member Ambassador, Youth K-12 curriculum, Intergenerational Showcase (Corporate Volunteer Program moved earlier — built as Phase 50l within M17) |
| M22 — Device & Smart Home Integration | Companion Device, Alexa/Google Assistant, smart home (Echo/Nest/Ring/ADT), wearables, fall detection, EHR connectors |
| M23 — Advanced AI/ML Layer | Wellness baseline ML, behavioral anomaly detection, fall risk prediction, NLP-based isolation/grief detection |
| M24 — Professional Services Revenue Layer | Paid Trusted Advisor Directory, VITA integration, 988/SAMHSA embedding, document vault |
| M25 — Cultural Programming Depth | Festival calendars, potluck coordination, story circles, oral history archive |
| M26 — Premium Subscription Add-Ons | Caregiver Family Plan, all 11 premium SKUs from Section 11 |
| M27 — Pet & Companion Life Tracking | Pet profiles, pet birthday/anniversary, pet loss circle |
| **Phase 55 — Full Multilingual UI (moved from M18, builds LAST)** | Full i18n framework, next-intl, Spanish first then Mandarin/Vietnamese/Tagalog, multilingual Aria calls, Language Line. **Builds only after M19, M20, M21, M22, M23, M24, M25, M26, AND M27 are all complete** — the final feature on the entire roadmap. |

---

# 13. FINANCIAL PROJECTIONS

## 13.1 Long-Term Full-Scale Vision (3-Year, from original Comprehensive Specs)

| Revenue Stream | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| B2C Subscriptions | $2.4M | $13M | $44.8M |
| Employer Benefits (PEPM) | $3.6M | $18M | $52M |
| Government / Medicare Advantage | $1.2M | $12M | $45M |
| Insurance White-Label / Partnerships | $0.5M | $4M | $15M |
| Nonprofit Platform Fees | $0.3M | $1.5M | $4M |
| Companion & Services Marketplace | $0.8M | $4.5M | $14M |
| University + School Partnerships | $0.3M | $1.4M | $3M |
| Community Hub (Travel + Premium) | — | $1M | $5.8M |
| Celebrations & Cultural | — | $0.8M | $3.2M |
| Professional Services Network | — | $0.55M | $2.1M |
| Corporate Volunteer Program | — | $0.5M | $1.8M |
| **TOTAL REVENUE** | **$9.1M** | **$56.8M** | **$190.7M** |

*Target gross margin >70% by Year 2. EBITDA: ($1.2M) Y1 → $26.8M Y2 → $120.7M Y3 at 63% margin at scale.*

## 13.2 Realistic Near-Term Execution Ramp (Parallel Blitz — solo founder bridge to the vision above)

| Channel | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---|---|---|---|---|---|
| B2C subscriptions | $85K–$200K | $400K–$900K | $1.2M–$2.5M | $3M–$6M | $6M–$12M |
| Employer PEPM | $15K–$60K | $150K–$500K | $600K–$1.5M | $1.5M–$4M | $3M–$8M |
| University / schools | $20K–$75K | $100K–$300K | $250K–$600K | $500K–$1M | $800K–$2M |
| Delivery marketplace | $9K–$35K | $110K–$340K | $300K–$800K | $700K–$2M | $1.5M–$4M |
| Memory Book | $5K–$20K | $30K–$80K | $80K–$200K | $200K–$500K | $400K–$1M |
| Companion marketplace | $3K–$12K | $25K–$80K | $80K–$250K | $200K–$600K | $500K–$1.5M |
| Medicare Advantage | — | $50K–$200K | $500K–$2M | $2M–$8M | $5M–$20M |
| **TOTAL** | **$137K–$402K** | **$865K–$2.4M** | **$3M–$7.85M** | **$8.1M–$22.1M** | **$17.2M–$48.5M** |

*This is the realistic Year 1–5 bridge as a solo founder before institutional capital and full team are in place. Once Seed/Series A funding allows hiring the full team in Section 17, growth accelerates toward the long-term vision in 13.1.*

## 13.3 Month-by-Month Year 1 Revenue Ramp (Parallel Blitz)

| Mo | Subs | B2C MRR | Univ. ARR | Mktpl. | Employer | Total | Key Milestone |
|---|---|---|---|---|---|---|---|
| 1 | 5 | $220 | $0 | $0 | $0 | $220 | Week 1: Aria live. Cultural & Heritage Communities launched free. |
| 2 | 12 | $528 | $0 | $0 | $0 | $528 | MSW recruitment. Buddy matching added to onboarding. |
| 3 | 20 | $880 | $0 | $0 | $0 | $880 | First real alert caught and acted on. **Grief Welcome Path live** — hospice + hospital social worker referral partnerships. |
| 4 | 35 | $1,540 | $5K | $0 | $0 | $2,957 | Real prices. First university contract. **Begin employer outreach** — target HR directors at Bay Area 500–5,000 person companies. Enterprise sales cycles are 5–6 months so start now to close at Month 9–10. |
| 5 | 55 | $2,420 | $5K | $0 | $0 | $3,837 | First buddy assignments made. **Grant applications submitted** — RWJF Health Equity, AARP Foundation, local community foundation. |
| 6 | 80 | $3,520 | $10K | $500 | $0 | $5,853 | GoGo + Instacart live. Second university. |
| 7 | 110 | $4,840 | $10K | $1,100 | $0 | $7,773 | All 20 Communities live (12 cultural + 8 interest). |
| 8 | 150 | $6,600 | $15K | $2,000 | $0 | $10,850 | 30+ buddies active. |
| 9 | 200 | $8,800 | $15K | $3,500 | $0 | $14,550 | First employer signed. Lyft + Angi live. |
| 10 | 260 | $11,440 | $20K | $5,200 | $7,500 | $30,307 | 3–4 universities. Employer PEPM begins. |
| 11 | 330 | $14,520 | $20K | $7,500 | $7,500 | $35,687 | AI care plans live. SOC 2 Type I started. |
| 12 | 420 | $18,480 | $25K | $10,500 | $15K | $55,063 | Year-end: 80+ buddies, 4–5 universities, 1 employer. |

## 13.4 Cost Structure (Full-Scale Vision Reference)

| Cost Category | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Engineering & Product | $3.5M | $6M | $9M |
| Care Navigator Team | $2M | $8M | $22M |
| AI / Infrastructure / APIs | $0.8M | $2.5M | $6M |
| Sales & Marketing | $2.2M | $8M | $20M |
| Volunteer & Community Programs | $0.5M | $2M | $5M |
| Celebration & Cultural Programs | $0.3M | $1.5M | $4M |
| G&A / Compliance / Legal | $1M | $2M | $4M |
| **TOTAL OPEX** | **$10.3M** | **$30M** | **$70M** |

---

# 14. CORPORATE STRUCTURE — NEW SINCE ORIGINAL VISION

*(Original vision did not specify entity structure — this section is wholly new, from Corporate Structure v1.0 doc, June 2026)*

- **Entity:** Delaware C-Corporation with Public Benefit Corporation (PBC) designation, filed simultaneously
- **Why not LLC:** Every VC, angel, accelerator, and acquirer expects a Delaware C-Corp; LLC converts poorly and has no preferred stock instrument
- **Formation:** Stripe Atlas or Clerky (~$500–$800). Issue 10,000,000 founder shares at $0.0001/share. File 83(b) election within 30 days. Reserve 10–15% ESOP at formation. 4-year vesting, 1-year cliff.
- **B Corp Certification:** Start B Impact Assessment Month 3–4 (~$2K–$5K). Unlocks university procurement preference, impact investors, AARP/foundation partners.
- **ThriveAtHome Foundation:** Separate 501(c)(3) using 1% revenue model, formed Year 2–3 once ARR exceeds $500K — funds subsidized Community Access memberships for low-income seniors. *(This directly fulfills the original vision's M1 — Nonprofit/Grant Funded revenue stream.)*
- **Pre-seed funding:** SAFE note $100K–$500K. Target impact investors: Pivotal Ventures, Andreessen Horowitz Bio Fund, Obvious Ventures, AARP Foundation investment arm.

---

# 15. LAUNCH STRATEGY — PARALLEL BLITZ (NEW SINCE ORIGINAL VISION)

*(Original vision's Phase 0–4 roadmap was generic by quarter. Strategy v4's Parallel Blitz is the specific, actionable near-term execution sequence.)*

## Formal Launch Protocol — Human-First, AI-Optional

### Core Principle
Trust is earned before technology is introduced. The first 30 days are human-only. Aria AI calls are **opt-in** — seniors choose if, when, and how often Aria calls them. Default is NO.

### The Four Roles

| Role | Who | Notes |
|------|-----|-------|
| Daily wellness pulse | Aria AI (opt-in only) | Only when senior explicitly consents |
| Weekly meaningful conversation | Human buddy/volunteer | Always — regardless of Aria choice |
| Crisis response | Human navigator (always) | Never AI — immediate human callback |
| First 30 days | Human navigator exclusively | Do not automate this period |
| Navigator operations | AI-assisted | Task routing, alert triage, documentation |
| Data intelligence | AI (M23 ML layer) | Pattern detection, fall risk, isolation signals |
| Family reporting | AI-drafted, human-reviewed | Navigator adds personal note before sending |

### 30-Day Launch Sequence

- **Days 1–7:** Navigator personally calls within 24 hours. Builds relationship. Does NOT mention Aria.
- **Days 8–20:** Navigator calls 1–2x/week. Buddy introduced and matched. Human rhythm established.
- **Day 21:** Navigator gently introduces Aria option. Plays sample call if member wants to hear it. Member decides — no pressure. Default is NO.
- **Day 30+:** Aria calls begin ONLY for members who opted in. Human buddy continues weekly regardless.

### Aria Opt-In Design
- Onboarding default: **NO** — senior must actively choose yes
- Options: "Yes daily" / "Yes less often" / "No thank you"
- Changeable anytime from /member-portal → Notifications tab
- "Request a check-in from my navigator" button always visible for opt-out members

### Navigator Role — AI-Augmented, Human-Led
- AI drafts family digests → navigator personalizes before sending
- AI triages alerts → navigator acts immediately on HIGH urgency
- AI detects patterns → navigator follows up with human contact
- Target: 60% relationship/crisis, 25% AI insight review, 15% admin

### Competitive Differentiation
Unlike DUOS (AI only, payer-locked), Papa (human only, payer-locked), or Homethrive (family-facing only): **ThriveAtHome is the only platform where the senior controls if AI contacts them, AND always has a real navigator and real buddy — regardless of their AI choice.**

---

## AI Voice Agent Architecture — 12 Named Agents (September 2026)

| # | Name | Role | Voice | Vercel Env Var |
|---|------|------|-------|---------------|
| 1 | **Aria** | Daily morning companion (outbound) | Warm F, 60s, unhurried | RETELL_AGENT_ID |
| 2 | **Rosa** | Care Line — service requests (inbound) | Warm F, 45, efficient | RETELL_ROSA_AGENT_ID |
| 3 | **Joy** | Celebration calls — birthdays/milestones (outbound) | Joyful F, celebratory | RETELL_JOY_AGENT_ID |
| 4 | **Grace** | Reminder calls — appointments/welfare (outbound) | Clear warm F, purposeful | RETELL_GRACE_AGENT_ID |
| 5 | **Hope** | Crisis support line — 24/7 (inbound) | Calm grounded F | RETELL_HOPE_AGENT_ID |
| 6 | **Claire** | Family support line (inbound) | Professional warm F | RETELL_CLAIRE_AGENT_ID |
| 7 | **Sam** | Volunteer support line (inbound) | Friendly gender-neutral | RETELL_SAM_AGENT_ID |
| 8 | **Morgan** | Buddy support line (inbound) | Warm supportive F | RETELL_MORGAN_AGENT_ID |
| 9 | **Nova** | Navigator assistant — internal only (inbound) | Clear professional | RETELL_NOVA_AGENT_ID |
| 10 | **Alex** | Staff support line (inbound) | Professional gender-neutral | RETELL_ALEX_AGENT_ID |
| 11 | **Quinn** | Concierge — 24/7 + Language Line bridge (inbound) | Warm capable F | RETELL_QUINN_AGENT_ID |
| 12 | **Jordan** | Partner support line — B2B (inbound) | Business professional | RETELL_JORDAN_AGENT_ID |

**Deferred (Phase 55):** Ming (Mandarin), Devi (Hindi), Luna (Spanish) — launch with multilingual UI in order: Mandarin → Hindi → Spanish.
**Aria opt-in:** Default is NO. Senior must actively choose Aria calls. Human navigator calls first 21 days. See Launch Protocol document.
**New database columns (September 2026):** members.aria_call_opted_in (bool), members.check_in_frequency (text), members.grief_loss_type (text), members.preferred_contact_method (text), members.family_can_see_mood (bool), members.family_can_see_call_summaries (bool), members.family_can_see_service_history (bool), members.family_can_see_alerts (bool).

**Strategy D — Parallel Blitz (updated June 2026):** Launch B2C subscriptions + free Communities (12 cultural heritage circles + 8 interest groups) + university/MSW partnerships + **Grief Welcome Path** simultaneously from Month 1 — not sequentially. Aria calls must be live Week 1. **The 12-month Aria data clock for Medicare Advantage starts at Week 1 — this is why Week 1 activation is non-negotiable.**

**Updated timing (three strategic changes from Competitive Positioning v2.0):**
1. **Grief Welcome Path moves to Month 3** (was Month 6) — highest-LTV retention segment, bereaved/widowed seniors stay 3+ years, no competitor has this pathway, requires no unbuilt technology
2. **Employer outreach starts Month 4–5** (was Month 9–10) — enterprise sales cycles are 5–6 months; starting at Month 4–5 means first contracts close at Month 9–10, not starting then
3. **Grant applications submit Month 3** (RWJF Health Equity, AARP Foundation, local community foundations) — parallel revenue track that funds first navigator without equity dilution; B Corp certification (Month 3–4) unlocks most grants
4. **No MA sales motion before Month 12** — DUOS has $130M and is pitching the same MA plans; ThriveAtHome needs 12 months of outcomes data (Phase 76) before any MA conversation is credible

## First 30 Days — Daily Action Plan

| Day | Priority | Required Output |
|---|---|---|
| 1–2 | Business formation | Delaware C-Corp + PBC, EIN, business bank account |
| 2–3 | Core accounts | Supabase, Vercel, Twilio, Retell AI, Anthropic, SendGrid, Stripe, Checkr |
| 3–5 | APIs + Aria test | All credentials in Vercel. Aria calls your own phone. |
| 5–7 | Legal | Attorney engaged. BAAs submitted. Volunteer Agreement covers buddy role. |
| 8–10 | First enrollments | 5 seniors enrolled. Buddy matching questions visible in onboarding. |
| 10–11 | Communities | Latino/Hispanic + Chinese-American Communities live. |
| 12–13 | University outreach | 3 social work chairs contacted. |
| 14 | End-to-end test | Aria call → alert → family SMS → navigator action → buddy concern flag tested. |
| 15–21 | Validate + expand | Interview 5 families. 65+ usability test. Enroll seniors 6–12. |
| 22–24 | Stripe live | Charge $1/mo to confirm payment flow. |
| 25–28 | Meals + Handshake | Meals referral live. Handshake posting live. |
| 29–30 | Month 1 review | Adjust Month 2 plan based on data. |

## Delivery Partner Go-Live Schedule

| Month | Partners Activated |
|---|---|
| Month 1 | Retell AI, Twilio, Anthropic, SendGrid (Week 1) |
| Month 3 | Meals on Wheels (free) · **Launch Grief Welcome Path** · Submit RWJF + AARP Foundation grants |
| Month 4 | First university contract signed |
| Month 6 | GoGoGrandparent, Instacart Business, Language Line, Artifact Uprising |
| Month 9 | Lyft Healthcare, Angi/TaskRabbit |
| Month 10–11 | First full-time care navigator hired; SOC 2 Type I started |
| Month 12 | Teladoc/MDLive |

## Competitive Moat Analysis

| Moat | Build Time | How It Compounds | Action Now |
|---|---|---|---|
| Communities (cultural + interest) | 3–6 months | Each member recruits 2–3 more from same community | Launch Latino + Chinese-American Month 1, free |
| Buddy relationships | 6–12 months | Named buddy who calls weekly = will not cancel | First assignments Month 5 |
| Aria call data | 12–18 months | Every call adds to MA outcomes story | Activate Retell + Anthropic Week 1 |
| Life story archive | Immediate | Families with life story data never cancel | Promote in onboarding for every member |
| Aria signal-to-dispatch | 6–9 months | Each delivery partner deepens detection-to-action loop | Integrate GoGo + Instacart Month 6 |
| University relationships | 3–6 months | Students → professionals refer for 30+ years | Recruit MSW programs Month 2 |

---

# 16. SUCCESS METRICS & OUTCOMES — FULL VISION TARGETS

## 16.1 Senior Wellbeing Outcomes (Long-Term Clinical Targets)
- ER visits reduced 25%+ vs baseline
- Loneliness: 30%+ improvement on UCLA Loneliness Scale
- Medication adherence: >85%
- Fall-related hospitalizations: 20%+ reduction
- Purpose/contribution scores: 40%+ improvement for skill exchange participants
- Senior NPS: target >65

## 16.2 Community & Engagement Metrics
- Check-in completion rate: >80% weekly
- Event participation: >50% monthly
- Skill exchange: >30% participate within 90 days
- Interest group retention: >70% active at 90 days
- Volunteer match fulfillment: >85% within 48 hours
- Student network hours: 10,000+/year by Year 2

## 16.3 Celebrations & Cultural Metrics
- Birthday engagement: >85% of connected members
- Family coordination rate: >60% of birthdays
- Communities participation: >40% of non-English-primary members within 60 days
- Cultural event attendance: >50% monthly
- Language accessibility: >90% task completion in native language

## 16.4 Grief & Transition Support Metrics
- Bereavement response: 100% within 24 hours
- Grief circle participation: >50% within 30 days
- PGD detection: >80% within 90 days
- Nursing home transition retention: >70%
- Transition support satisfaction: >85%

## 16.5 Volunteer Ecosystem Metrics
- Total active volunteers: 5,000 (Y1) → 25,000 (Y2) → 50,000 (Y3)
- School partnerships: 25 → 150 → 500
- Volunteer fulfillment: >88% within 48 hours
- Volunteer retention: >65% at 12 months
- Corporate partnerships: 10 → 100 → 300
- Veteran volunteer network: 2,000 active by Y2
- Volunteer NPS: >70

## 16.6 Near-Term KPI Dashboard (Parallel Blitz — realistic Month 3/6/12)

| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Active paying subscribers | 20 | 100 | 400+ |
| Aria call completion rate | >75% | >85% | >90% |
| Daily call opt-down rate | <20% | <15% | <10% |
| Monthly churn | <8% | <5% | <3% |
| Family dashboard DAU/MAU | >25% | >40% | >50% |
| Buddy assignments active | 0 | 20+ | 80+ |
| Buddy call completion rate | — | >80% | >85% |
| Buddy matching fulfilment | — | <7 days | <5 days |
| Alert-to-human-action rate | >60% | >70% | >80% |
| Cultural circle active members | 30+ | 150+ | 500+ |
| University partnerships signed | 0 | 2 | 4–5 |
| Navigator caseload ratio | <50:1 | <100:1 | <150:1 |
| NPS score | >40 | >50 | >60 |

## 16.7 Financial & Business Metrics (Long-Term Targets)
- CAC: <$120 B2C; <$15,000 employer; <$200,000 MA plan
- LTV:CAC ratio: >15:1 at steady state
- Monthly churn: <2% B2C; <0.5% enterprise
- Gross margin: >70% by Year 2
- Marketplace GMV: $10M+ by Year 3

---

# 17. FOUNDING TEAM & KEY ROLES — FULL-SCALE VISION

| Role | Responsibilities | Ideal Background | Hiring Priority |
|---|---|---|---|
| CEO / Co-Founder | Vision, fundraising, partnerships, culture | Aging/healthcare innovation | Founder (now) |
| CTO / Co-Founder | Platform architecture, AI strategy | Full-stack, healthtech, AI/ML | As needed |
| Chief Care Officer | Care navigator model, clinical protocols | Gerontology, social work | After Series A |
| VP Product | Roadmap, UX, accessibility | Consumer health product | After Series A |
| VP Sales — Enterprise | Employer + insurance + government BD | Healthcare enterprise SaaS | When first MA conversation begins |
| VP Marketing / Growth | Brand, B2C acquisition | Consumer health marketing | After Series A |
| Head of Community Programs | Volunteer, student, skill exchange, Communities (cultural + interest circles) | Community organizing | When 500+ members |
| Head of Cultural Engagement | Cultural strategy, language access | Multicultural community organizing | When 1,000+ members |
| Head of Grief & Transition Services | Grief pathways, professional network | Clinical social work, palliative care | When 1,000+ members |
| Head of Volunteer Ecosystem | All volunteer categories | Volunteer management | When volunteer count exceeds navigator capacity |
| Head of Partnerships | Nonprofit, government, university | Aging services, gov affairs | When first university contract signs |
| Lead Data Scientist | AI models, outcomes research | ML/NLP, health data | When MA outreach begins |
| Head of Compliance | HIPAA, SOC2, gov contracting | Healthcare compliance, legal | Before first MA contract |

**Immediate near-term hiring (per Strategy v4):** First Care Navigator at Month 10–11 (part-time contractor acceptable initially). Everything else follows funding and scale milestones above.

---

# 18. COMPETITIVE LANDSCAPE & DIFFERENTIATION

**Updated Competitive Intelligence — v2.0 (June 2026)**

**New high-priority threats identified:**
- **DUOS** — $130M raised Oct 2025, targeting same MA plans ThriveAtHome plans for Year 2. Response: Phase 76 MA Outcomes Data Package now URGENT.
- **Homethrive** — $64M raised, won 2026 Lighthouse Tech Award for employer ROI. Direct employer channel competitor. Response: Phase 74 Employer ROI Dashboard.
- **Sensi.AI** — $98M raised Oct 2025, courting same agencies ThriveAtHome needs as partners. Response: Phase 77 Agency Visit Tracking Upgrade.
- **Mon Ami** — building competing org software for same Village nonprofits as M20. Response: Phase 73 HV Partnership API must ship before Mon Ami locks in these orgs.

**Strategic verdict:** Helpful Village is a distribution channel, not a competitor. DUOS is the most urgent competitive threat.

| Competitor | Type | Threat | Key Gap ThriveAtHome Fills |
|---|---|---|---|
| **DUOS** | AI benefit navigation (MA/Medicaid payer-only) | 🔴 HIGH — MA channel | Payer-locked, no B2C, no daily voice, no community, no cultural circles |
| **Homethrive** | Employer caregiver benefit (family-facing only) | 🔴 HIGH — employer | Family-only — no senior-facing product, no Aria, no community |
| **Sensi.AI** | Ambient audio monitoring for agencies | 🟡 MEDIUM — agency mindshare | Passive surveillance vs ThriveAtHome's chosen daily conversation |
| **Mon Ami** | Org operations SaaS for nonprofits | 🟡 MEDIUM — org software | Org ops only — no consumer product, no AI, no family dashboard |
| **Meela** | AI voice companion (conversation only) | 🟡 MEDIUM — Aria analog | Feature only, no ecosystem — potential acqui-hire Year 2 |
| Papa Inc. | Companion visits via MA/employer payer | 🟡 MEDIUM — MA channel | Payer-locked, no AI check-ins, no community, no B2C path |
| Best Buy Health / Current Health | Remote patient monitoring | 🟢 LOW — complement | No community, no AI conversation, no cultural layer |
| GrandPad | Simplified tablet device | 🟢 LOW | Device only — no care, no community, no AI |
| Helpful Village | B2B org ops for Village networks | 🟢 LOW — DISTRIBUTION PARTNER | No AI, no family dashboard — turn into channel via Phase 73 |
| Carely / Well | Family coordination apps | 🟢 LOW — complement | Senior absent from product — complement, not replacement |
| Home Instead / Visiting Angels | Professional in-home care | 🟢 LOW — complement | 10x ThriveAtHome's cost, no tech layer — referral source |
| Local Senior Centers | In-person programming | 🟢 LOW — distribution | Geographic limitation — turn into channel via M20 |

### Category Strategy: Own "Senior Belonging Platform"

ThriveAtHome must own and name a new category before any competitor does: **"Senior Belonging Platform."** Every press mention, investor deck, brand asset, and sales pitch should use this language. Category creation lets ThriveAtHome define the rules competitors must compete on.

### Four Acquisition Modes (revised strategy)

| Mode | CAC | Best Targets |
|------|-----|-------------|
| **Mode 1: New segments** | Lowest | Non-English seniors (20M+), rural isolated (12M+), recently bereaved/widowed, caregiver employees at 500–5,000-person companies |
| **Mode 2: Complement** | Low-Medium | Medical alert subscribers, GrandPad families, agency client referrals |
| **Mode 3: Displacement** | High | Caring Village users, Meela users |
| **Mode 4: Distribution channel** | Near zero | Helpful Village 350+ orgs, home care agencies (Phase 78), hospital discharge planners (Phase 79), Mon Ami orgs |

Start with Modes 1 and 4 before investing in Mode 3 displacement.

### B2B Provider Software — Partners, Not Competitors

WellSky, Homecare Homebase, AlayaCare, and AxisCare run 11,000+ home care agencies. They are integration partners, not competitors. ThriveAtHome slots in alongside them as the **member wellness layer** agencies currently have zero of.

| Platform | Market Position | What It Does | What ThriveAtHome Adds |
|---------|----------------|-------------|----------------------|
| **WellSky Personal Care** | Market leader, non-medical home care | Scheduling, billing, EVV, caregiver app, family portal (schedule only) | Member wellness between visits — Aria daily check-ins, mood trends, alert detection, family wellness summary |
| **Homecare Homebase** | Default for large agencies | Clinical documentation, scheduling, billing, OASIS | Zero member engagement — client disappears after visit. ThriveAtHome fills this gap. |
| **AlayaCare** | Mid-large agencies | Scheduling, telehealth, Layla AI (caregiver-facing only), route optimization | Layla is caregiver workflow only — no member wellness, no community, no daily check-ins |
| **AxisCare / CareSmartz360** | SMB agencies | Scheduling, EVV, billing | Pure operational tool — zero member experience |
| **Sensi.AI** | AI monitoring add-on | 24/7 ambient audio, care alerts, agency automation | Passive surveillance vs ThriveAtHome's chosen daily conversation |

**Agency channel pitch:** "Your caregivers visit 3×/week. ThriveAtHome is there the other 4 days. You keep WellSky for scheduling and billing. We complete the member experience."

**What ThriveAtHome explicitly does NOT do** (leave to WellSky/Homecare Homebase):
- EVV (Electronic Visit Verification) — federally mandated, state-by-state, licensed agency territory
- Medicare/Medicaid billing and claims
- Full EHR / OASIS assessments, physician order management
- Ambient audio surveillance (Sensi.AI model) — conflicts with dignity-first principles

### Senior Care Facility Platforms — Out of Scope

PointClickCare, MatrixCare, Yardi Senior Living run assisted living, nursing homes, and memory care facilities. **ThriveAtHome serves only independent aging-at-home seniors.** When a member transitions to a facility, ThriveAtHome provides transition support (Phase 43) and maintains the family dashboard connection, but does not manage facility operations.

### Helpful Village Feature Parity — Gap Tracker (June 2026)

| HV Feature | ThriveAtHome | Phase to Fix |
|-----------|-------------|-------------|
| Member management + renewals | 🔄 Partial | Phase 63 fixes |
| Volunteer 24/7 self-service | 🔄 Partial | Phase 68 |
| Member service request posting | 🔄 Partial (name dropdown bug) | Phase 63 fix |
| Events management + RSVP | ✅ Complete | — |
| Email + newsletters with filtering | 🔄 Partial | Phase 70 enhancement |
| Donations management | 🔄 Partial | Phase 69 |
| Document library | 🔄 Partial (upload bug) | Phase 72 fix |
| Public village website | 🔄 Partial | Phase 71 |
| Wellness check-ins | ✅ SUPERIOR (Aria > HV's $10/mo add-on) | — |
| SMS texting | ⏸ Deferred | Twilio credentials |
| Zoom module ($10/mo in HV) | ⬜ Add Zoom link field to events | Minor |
| Maps/geocoding ($10/mo in HV) | ⬜ Not built | Low priority |
| Pricing ($50/mo for small villages) | ✅ Now spec'd | Phase 73: $49/$149/$349/mo |
| 30-day free trial | ✅ Now spec'd | Phase 73 |
| Data migration from HV | ✅ Now spec'd | Phase 73: $1,500 service |

**ThriveAtHome features with zero Helpful Village equivalent:**
Aria daily AI check-ins · Family proactive wellness dashboard · Human Buddy programme · Care navigator coordination · 20 Communities (cultural + interest circles) · Grief & life transition support · Life story archive · Memory Books · Skill exchange/time banking · Full services marketplace · Personalized celebrations · Geographic chapters · B2C subscription path · Employer PEPM · Medicare Advantage pathway · Corporate volunteer with Benevity/YourCause export

**ThriveAtHome is the only platform that integrates:** (1) proactive AI voice check-ins, (2) 24/7 concierge phone line, (3) paid companion marketplace, (4) volunteer + student networks, (5) skill exchange time banking, (6) persistent interest groups, (7) virtual + local events, (8) full services marketplace including meals, (9) family proactive reporting, (10) human care navigation, (11) personalized celebrations, (12) 20 Communities (12 cultural heritage circles + 8 interest/hobby groups) with language support for cultural heritage circles, (13) grief and life transition support pathways, (14) an 8-category volunteer ecosystem, **(15) a dedicated Human Buddy relationship programme — distinct from AI and admin layers**, and **(16) geographic chapter communities** — all in a single platform, across multiple funding models, owned end-to-end by one trusted consumer brand.

---

# APPENDIX A — GLOSSARY

| Term | Definition |
|---|---|
| AAA | Area Agency on Aging |
| ACO | Accountable Care Organization |
| APS | Adult Protective Services |
| Aria | ThriveAtHome's AI care companion conducting daily check-in calls |
| BAA | Business Associate Agreement (HIPAA) |
| Buddy / Human Buddy | Assigned human relationship-focused volunteer or paid companion — distinct from Aria (AI) and Navigator (admin) |
| Celebration Coordinator | Platform staff role for milestone celebration coordination (vision, not yet hired) |
| Chapter | Soft geographic grouping of members by metro area; activates as official chapter at 50+ members |
| CMMI | Center for Medicare and Medicaid Innovation |
| Communities | Unified feature combining Cultural Circles + Interest Groups (20 total at launch) |
| Communities | The unified feature name for all 20 community circles — 12 Cultural & Heritage (formerly "Cultural Circles") + 8 Interest & Hobby groups. Found at /dashboard/communities. |
| DAV | Disabled American Veterans |
| ERG | Employee Resource Group |
| HCBS | Home and Community-Based Services |
| HIPAA | Health Insurance Portability and Accountability Act |
| MA Plan | Medicare Advantage |
| Member Ambassador | Experienced member welcoming new members (vision, not yet built) |
| MOAA | Military Officers Association of America |
| Navigator | Human care coordinator — admin/crisis response role |
| NEMT | Non-Emergency Medical Transportation |
| PBC | Public Benefit Corporation |
| PEPM | Per Employee Per Month |
| PMPM | Per Member Per Month |
| RSVP Program | Retired and Senior Volunteer Program (federal) |
| Time Banking | 1 hour of service = 1 time credit, regardless of service type |
| VA | US Department of Veterans Affairs |
| VAVS | VA Volunteer Service |
| VFW | Veterans of Foreign Wars |
| VITA | Volunteer Income Tax Assistance |
| VSO | Veterans Service Organization |

---

# APPENDIX B — DOCUMENT CHANGE LOG

| Version | Date | Change |
|---|---|---|
| v1.0 (Comprehensive Specs) | May 2025 | Original full vision — 5 layers, 10 revenue streams, 8-category volunteer ecosystem |
| v2.0–v4.0 (Build Phases) | 2026 | Tactical build documents tracking M1–M20 actual implementation |
| Strategy v4 | June 2026 | Parallel Blitz launch strategy, realistic near-term financial ramp |
| Buddy Build Spec | June 2026 | Human Buddy programme — NEW concept not in original vision |
| Aria Research v4 | June 2026 | Evidence-based Aria language rules, adaptive call frequency |
| Corporate Structure | June 2026 | Delaware C-Corp + PBC, B Corp, Foundation, equity structure — NEW, not in original vision |
| **v5.0 (this document)** | **June 2026** | **Master reconciliation — combines full v1.0 vision with everything built/added through June 2026. Nothing lost from either source.** |

---

*Document: ThriveAtHome Comprehensive Platform Specification — Master Edition v5.0*
*Status: Confidential — internal planning and authorized investor/partner discussions only*
*Owner: Monica Mallick*
*This document supersedes: ThriveAtHome_Platform_Specs_Comprehensive.docx (May 2025), ThriveAtHome_Platform_Overview.md (v1.0), ThriveAtHome_Build_Phases_v4.md as the vision reference (Build Phases v4 remains the tactical build-tracking document for day-to-day development)*
*Next review: When M17 completes, M18 begins, or major strategy shift occurs*
