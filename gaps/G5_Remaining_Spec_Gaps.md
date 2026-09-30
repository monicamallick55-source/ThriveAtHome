# GAP BUILD SPEC G5 — Remaining Spec & Vision Gaps

> Gap Build series (G1–G6), written 2026-09-30 from a full reconciliation of every spec and vision document against the code at commit `abdc412`.
> Same loop and rules as `gaps/GAP_BUILD_PROMPT.md`. Build after G4.
> Documents reconciled: Master Specification v5.1, Platform Specs v2, Strategy v5.1, Competitive Positioning v3, AI Agent Architecture v4, Buddy Build Spec, Launch Protocol v1, Fix Verification & Member Workflows v1, Stub Activation Guide v1, Build Phases v4, prompt.md, prompt-advanced.md, prompt-addons.md, prompt-ui.md.

## How this list was made

1. Every phase heading in the build docs (93 phases) was scanned for the tables and routes it names; each was checked against `supabase/migrations/` and `app/`. Almost all exist.
2. Every feature the vision docs mark as not built, in progress or partial was searched for in the code.
3. Only items with **no code found**, or code that exists but is **never wired up**, are in this file. Everything already covered by G1–G4 is excluded.

## Already built — the Master Spec is out of date on these (do not rebuild)

Health, legal/financial and tech-help service categories (all 9 categories in `lib/services/serviceTypes.ts`) · member portal (Phase 67) · volunteer self-claiming (68) · donations (69) · broadcast email (70) · public pages (71) · document library (72) · buddy programme 33a–33f · Important Dates (50j) · roadside (50k) · corporate volunteer CSV (50l) · MA outcomes API and MA report with ICD-10 and de-identification (54, 76) · ROI dashboard (74) · grief welcome path (75) · agency upgrades (77, 78) · EHR connections (79, partial — see G5.9) · M21–M27 · event waitlist · premium add-ons including Caregiver Family Plan and Long-Distance Caregiver · K-12 portal · retired professionals, chaplaincy and neighbour volunteers.

## Gaps in this file

| Phase | Gap | Source |
|---|---|---|
| G5.1 | Medicare: MA data never populated + member Medicare help | Master Spec §11 M3, Phase 76, user request |
| G5.2 | Paid companion payouts (Stripe Connect) + Premier companion credits | Phase 48, §4.2C, §11 |
| G5.3 | Geographic chapters (no `metro_areas`, no auto-activation, no chapter matching) | Phase 50f, §4.3F |
| G5.4 | Celebrations depth: 7-day arc, milestone-age programmes, achievements | §5.1–5.3 |
| G5.5 | Life transitions depth: 4 pathways, facility-move planning, therapist/chaplain warm intros | §7.3–7.5 |
| G5.6 | Named interest circles + cultural content | §4.3D, §6.1 |
| G5.7 | Plan entitlements: navigator hours, family seats, missing add-on SKUs | §11 pricing, Platform Specs §5 |
| G5.8 | Family daily summary text + event ride in one booking | §9.2, §4.3B |
| G5.9 | FHIR R4 referral endpoint + competitor comparison pages | Phases 79, 80 |
| G5.10 | Volunteer ecosystem completion: VSO partners + VAVS export, corporate tiers, family reciprocity credits | §8.3, §8.6, §8 |

---

## PHASE G5.1 — Medicare: make the MA data real + member Medicare help

**Why:** `/api/admin/ma-report` and `/api/enterprise/outcomes` exist and read `check_in_calls.pain_mentioned`, `medication_adherence`, `social_isolation_signal`, `fall_risk_mention`, `cognitive_concern_signal` and `icd10_codes` (migration 059). **Nothing ever writes those columns** — the call webhook never extracts them. Every MA report is therefore empty. This is the single biggest risk to the Month-12 MA pipeline.

**Part A — populate structured clinical fields (extends G1.4):**
- Extend `AiProvider.extractCallScores` output (and the Anthropic implementation) to return the five booleans above plus `mood_score`, `energy_score`, `pain_score`, `medication_taken`. Prompt the model with member speech only; require JSON; validate with a schema; on invalid output store nulls, never guesses.
- In `processCallEnded` (G1.4) write them to `check_in_calls`.
- Map to ICD-10 using the existing mapping in `lib/alerts/createAlert.ts` (fall risk → `W19`, `Z91.81`; isolation → `Z60.2`; cognitive concern → `R41.82`; pain → `R52`). Store on the call row and on any alert created. Keep the mapping in one constant.
- Honour `members.ml_insights_opt_out`: skip extraction for opted-out members.
- Backfill script: `scripts/backfill-clinical-fields.ts` for calls with a transcript and null fields (batch 50, real Anthropic).

**Part B — MA report hardening:**
- Add audit logging and rate limiting to `/api/admin/ma-report` to match `/api/enterprise/outcomes` (Phase 54 checklist).
- Add a data-quality section to the report: % of calls in the date range with structured fields populated. Suppress the report (with a clear message) below 60% coverage.
- PDF export of the MA pitch data (reuse `@react-pdf/renderer`) alongside the existing CSV.

**Part C — Medicare help for members (user request):**
- Benefits finder: add or confirm entries for Medicare Savings Programs, Extra Help (Part D Low-Income Subsidy), and Medi-Cal for Medicare beneficiaries, with plain-language eligibility screens (no guarantees — "you may qualify").
- New service sub-type under `legal_financial`: `medicare_plan_help` ("Help choosing or changing a Medicare plan"). Routes to a navigator task and, where a partner exists, a warm referral to the local SHIP/HICAP office.
- Partner record for **HICAP of San Mateo County** (free, unbiased Medicare counselling; the state HICAP programme is overseen by the California Department of Aging). Store in `community_partners` — create it here using the schema in G6.0 (`gaps/G6_New_Features.md`); G6.0 will then only add anything missing. Not the existing `referral_partners` table, which is for inbound hospice/hospital referrers. The human must confirm HICAP's phone number and referral process before activation.
- Open Enrollment reminders: seed a yearly Important Dates item type `medicare_open_enrollment` (Oct 15 – Dec 7) for members aged 65+. Aria mentions it once in early October; Grace can place a reminder call if the member asked for help last year.
- Never recommend a specific plan. Copy says "A trained counsellor can compare plans with you for free."

```
PHASE G5.1 CHECKLIST
[ ] Real Aria test call mentioning a fall → pain/fall fields + icd10_codes ['W19','Z91.81'] saved on the call row
[ ] Opted-out member (ml_insights_opt_out=true) → no extraction, fields null
[ ] Invalid model JSON → fields null, call still saved
[ ] MA report for a range with populated calls → non-empty metrics + coverage %; below 60% → suppressed with message
[ ] MA report access writes audit_log; 101st request in window → 429
[ ] PDF pitch export downloads, contains no names/DOBs/addresses
[ ] Benefits finder shows MSP + Extra Help with "you may qualify" wording
[ ] Member requests "Medicare plan help" → navigator task + HICAP referral option (partner inactive until human confirms details)
[ ] 65+ test member has an Oct 15 – Dec 7 Open Enrollment item
[ ] npx tsc --noEmit passes
```

---

## PHASE G5.2 — Paid companion payouts + Premier companion credits

**Why:** `companions` has a `stripe_account_id` column but no onboarding, payout or fee code exists. Premier promises $50/month of companion credits; nothing tracks them.

- **Companion onboarding:** Stripe Connect **Express** accounts. `POST /api/companions/connect/onboard` creates the account and returns an Account Link; `GET /api/companions/connect/return` stores `stripe_account_id` and `payouts_enabled`. Companion cannot be booked until `payouts_enabled=true` AND background check cleared.
- **Booking payment:** member (or family) pays via Checkout with `payment_intent_data.application_fee_amount` = 20% and `transfer_data.destination` = the companion's account. Capture on booking completion (authorise at booking, capture when the companion marks the visit complete and the member/family doesn't dispute within 24h).
- **Credits:** table `companion_credits` (member_id, month, granted_cents, used_cents). Monthly cron grants 5000 cents to Premier members. Checkout applies credits first; platform pays the credited portion to the companion from its balance (separate transfer). Credits expire at month end.
- **Webhooks:** handle `account.updated`, `payment_intent.succeeded`, `charge.refunded` in `/api/webhooks/stripe`.
- Keep the free volunteer companionship path unchanged; the paid path is clearly labelled.

```
PHASE G5.2 CHECKLIST
[ ] Test companion completes Stripe Express onboarding (test mode) → payouts_enabled=true stored
[ ] Booking $60 → PaymentIntent with $12 application fee and destination = companion (verify in Stripe test dashboard)
[ ] Premier member → $50 credit applied, pays $10
[ ] Credits reset next month (run cron with a mocked date)
[ ] Refund → charge.refunded handled, booking cancelled, credit restored
[ ] Companion without payouts_enabled cannot be booked
[ ] npx tsc --noEmit passes
```

---

## PHASE G5.3 — Geographic chapters

**Why:** Chapters currently only exist as `community_orgs` rows shown at `/chapter/[slug]`. The spec's `metro_areas`, 10 seeded metros, 50-member auto-activation and chapter-priority matching do not exist.

- Migration: `metro_areas` (id, slug, name, state, zip_prefixes text[], status `forming|official`, coordinator_family_member_id, activated_at). Seed the 10 metros in §4.3F (Bay Area first). `members.metro_area_id`, `volunteers.metro_area_id`.
- Assignment: on member/volunteer create or address change, set `metro_area_id` from zip prefix (use G4.3 coordinates when available). Rural/unmatched → null ("national").
- Auto-activation cron (weekly): a metro with ≥ 50 active members and a coordinator → `official`, notify admins, create the chapter landing page by linking or creating the `community_orgs` row. Without a coordinator → admin task "Recruit a coordinator".
- Matching: volunteer and buddy scoring `+30` same metro, `+15` same state (apply in `lib/volunteers/match.ts` and buddy matching; keep existing weights).
- `/chapter/[slug]` shows member count, local events and volunteer opportunities for the metro.

```
PHASE G5.3 CHECKLIST
[ ] 10 metros seeded; Bay Area zip → member gets Bay Area metro
[ ] Seed 50 [TEST] members + coordinator → cron flips metro to official; admin notified
[ ] Same-metro volunteer gains +30 in match score (unit test)
[ ] Rural member gets null metro and full service (no errors)
[ ] Test rows cleaned up
```

---

## PHASE G5.4 — Celebrations depth

**Why:** `cron/celebrations` does D-7 family notice and D-0 banner only.

- **7-day birthday arc:** D-7 family notice (exists) · D-5 Aria mentions the birthday (context variable) · D-3 community wishes open (circle members can leave a short message or a voice note via the existing upload pattern) · D-1 family reminder to send a card/gift (links to G3.2) · D-0 Joy call (G1.6) + banner + wishes shown · D+1 thank-you card PDF compiled from wishes. Skip arc members with an active grief request or who opted out (`celebration_opt_out` boolean — add).
- **Milestone-age programmes:** config table `milestone_birthday_programs` (age, offering): 70 life-story video prompt · 75 memory book offer + navigator call · 80 recorded phone interview (Joy asks life questions; recording saved to life story with consent) · 85/90/95/100 full celebration: community toast event auto-created, optional greeting-letter request task for navigator (mayor/governor letter facilitation), memory book. Detected by the celebrations cron 30 days out.
- **Achievements:** table `member_achievements` (member_id, type, occurred_at, shared_with_family). Types: `first_class_taught` (skill exchange completion), `platform_anniversary` (1 year), `home_from_hospital` (navigator marks; triggers a welcome-home flow: buddy call within 48h, meals offer, Grace check-in day 3), `life_document_completed` (e.g. advance directive uploaded to vault). Family highlight card + optional Joy call.

```
PHASE G5.4 CHECKLIST
[ ] Test member with birthday in 7 days → arc steps fire on the right days (cron with mocked dates)
[ ] Circle member leaves a wish → shows on D-0; thank-you PDF on D+1
[ ] Member with active grief request → no arc, skip logged
[ ] Member turning 80 → interview offer created 30 days out
[ ] First skill-exchange class completed → achievement + family highlight
[ ] Navigator marks "home from hospital" → buddy task (48h) + Grace day-3 call scheduled
```

---

## PHASE G5.5 — Life transitions depth

- Add 4 pathway cards to `/dashboard/grief-support` (the transitions page): **Late-life divorce or separation**, **Dementia or MCI diagnosis** (for the member and, separately, for family caregivers), **Adult child moving away**, **Housing insecurity or forced move** (links to G6.2 home sharing and the benefits finder). Each: plain-language description, what the navigator will do, 3–5 trusted external resources (human confirms links), "Talk to my navigator" button → navigator task.
- **Facility-move planning (§7.3):** a 6-week checklist workflow the navigator starts: facility research notes, visits scheduled (with transport requests), paperwork list, family coordination, moving-day plan, post-move check-ins. Table `transition_plans` + `transition_plan_steps`. Family can see steps if the member allows.
- **Professional warm introductions (§7.5):** extend the Trusted Advisor Directory (`trusted_advisors`, migration 065) with categories `therapist` (licensed; store license number + state), `grief_counselor`, `chaplain` (non-proselytising; member-requested only). "Request an introduction" reuses `advisor_connections`. Include telehealth availability flag.

```
PHASE G5.5 CHECKLIST
[ ] 4 new pathway cards render; "Talk to my navigator" creates a task with the pathway name
[ ] Navigator starts a facility-move plan → 6 weeks of steps created; family sees them only when allowed
[ ] Therapist listing requires license number; member requests intro → advisor_connections row
[ ] Chaplain intro only available when member requests it (not suggested automatically)
```

---

## PHASE G5.6 — Named interest circles + cultural content

- Seed 4 circles (`community_type='interest'`): **Veterans Circle**, **LGBTQ+ Seniors Circle**, **Widows & Widowers Circle**, **Professional Identity Circle** (retired teachers, nurses, engineers… with a `profession` tag filter).
- LGBTQ+ circle privacy: add `cultural_circles.membership_visibility` (`public|members_only|private`). For this circle default `private`: membership never shown on the family dashboard, in directories, or to non-members; join requires a confirmation screen explaining privacy.
- Widows & Widowers circle is suggested (not auto-joined) when `grief_loss_type='partner'`, only after the navigator's first grief call.
- **Cultural content feed (§6.1):** table `circle_content` (circle_id, title, body, media_url, source_url, publish_on, created_by). Admin/coordinator posts recipes, music links, festival stories; shown as a "From the community" rail on circle pages. No scraping; links only.

```
PHASE G5.6 CHECKLIST
[ ] 4 circles visible in /dashboard/communities
[ ] LGBTQ+ membership hidden from family dashboard, directory and non-members (RLS test)
[ ] Partner-loss member sees Widows & Widowers suggestion only after navigator grief call
[ ] Admin posts cultural content → appears on that circle's page only
```

---

## PHASE G5.7 — Plan entitlements + missing add-on SKUs

- `lib/plans/entitlements.ts`: single source of truth per plan — navigator hours/month (Complete 2, Premier 8), family seats (Connect 3, Complete 5, Premier 8 per Platform Specs §5), buddy cadence, companion credits (G5.2), Thrive Device (G4.5). UI and APIs read from here.
- Navigator time logging: `navigator_time_entries` (member_id, navigator_id, minutes, activity, logged_at). Navigator console shows hours used vs entitlement per member; at 80% show a banner; beyond entitlement offer **Extra navigator hours ($25/hour)** add-on.
- Family seat limit enforced on invitations (`/api/invitations`) with an upgrade prompt.
- Add missing SKUs to `premium_addons`: `family_onboarding_call` ($29 one-time → navigator task), `extra_navigator_hours` ($25/hour), `companion_credit_bundle` ($100 for $120 credits → G5.2), `family_cosigned_birthday_card` ($9.99 → G3.2 card flow with multiple family signatures). `home_safety_assessment` ($49) is built in G6.1.

```
PHASE G5.7 CHECKLIST
[ ] Connect member cannot invite a 4th family member (clear upgrade message)
[ ] Navigator logs 100 min on a Complete member → 80% banner shows
[ ] Each new SKU purchasable in Stripe test mode and creates its fulfilment task/credit
```

---

## PHASE G5.8 — Family daily summary text + event ride in one booking

- **Daily summary (§9.2):** after `processCallEnded` saves an `ai_summary`, if `family_can_see_call_summaries` and the family contact's `preferred_contact_method` is text, send a short text (≤ 320 chars, no health scores, link to dashboard) within 30 minutes. Respect quiet hours 9pm–8am in the member's timezone (queue until 8am). Never include transcript text.
- **Event ride (§4.3B):** on RSVP to an in-person event, ask "Do you need a ride?" → creates a transport `service_bookings` row linked to the event (`booking_details.event_id`), using the member's home address and event location, arriving 15 minutes early, with a return trip. Cancelling the RSVP cancels the ride.

```
PHASE G5.8 CHECKLIST
[ ] Real test call → family text to TEST_PHONE_NUMBER within 30 min containing no scores
[ ] Call at 10pm → text held until 8am
[ ] RSVP with ride → two linked transport bookings; cancel RSVP → both cancelled
```

---

## PHASE G5.9 — FHIR R4 referral endpoint + comparison pages

- **Phase 79:** `/api/fhir/r4/ServiceRequest` (POST) accepts a FHIR R4 `ServiceRequest` + `Patient` bundle from a hospital discharge planner using a partner API key (reuse `partner_api_keys`). Creates a pending referral (not a member): `hospital_referrals` table with minimal demographics, reason, discharge date, consent flag. Navigator reviews and contacts the patient; nothing is enrolled automatically. `GET /api/fhir/r4/metadata` returns a CapabilityStatement. `/admin/partners` lists partners and their keys.
- **Phase 80:** static marketing pages `/compare/duos-alternative`, `/compare/papa-alternative`, `/compare/homethrive-alternative`, `/compare/grandpad-vs-thriveathome`. Facts must be neutral and sourced; the human approves copy before publishing (add `noindex` until approved).

```
PHASE G5.9 CHECKLIST
[ ] Valid FHIR bundle with partner key → 201 + hospital_referrals row + navigator task
[ ] Missing/invalid key → 401; malformed bundle → 400 with OperationOutcome
[ ] /metadata returns a valid CapabilityStatement
[ ] 4 compare pages render with noindex until approved
```

---

## PHASE G5.10 — Volunteer ecosystem completion

- **VSO partners (§8.3):** `volunteers.vso_affiliation` (VFW, American Legion, DAV, AMVETS, MOAA, other) chosen on the application; filter and reporting by VSO; **VAVS hours export** CSV (volunteer name, VSO, date, hours, service type) from `/admin`.
- **Corporate volunteer tiers (§8.6):** `corporate_volunteer_programs.tier` (`partner|champion|leader`) with hour targets (200/500/500+) and a progress bar in `/employer-admin`; recognition badge on the employer's public page.
- **Family reciprocity (§8):** family members of members can volunteer for *other* seniors; hours earn time-bank credits (skill exchange ledger) that their own senior can redeem. Guard: a family volunteer can never be matched to their own senior.

```
PHASE G5.10 CHECKLIST
[ ] Volunteer with VFW affiliation appears in VAVS export with correct hours
[ ] Employer at 150/200 hours on Partner tier shows 75% progress
[ ] Family volunteer never offered their own senior's requests; hours credit their senior's time bank
```

## Human review (G5 exit gate)

Run one real Aria call that mentions a fall and pain, then open the MA report and see it counted. Book a paid companion with a Premier test member and see the $50 credit and 20% fee in the Stripe test dashboard. Check the LGBTQ+ circle is invisible from a family account.
