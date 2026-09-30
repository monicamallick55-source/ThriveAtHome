# GAP BUILD SPEC G6 — New Features: Home Safety, Home Sharing, Encore Careers, Member-in-Need Campaigns

> Gap Build series (G1–G6), written 2026-09-30. Requested by the founder on Sept 30, 2026.
> Same loop and rules as `gaps/GAP_BUILD_PROMPT.md`. Build after G5. G6.0 creates `community_partners`, which G5.1 also uses — G5.1 runs first, so it creates the table using the G6.0 schema, and G6.0 then only adds what's missing. G6 also relies on `acting_member_ids()` and `is_staff()` from G2.0.
> Medicare work requested at the same time is in **G5.1**.

**Partner facts in this file were checked on Sept 30, 2026, but the human must confirm every phone number, eligibility rule and referral process with the partner before a partner record is set to `active`.** Partner rows are seeded as `status='pending_confirmation'` and are hidden from members until an admin activates them.

---

## PHASE G6.0 — Community partners (shared foundation)

One table for every outside organisation ThriveAtHome refers members **out to** (home sharing, home repair, SCSEP, HICAP, job centres…).

**Do not confuse with the existing `referral_partners` table** (migration 058, `/api/admin/referral-partners`): that one lists hospices and hospital social workers who refer people **in** to ThriveAtHome. Leave it unchanged.

**Migration (next free number, e.g. 09X_community_partners.sql):**
```sql
CREATE TABLE IF NOT EXISTS community_partners (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  name              text NOT NULL,
  category          text NOT NULL CHECK (category IN
                    ('home_sharing','home_repair','home_modification','employment','scsep',
                     'medicare_counseling','housing','other')),
  description       text,
  service_counties  text[] NOT NULL DEFAULT '{}',   -- e.g. {'San Mateo'}
  service_zip_prefixes text[] NOT NULL DEFAULT '{}',
  phone             text,
  website           text,
  referral_method   text NOT NULL DEFAULT 'warm_call' CHECK (referral_method IN ('warm_call','member_calls','online_form','email','api')),
  referral_email    text,
  eligibility_notes text,
  cost_to_member    text,                          -- 'Free', 'Sliding scale', etc.
  status            text NOT NULL DEFAULT 'pending_confirmation'
                    CHECK (status IN ('pending_confirmation','active','paused')),
  confirmed_by      uuid REFERENCES family_members(id),
  confirmed_at      timestamptz,
  mou_signed        boolean NOT NULL DEFAULT false
);
ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_read_active" ON community_partners FOR SELECT USING (status = 'active' OR is_staff());
CREATE POLICY "cp_staff_write" ON community_partners FOR ALL USING (is_staff());

CREATE TABLE IF NOT EXISTS partner_referrals (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  partner_id     uuid NOT NULL REFERENCES community_partners(id),
  program        text NOT NULL,                     -- 'home_sharing_provider', 'safe_at_home', 'scsep', …
  consent_given  boolean NOT NULL DEFAULT false,    -- member consented to sharing contact details
  consent_at     timestamptz,
  status         text NOT NULL DEFAULT 'requested' CHECK (status IN
                 ('requested','sent','partner_contacted','in_progress','completed','declined','closed')),
  navigator_task_id uuid REFERENCES navigator_tasks(id),
  notes          text,
  next_check_in  date
);
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_own_or_staff" ON partner_referrals FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());
```
(If G5.1 already created `community_partners`, add any missing columns instead.)

**Rules for every referral:**
- Explicit consent screen before any member detail leaves ThriveAtHome: what is shared, with whom, why. No consent → the member gets the partner's phone number to call themselves (`member_calls`).
- Each referral creates a navigator task and a follow-up check-in (default 14 days) so no referral goes silent.
- `/admin/community-partners`: list, add, confirm, pause partners; filter by category and county. (Separate from `/admin/partners` in G5.9, which manages FHIR API partners.)

**Seed (status `pending_confirmation`):**

| Name | Category | County | Phone | Note |
|---|---|---|---|---|
| Hassett Hardware — Handyman Program | home_repair | San Mateo (Foster City area) | (confirm) | Licensed contractor partner used by Foster City Village's home safety programme; discounted work |
| HIP Housing — Home Sharing Program | home_sharing | San Mateo | 650-348-6660 | Interviews, references, income check and photo ID; matches home providers and seekers; Living Together Agreement; ongoing follow-up; home visits for homebound seniors. Rent exchange or service exchange. www.hiphousing.org |
| Rebuilding Together Peninsula — Safe at Home | home_repair | San Mateo; north Santa Clara | 650-366-6597 | Free safety/health repairs and modifications for low-income homeowners |
| Center for Independence of Individuals with Disabilities (CID) | home_modification | San Mateo | 650-645-1780 | Grab bars, railings, ramps for people with disabilities |
| Felton Institute — SCSEP | scsep | San Mateo; Marin | (confirm) | Senior Community Service Employment Program provider per California Dept. of Aging list |
| NOVAworks Job Center — San Mateo | employment | San Mateo | (confirm) | 1777 Borel Place, Suite 500, San Mateo |
| HICAP of San Mateo County | medicare_counseling | San Mateo | (confirm) | Free Medicare counselling (used by G5.1) |

```
PHASE G6.0 CHECKLIST
[ ] Seeded partners hidden from members until activated; visible to staff
[ ] Admin confirms a partner → status active, confirmed_by/at set
[ ] Referral without consent → no contact details stored for partner; member shown partner phone instead
[ ] Referral with consent → partner_referrals row + navigator task + 14-day check-in
```

---

## PHASE G6.1 — Home Safety & Earthquake Preparedness Program

**Modelled on Foster City Village's 2025–2026 programme (run on Helpful Village)**, which the founder shared on Sept 30, 2026. It must work both for ThriveAtHome members directly and for village orgs running it for their own members from `/org-admin`. That second use is the Helpful Village parity piece.

### How the real programme works (build to this)

| Element | Foster City Village today | What ThriveAtHome builds |
|---|---|---|
| Who can enrol | Full Members only; free to participate | Eligibility rule per programme: org membership tier (e.g. Full only), or ThriveAtHome plan, or open |
| Programme year | Runs as a 2025–2026 cohort; "spaces still available" | Programme with a year, capacity and open/closed enrolment |
| Volunteers | Home Safety Volunteers, open to anyone (non-members, outside Foster City); each oversees 3–5 households | Volunteer role `home_safety_volunteer`; caseload 3–5 homes |
| Training | One session with partner contractors **and** the assigned homeowners; contractor explains the checklist | Training session = event with volunteer + homeowner RSVPs; completion gates inspections |
| Inspection | Volunteer schedules a brief visit, observes and documents concerns (checklist + photos) | Mobile-friendly checklist with photo capture |
| Decision | Org reviews checklist, photos and contractor advice, and picks one of two repair options per home | Coordinator selects a work tier per home (see below) |
| Proposal | Homeowner gets a written proposal and chooses all, some or none of the work | Itemised proposal the member (or family, with member consent) accepts per line item |
| Work | Done only by licensed contractors (Hassett Hardware Handyman Program); volunteer guides completion to the homeowner's satisfaction | Work orders to a contractor partner; volunteer confirms completion with the homeowner |
| Cost | Free basics (grab bars, smoke alarms, bulbs and batteries, installed) plus modest upgrades; beyond contractor discount + village subsidy, the homeowner is quoted the remaining cost | Per line: free / subsidised / member-pays with the amount shown before acceptance |
| Income-qualified | Bigger repairs referred to Rebuilding Together Peninsula | Route line items to a G6.0 community partner (`home_repair`) |
| Extras | Emergency-contact fridge magnet; household Go-Bag; 2026 presentation series (in person or Zoom) on home safety, planning and evacuation | Printable magnet, Go-Bag tracking, presentation series as events |
| Funding | New partnerships and grant funding; sponsor thank-yous | Sponsors/grants recorded per programme; totals reported |
| Sign-up | Name, email, phone, cell, address, membership option, Full Member vs Volunteer, home type (Full Members), comments, consent to terms | Same fields; home type list; consent checkbox |

### Data model (new migration)

- `safety_programs` (id, org_id nullable = ThriveAtHome-run, name, program_year, description, eligibility jsonb e.g. `{"org_tiers":["full"]}`, capacity_households, enrollment_open boolean, starts_on, ends_on, free_item_budget_cents, subsidy_per_home_cents, contractor_partner_id → community_partners, income_referral_partner_id → community_partners, sponsors jsonb [{name, logo_url, amount_cents}], created_by)
- `safety_program_enrollments` (program_id, member_id, home_type `single_family|condo|townhouse|apartment|mobile_home|other`, comments, status `applied|waitlisted|enrolled|training_scheduled|inspected|proposal_sent|work_in_progress|complete|declined|withdrawn`, volunteer_id, income_qualified boolean — self-attested, verified by partner, consent_terms_at)
- `safety_program_volunteers` (program_id, volunteer_id, max_households default 5, trained_at)
- `home_safety_checks` (enrollment_id, member_id, mode `in_person|virtual`, scheduled_at, completed_at, assessor_volunteer_id, assessor_family_member_id, status, report_pdf_path)
- `home_safety_items` (check_id, room, item_key, result `ok|concern|na`, note, photo_path)
- `safety_work_tiers` (program_id, tier_key `basic|enhanced`, label, description) — the "one of two options" the coordinator picks per home
- `safety_proposals` (enrollment_id, tier_key, sent_at, responded_at, status `draft|sent|accepted_all|accepted_some|declined`, total_free_cents, total_subsidy_cents, total_member_cents)
- `safety_proposal_lines` (proposal_id, item_key, description, route `contractor|partner_referral|volunteer|member_diy`, est_cost_cents, contractor_discount_cents, subsidy_cents, member_cost_cents, accepted boolean, work_order_status `not_started|scheduled|done|verified`, completed_at, verified_by_volunteer_at, community_partner_referral_id)
- `go_bags` (enrollment_id, delivered_at, contents_checklist jsonb, next_refresh_due) · `emergency_magnets` (enrollment_id, generated_pdf_path, printed boolean, delivered_at)

All tables have RLS: member/family (via `acting_member_ids()`) see their own; the assigned volunteer sees their 3–5 homes only; org admin sees their programme; staff see all.

### Screens

1. **Programme page + sign-up** (`/dashboard/home-safety`, and public `/org/[slug]/home-safety` for villages): what's included, eligibility, spaces left, sponsors. Sign-up form with the fields above. "Full Member" path checks eligibility; "Volunteer" path is open to anyone and creates a volunteer application with the `home_safety_volunteer` role. Over capacity → waitlist.
2. **Coordinator view** (`/org-admin/home-safety` and `/admin/home-safety`): enrolments; assign volunteers (enforce max 3–5 each); schedule the training session (creates an event, with volunteers and their homeowners invited); review inspections; pick the work tier; build proposals from line items with cost split; track work orders; sponsor/grant totals; export CSV for grant reports (homes served, items installed, dollars by source).
3. **Volunteer view** (`/volunteer/dashboard` → "My Safety Homes"): 3–5 households, training status, schedule inspection, checklist with photo capture, "Work done — confirm with homeowner" per line.
4. **Member view** (member portal + family dashboard if allowed): status timeline, proposal with per-line Accept/Decline and clear cost ("Free", "Covered by the village", "Your cost: $85"), work progress, printable fridge magnet, Go-Bag checklist, upcoming presentations.
5. **Presentation series:** events tagged `home_safety_series` with dial-in/Zoom links (G2.3 external RSVP), shown on the programme page.

### Checklist content (config file, editable without code)

Room by room, including earthquake items: loose rugs and cords · night lighting from bedroom to bathroom · grab bars at toilet and shower · non-slip mats · stair rails both sides · reachable storage · smoke and CO alarms present, tested, batteries · light bulbs working (entrances, stairs) · fire extinguisher · emergency numbers posted · medication storage · phone reachable from the floor · house number visible · **earthquake:** water heater strapped, tall furniture and bookcases anchored, heavy items stored low, gas shut-off location known and wrench present, cabinet latches, emergency water and food supply, flashlight by the bed, evacuation route and meeting place agreed.

### Emergency fridge magnet

A printable PDF sized for a 3.5″ × 2″ magnet sheet: member name, address, emergency contacts (from `members.emergency_contact_1/2_*`), doctor (`doctor_phone`), 911, ThriveAtHome Care Line (Rosa) and Crisis Line (Hope) numbers. Generated from the profile. The member confirms the contents before printing. Nothing clinical is printed beyond what they approve.

### Automatic suggestions (never automatic enrolment)

A suggestion card + navigator task appears when Aria/Grace hears a fall mention, `fall_risk_scores` is MEDIUM/HIGH, the member returns home from hospital (G5.4), or the annual re-check is due. Add the $49 **virtual home safety assessment** add-on (`home_safety_assessment` in `premium_addons`) here; it stays available for members outside a village programme. A navigator does it over video using the same checklist.

### Follow-up

Grace reminder call 30 days after the proposal if accepted work isn't done. Go-Bag refresh reminder yearly (water and batteries). Annual re-check item in Important Dates.

```
PHASE G6.1 CHECKLIST
[ ] Org admin creates a 2026 programme: capacity 20, Full-tier only, contractor partner + Rebuilding Together Peninsula as income referral partner
[ ] Social-tier test member cannot enrol (clear message); Full-tier member can; 21st applicant waitlisted
[ ] Non-member signs up as volunteer → volunteer application with home_safety_volunteer role
[ ] Coordinator assigns 6th home to a volunteer → blocked (max 5)
[ ] Training session event created; inspection can't be scheduled until volunteer + homeowner marked trained
[ ] Volunteer completes checklist with 2 photos on a phone-width screen
[ ] Coordinator picks "basic" tier, builds proposal: grab bar (free), water-heater strap (subsidised), new railing (member pays $85)
[ ] Member accepts 2 of 3 lines → proposal status accepted_some; declined line never becomes a work order
[ ] Income-qualified member's large repair line routes to Rebuilding Together Peninsula referral with consent
[ ] Volunteer marks work done → homeowner confirms → line verified
[ ] Fridge magnet PDF shows the member's contacts and Rosa/Hope numbers; member approves before print
[ ] Grant report CSV totals: homes served, items installed, $ free / subsidised / member-paid, by sponsor
[ ] Fall mention in a real test call → suggestion card + navigator task only
[ ] Volunteer sees only their assigned homes (RLS test)
```

---

## PHASE G6.2 — Home Sharing (referral partner model)

**What:** ThriveAtHome does **not** match housemates itself — screening, background checks and agreements stay with experienced local programmes. ThriveAtHome identifies interest, explains options, makes a warm referral with consent, and supports the member through it. First partner: **HIP Housing** (San Mateo County).

**Member paths:**
- **"I have a spare room"** (home provider) — may want rent income, help around the house, or company.
- **"I need an affordable place to live"** (home seeker) — including seniors facing housing insecurity (links from G5.5 pathway).
- Both explain the two common arrangements plainly: **rent exchange** (reduced rent) and **service exchange** (light chores, cooking or errands instead of some rent — not personal or medical care).

**Flow:** `/dashboard/home-sharing` (and a member-portal card) → short interest form (role, county, timing, what they hope for, any worries) → the platform finds active `home_sharing` partners serving the member's county → consent screen → referral created (G6.0) → navigator task "Warm handoff to HIP Housing" (navigator calls the partner or helps the member call) → check-ins at 14 days and 60 days.
- No partner in the member's county → show "We don't have a home-sharing partner in your area yet" + save interest to `home_sharing_interest` for demand tracking; admin dashboard shows demand by county.
- **Safety content** on the page: the partner screens both sides; never pay deposits or share bank details before meeting through the programme; a family member or navigator can join meetings; the navigator is there if anything feels wrong. Aria/Rosa scam detection (G3.4) also watches for rent-scam patterns ("wire the deposit", "can't meet in person").
- **Family:** family can start the interest form for the member, but the member must give consent themselves (portal, or navigator records verbal consent with date and time).
- **Aria/Rosa:** "home sharing" or "renting out a room" intent → Rosa creates the interest record and navigator task.

**Tables:** `home_sharing_interest` (member_id, role `provider|seeker`, county, timeline, hopes text, concerns text, status, partner_referral_id).

```
PHASE G6.2 CHECKLIST
[ ] San Mateo member → sees HIP Housing (once activated); consent → referral + navigator task + check-ins at 14 and 60 days
[ ] Santa Clara member with no partner → "not in your area yet" + interest saved for demand report
[ ] Family-started request stays pending until member consent recorded
[ ] Rosa test call "I want to rent out my spare room" → interest record + task
[ ] Page includes the safety guidance; no partner details shown for inactive partners
```

---

## PHASE G6.3 — Encore Careers: purpose, volunteering and paid work

**What:** A career-transition hub for members who want meaningful roles — volunteer leadership, part-time paid work, paid community service training (SCSEP), or starting something of their own. It builds on the existing skill exchange profile and retired-professionals volunteer track.

**Partners to identify and contact (human confirms each before activation):**

| Partner | What they offer | Status |
|---|---|---|
| Felton Institute — SCSEP (San Mateo & Marin) | Federally funded paid part-time community service training for low-income adults 55+ | Listed by California Dept. of Aging as the San Mateo County SCSEP provider — confirm contact |
| NOVAworks Job Center (San Mateo) | Public workforce board job centre: job search, training, career coaching | Location confirmed; confirm services for older workers |
| San Mateo County Libraries | Free job and career resources, computer help | Confirm programmes |
| AARP Foundation (Back to Work 50+ and SCSEP nationally) | Job search support for 50+ | National — confirm current programme names |
| AmeriCorps Seniors (RSVP, Senior Companion, Foster Grandparent) | Volunteer service with stipends in some programmes | Find local sponsors |
| CoGenerate (formerly Encore.org) | Encore fellowships, intergenerational roles | Confirm current programmes |
| ThriveAtHome itself | Paid roles: buddy lead, navigator assistant (`/careers/navigator` exists), cultural circle facilitator, peer grief facilitator | Internal |
| Employer partners (M18) and corporate volunteer programmes | Age-friendly part-time roles | From existing employer accounts |

**Build:**
- **Career profile** (opt-in, member portal tab "Purpose & Work"): past roles, skills (reuse skill exchange skills), what they're looking for (`volunteer_leadership | part_time_paid | scsep | mentoring | start_something`), hours/week, remote/in-person, travel radius (G4.3), accommodations needed.
- **Opportunities board:** table `opportunities` (title, org, partner_id, type `volunteer|paid_part_time|scsep|fellowship|internal`, description, location, remote, hours_per_week, pay_range, age_friendly_attested boolean, apply_method `internal|partner_referral|external_link`, status, expires_on). Admin, org admins and employer admins can post (moderated: admin approval before publishing). Filter by type, distance, remote.
- **Matching:** suggest opportunities from the career profile; weekly digest (email/text per preference) of new matches.
- **Apply:** internal roles → application stored and sent to the posting admin; partner programmes → G6.0 referral with consent; external links → open in new tab, record interest.
- **Support:** "Talk to someone about work" → navigator task (or partner referral to NOVAworks). Resume help as a volunteer service sub-type `resume_help` under `tech_help` or a new `career` category in `SERVICE_TYPES`.
- **Safety:** job-scam guard — postings require approval; members warned never to pay to apply or share SSN/bank details before a verified offer; G3.4 detector scans messages about jobs ("pay for training kit", "reship packages").
- **Income note:** a plain-language reminder that earnings can affect some benefits (SSI, Medi-Cal) with a link to benefits counselling — no individual advice.

```
PHASE G6.3 CHECKLIST
[ ] Member builds a career profile → matching opportunities shown by type and distance
[ ] Employer admin posts a role → hidden until platform admin approves
[ ] Apply to SCSEP → partner referral with consent (partner active only after human confirmation)
[ ] Apply to internal role → application visible to posting admin only
[ ] Posting with "pay for your training kit" flagged by fraud detector and blocked from publishing
[ ] Weekly match digest sent to TEST_EMAIL for a test member
```

---

## PHASE G6.4 — Member-in-Need Campaigns (community giving)

**What:** Any member (or their family, or a navigator on their behalf) can ask for help with a specific need — e.g. a hearing aid, a ramp, a month of groceries after a hospital stay — and an admin helps set up a campaign the community can give to.

**Read this first — legal and payments (human must review before launch):**
- Gifts that benefit a specific individual are generally **not tax-deductible** as charitable contributions, even when routed through a charity, and ThriveAtHome is a PBC, not a 501(c)(3). Campaign pages must never promise a tax deduction. Only a partner 501(c)(3) can issue receipts, and only under its own rules.
- **Stripe:** crowdfunding-style fundraising has restrictions on Stripe's Prohibited and Restricted Businesses list. Before building payments, the human confirms with Stripe (or counsel) whether ThriveAtHome may operate member campaigns directly, or must route funds through a partner charity's account via Stripe Connect.
- Default design below is the conservative one: **funds go to a partner organisation (a village or charity) or directly to a vendor for the need — not as cash to the member.** This protects members from exploitation and from benefit-eligibility problems (cash gifts can affect SSI/Medi-Cal).

**Build:**
- **Request** (`/dashboard/campaigns/new`, also from navigator console): need category (health equipment, home repair/safety, food, utilities, transport, technology, other), what it costs, how it will be paid (vendor/invoice), story in the member's own words (optional), photo (optional), privacy level (`first_name_only | anonymous | full_name`), audience (`my_org | my_circles | platform`).
- **Admin review (required):** navigator or org admin verifies the need and cost (quote/invoice upload), checks it against existing free help first (benefits finder, G6.1 partners, Meals on Wheels), sets goal, deadline (max 60 days), recipient of funds (`partner_org` with its Stripe Connect account, or `vendor_payment` held by the org), and publishes. Two-person approval for goals over $1,000.
- **Campaign page:** story, progress bar, goal, days left, organiser org, "how funds are used", no tax-deduction claim unless the recipient org is a verified 501(c)(3) and the admin ticks that box. Donors can give anonymously and leave a short message (moderated). Visible only to the chosen audience; `platform` audience pages require login.
- **Giving:** Stripe Checkout (test mode) with funds to the recipient organisation's Connect account; ThriveAtHome takes **no fee** by default (configurable). Reuse the `donations` table with new columns `campaign_id`, `donor_message`, `is_anonymous`.
- **Closing:** at goal or deadline → admin records how funds were spent (receipt upload), campaign shows "Fulfilled" update; excess funds rule shown up-front (goes to the org's general fund for members in need). Donors get a thank-you and the fulfilled update.
- **Safeguards:** one active campaign per member; members can pause/close their own campaign anytime; the member (not family) must approve the story and privacy level; G3.4 fraud detector scans stories and messages; any donor asking to contact the member directly is refused; admins see a campaign audit trail.

**Tables:** `member_campaigns` (member_id, created_by, org_id, category, title, story, privacy_level, audience, goal_cents, raised_cents, deadline, status `draft|pending_review|live|paused|fulfilled|closed`, recipient_type, recipient_org_id, approved_by, second_approver, fulfilled_note, receipt_path) · `campaign_updates` (campaign_id, body, created_by, created_at).

```
PHASE G6.4 CHECKLIST
[ ] Member drafts a campaign → not visible until an admin approves
[ ] $1,500 goal needs two different approvers
[ ] Page never shows tax-deduction wording unless recipient org is marked verified 501(c)(3)
[ ] Donation in Stripe test mode goes to the recipient org's test Connect account; raised_cents updates via webhook
[ ] Anonymous donor name hidden on page and from member
[ ] Story containing "send me gift cards" flagged by fraud detector and blocked from publishing
[ ] Member closes campaign → donations stop; donors notified
[ ] Family cannot publish without member approval of story and privacy level
```

## Human review (G6 exit gate)

Confirm the six seeded partners by phone/website and activate them in `/admin/community-partners`. Walk a test member through a home safety check, a HIP Housing referral, an SCSEP referral and a small test campaign in Stripe test mode. Get the campaign legal/payments question answered (Stripe + counsel) before enabling G6.4 for real members.
