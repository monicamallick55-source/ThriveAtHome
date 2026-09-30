# GAP BUILD SPEC G4 — Helpful Village Parity Finish + Remaining Platform Gaps

> Gap Build series (G1–G4), written 2026-09-30 from a code audit of commit `abdc412`.
> Same loop as prompt.md. G4.1–G4.3 (village parity) can run in parallel with G2/G3. G4.4–G4.8 follow in the order listed.

## Already done — do not rebuild

Village operations are nearly complete in code: renewals + reminder cron, member-posted needs, volunteer self-claim (`/api/volunteer/claim-need`, `claim-service`), donations with receipts + export, broadcast email with templates + sent log, document library (member / org / agency / navigator), public `/org/[slug]`, `/chapter/[slug]`, `/employer/[slug]`, org directory, trends, recurring schedules, join requests, and a push API `POST /api/v1/org/members` authenticated by `org_api_key` with `helpful_village_org_id` / `hv_sync_enabled` settings.

## Remaining gaps

| # | Gap | Phase below |
|---|---|---|
| 1 | No importer for villages migrating off Helpful Village (the $1,500 migration service has no tool) | G4.1 |
| 2 | `hv_sync_enabled` is saved but no job ever syncs | G4.1 |
| 3 | Org broadcasts and family nudges are email-only; Twilio provider is never used for broadcasts | G4.2 |
| 4 | No geocoding — matching and rides use city/zip text only | G4.3 |
| 5 | Facilitated grief circles (§7.2) | G4.4 |
| 6 | Thrive Device kiosk (§11.8) — `/dashboard/devices` is smart-home only | G4.5 |
| 7 | Transport dispatch tiers + AV partner slot (§3.3) | G4.6 |
| 8 | Volunteer training modules (§8.7) | G4.7 |
| 9 | Language Line bridge via Quinn (Month 6, independent of Phase 55) | G4.8 |

Phase 55 (full i18n) stays last on the roadmap and is not in this spec.

---

## PHASE G4.1 — Helpful Village migration importer + sync

**Importer (the product villages will actually use):**
- `/org-admin` → Settings → "Import from Helpful Village" wizard.
- Step 1: upload CSVs exported from HV — Members, Volunteers, Service Requests (history), Donations. Accept any column order.
- Step 2: column mapping screen with auto-guess (e.g. `First Name` + `Last Name` → `full_name`, `Cell Phone`/`Home Phone` → `phone_number`, `Membership Level` → `org_membership_tiers`, `Renewal Date` → `org_memberships.renews_on`). Save the mapping per org for re-imports.
- Step 3: dry run — shows counts: new / matched (by email, then phone) / skipped with reason, and a downloadable error CSV.
- Step 4: commit in a background job (Supabase Edge Function `import-org-csv`, batches of 200). Every imported row gets `source='helpful_village'` and `external_id` (HV id) so re-running is idempotent (upsert on `org_id + external_id`).
- Members imported this way are **not** sent onboarding or Aria calls; they get a co-branded welcome email only when the org admin clicks "Send welcome" (bulk, previewed first).
- Donations import → `donations` with original dates; totals must match HV's report (show a reconciliation line).

**Migration `supabase/migrations/090_org_imports.sql`:**
```sql
CREATE TABLE IF NOT EXISTS org_import_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  created_by uuid REFERENCES family_members(id),
  source text NOT NULL DEFAULT 'helpful_village',
  entity text NOT NULL CHECK (entity IN ('members','volunteers','service_requests','donations')),
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','mapped','dry_run','running','complete','failed')),
  file_path text NOT NULL,                 -- Supabase Storage: org-imports bucket (private)
  column_map jsonb,
  counts jsonb,                            -- {new, matched, skipped, errors}
  error_file_path text,
  finished_at timestamptz
);
ALTER TABLE org_import_jobs ENABLE ROW LEVEL SECURITY;
-- org admins of that org + platform admins only (mirror existing community_orgs admin policy)

ALTER TABLE members          ADD COLUMN IF NOT EXISTS external_source text, ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE volunteers       ADD COLUMN IF NOT EXISTS external_source text, ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE donations        ADD COLUMN IF NOT EXISTS external_source text, ADD COLUMN IF NOT EXISTS external_id text;
```
(Add matching unique indexes on `(external_source, external_id)` scoped by org where the table has `org_id`.)

**Sync:** HV has no public pull API we can rely on. Make sync explicit instead of pretending:
- Keep the push endpoint (`/api/v1/org/members`) and document it in the org Settings screen: show the org's API key (masked, with Regenerate), the endpoint URL, and a sample payload so an HV admin (or Zapier) can push new members.
- If `hv_sync_enabled` is on and no push has arrived in 30 days, show "Last sync: never / 45 days ago" and a nudge to re-import.
- Remove any UI copy implying automatic two-way sync.

**Checklist:**
```
PHASE G4.1 CHECKLIST
[ ] Upload a 50-row HV members CSV → mapping auto-guesses ≥ 80% of columns
[ ] Dry run shows new/matched/skipped counts and error CSV
[ ] Commit → members + org_memberships created; re-run → 0 new, 50 matched
[ ] Imported members receive no Aria/onboarding calls
[ ] Donations import total equals CSV total
[ ] Settings shows API key, endpoint, sample payload, last push time
[ ] npx tsc --noEmit passes
```

---

## PHASE G4.2 — SMS channel for broadcasts & nudges

- Org broadcast (`/api/org-admin/send-email`) → add channel choice: Email · Text · Both. Text = 320-char limit with live counter, preview on a phone mockup. Rename UI to "Send a message".
- Recipients without a mobile number are listed ("12 members have no mobile — they'll get email only").
- Send through `providers.sms.send`; log to `org_email_log` with new column `channel` (add in migration 090), or rename to `org_message_log` with a view for backward compatibility.
- Opt-out: every text ends "Reply STOP to opt out"; handle Twilio inbound STOP webhook → `members.sms_opt_out = true` (new column) and exclude from future sends. Required by carrier rules.
- Family nudge cron and urgent alerts (`preferred_contact_method = 'sms'`) use SMS when set.
- Same channel option for `/api/employer-admin/send-email`, `/api/navigator/send-email`, `/api/agency/send-email`.

```
PHASE G4.2 CHECKLIST
[ ] Org admin sends "Both" → stub logs email + [STUB][SMS] for members with mobiles
[ ] STOP reply → sms_opt_out=true; next broadcast skips them
[ ] 321-char text blocked with readable message
[ ] Family nudge honours preferred_contact_method='sms'
```

---

## PHASE G4.3 — Geocoding & distance

- Add `lat double precision, lng double precision, geocoded_at timestamptz` to `members`, `volunteers`, `service_providers`, `community_orgs`, `senior_centers` (migration 090).
- `GeocodingProvider` interface + stub (returns zip-centroid from a bundled US zip table) + real provider slot (Mapbox or Google) behind `GEOCODING_API_KEY`. Geocode on create/update of an address and in a one-off backfill script.
- Matching (`lib/volunteers/match.ts`): add distance scoring — ≤ 5 mi +30, ≤ 10 mi +20, ≤ 20 mi +10 — replacing city-string match when both sides have coordinates; keep city/zip as fallback.
- Volunteer open-requests board: "Within X miles" filter and distance shown per request.
- Org admin: simple map of members/volunteers (Leaflet + OpenStreetMap tiles; no key needed). Never shown to members.
- Never expose another person's coordinates to members; distances are rounded to whole miles.

```
PHASE G4.3 CHECKLIST
[ ] Backfill script geocodes all seeded members/volunteers
[ ] Volunteer 3 mi away outranks one 15 mi away with same interests
[ ] Open-requests "within 10 miles" filter works
[ ] Member-facing API responses contain no lat/lng
```

---

## PHASE G4.4 — Facilitated grief circles (§7.2)

- Table `grief_circles` (type: spousal_loss, adult_child_loss, sibling_friend_loss, pet_loss*, anticipatory, general, cultural; facilitator_name, facilitator_credential, max_members, cadence, start_date, session_count, dial_in/video, status open|full|running|ended) and `grief_circle_members` (circle_id, member_id, status invited|joined|left, joined_at).
  *Pet loss circle already exists in `/dashboard/pet-loss-support` — link to it rather than duplicate.*
- Navigator is the only one who can place a member in a grief circle (grief data is navigator-only). Grief support request → navigator sees suggested circle by `members.grief_loss_type`.
- Member view: "Your support group" card — next session date/time, dial-in, facilitator first name. No member list; first names only inside the session.
- Family sees nothing about grief circles unless the member consents (reuse existing grief privacy tier).
- Anniversary sensitivity: circle facilitator gets a note before sessions near a member's loss anniversary.

```
PHASE G4.4 CHECKLIST
[ ] Navigator creates a Spousal Loss circle and invites a member → member sees card
[ ] Family dashboard shows no grief circle data (RLS + UI check)
[ ] Circle at max_members → status full, no further invites
```

---

## PHASE G4.5 — Thrive Device kiosk (§11.8, phases A–D)

- **A — Device tokens:** table `device_tokens` (member_id, token_hash, label, created_by, last_seen_at, app_version, battery_pct, revoked_at). Navigator/admin "Register a device" generates a one-time 8-character pairing code; the tablet enters it once at `/device/pair` → server issues a long-lived signed token (`DEVICE_TOKEN_SECRET`, HS256, stored as httpOnly cookie) → member session created without a password. Revocation is immediate.
- **B — `/device` UI:** single column, min 64px touch targets, 22px+ text, high contrast. Six big tiles: Call my buddy · Talk to Aria (only if opted in) · Today's events · My family (photos/messages) · Get help (calls navigator/Rosa) · Emergency (confirms, then triggers existing SOS flow). No settings, no navigation chrome.
- **C — MDM:** `MdmProvider` interface + stub (`MDM_PROVIDER`, `MDM_API_KEY`): lock to app, push update, wipe. Heartbeat endpoint `POST /api/device/heartbeat` (battery, version).
- **D — `/admin/devices`:** list devices, member, last ping, battery, version; actions Revoke / Lock / Wipe / Re-pair. Alert navigator if a device hasn't pinged in 72 h (possible member wellbeing signal).
- Billing: Premier includes one device; `$25/mo` add-on via existing premium add-ons; `$79` replacement one-time.

```
PHASE G4.5 CHECKLIST
[ ] Pairing code → tablet lands on /device logged in as the member, no password
[ ] Revoke → next request returns to pairing screen
[ ] All /device touch targets ≥ 64px (axe + manual check); zero wcag2aa violations
[ ] No-heartbeat 72h → navigator task
```

---

## PHASE G4.6 — Transport dispatch tiers + AV slot (§3.3)

- `lib/transport/dispatch.ts`: `dispatchRide(request)` tries in order: volunteer driver (open request, wait `VOLUNTEER_CLAIM_WINDOW_HOURS`, default 12) → Lyft (`LyftTransportProvider`, already exists) → AV partner (`AvTransportProvider` stub, `AV_PARTNER_API_KEY` / `ZOOX_API_KEY`), skipping any tier whose provider is stubbed or whose service area doesn't cover the pickup (needs G4.3 coordinates).
- Member/family choose "Any" (default) or a preference; AV is never auto-selected for members flagged `mobility_assistance_needed` or who have not consented to AV rides.
- Platform fee recorded per non-volunteer ride (15–20%, `PLATFORM_RIDE_FEE_PCT`).
- Navigator sees which tier fulfilled each ride.

```
PHASE G4.6 CHECKLIST
[ ] No volunteer claims within window → falls through to Lyft stub
[ ] Member without AV consent never routed to AV
[ ] Fee recorded on Lyft ride, not on volunteer ride
```

---

## PHASE G4.7 — Volunteer training modules (§8.7)

- Tables `training_modules` (title, role_scope volunteer|buddy|driver|student, content_md, video_url, quiz jsonb, required boolean, order) and `training_completions` (volunteer_id, module_id, score, completed_at).
- Seed 5 required modules: Welcome & boundaries · Recognising concerns & escalating (buddy rule: log, never act alone) · Scam awareness · Dementia-friendly communication · Privacy & HIPAA basics.
- Volunteer dashboard: progress bar; claiming open requests is blocked until required modules are complete (clear message with link).
- Hours milestone badges (50/100/250/500) using the existing `Badge` component, shown on the impact dashboard and service-record PDF.

```
PHASE G4.7 CHECKLIST
[ ] New volunteer cannot claim until 5 modules complete
[ ] Quiz under 80% → retry prompt, no completion row
[ ] 50-hour volunteer shows badge on dashboard and PDF
```

---

## PHASE G4.8 — Language Line bridge (Quinn)

- Member field `preferred_language` already exists. When an inbound Quinn call's `from_number` matches a member whose `preferred_language` isn't English, pass `interpreter_needed=true` + language in Retell dynamic variables; Quinn's prompt then offers a three-way call.
- Retell tool `transfer_to_interpreter` → `lib/voice/tools/languageLine.ts` (stub logs; real: Twilio conference joining Language Line's number from `LANGUAGE_LINE_NUMBER` + account code `LANGUAGE_LINE_ACCOUNT`).
- Log interpreter minutes per call (`check_in_calls.interpreter_minutes`) for cost tracking.

```
PHASE G4.8 CHECKLIST
[ ] Spanish-preferred member calls Quinn → dynamic vars include interpreter_needed
[ ] transfer_to_interpreter tool call → stub log with language + account code
```

## Human review (G4 exit gate)

Import a real HV export from a pilot village in dry-run mode and review counts with the village director before committing. Send one test text broadcast to your own phone. Pair one Fire HD 10 tablet end to end.
