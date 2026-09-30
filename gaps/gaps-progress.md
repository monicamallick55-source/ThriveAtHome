# Gap Build — Progress Log

> **Append-only below "Session log".** The phase table is the only part edited in place.
> Every session starts by reading this file and ends by appending an entry.

## Phase status

Status values: `NOT_STARTED` · `IN_PROGRESS` · `AWAITING_SQL` · `AWAITING_APPROVAL` · `COMPLETE` · `BLOCKED`

| Phase | Name | Status | Migration | Commit |
|---|---|---|---|---|
| G1.1 | Call record schema fix | NOT_STARTED | 085 | |
| G1.2 | Agent registry (12 agents) | NOT_STARTED | — | |
| G1.3 | Webhook security | NOT_STARTED | — | |
| G1.4 | Call-ended processing | NOT_STARTED | — | |
| G1.5 | Aria opt-in + Launch Protocol | NOT_STARTED | — | |
| G1.6 | Joy + Grace outbound | NOT_STARTED | 085 (tracked_items col) | |
| **G1** | **Human review** | NOT_STARTED | | PR: |
| G2.0 | RLS helpers | NOT_STARTED | 086 | |
| G2.1 | Post comments | NOT_STARTED | 086 | |
| G2.2 | Report & moderation | NOT_STARTED | 086 | |
| G2.3 | Member event proposals + 41a | NOT_STARTED | 086 | |
| G2.4 | Circle members tab | NOT_STARTED | — | |
| G2.5 | Friends + private messages | NOT_STARTED | 087 | |
| G2.6 | Facilitated introductions | NOT_STARTED | 087 | |
| **G2** | **Human review** | NOT_STARTED | | PR: |
| G3.4 | Fraud flags + detector | NOT_STARTED | 089 | |
| G3.1 | Family events calendar | NOT_STARTED | 088 | |
| G3.2 | Cards, notes & gifts | NOT_STARTED | 088 | |
| G3.3 | Family-initiated celebrations | NOT_STARTED | 088 | |
| **G3** | **Human review** | NOT_STARTED | | PR: |
| G4.1 | HV importer + sync | NOT_STARTED | 090 | |
| G4.2 | SMS broadcasts | NOT_STARTED | 090 | |
| G4.3 | Geocoding & distance | NOT_STARTED | 090 | |
| G4.4 | Grief circles | NOT_STARTED | 090 | |
| G4.5 | Thrive Device kiosk | NOT_STARTED | 090 | |
| G4.6 | Transport dispatch tiers | NOT_STARTED | — | |
| G4.7 | Volunteer training | NOT_STARTED | 090 | |
| G4.8 | Language Line bridge | NOT_STARTED | — | |
| **G4** | **Human review** | NOT_STARTED | | PR: |

Where one spec file's phases share a migration number (e.g. 086 for G2.0–G2.3), write one migration file per phase instead, numbered in sequence from the next free number, and update this table. Don't pack phases you haven't reached into an earlier migration.

## Found along the way

Bugs or gaps noticed outside the current phase. Don't fix unless blocking.

| Date | Where | What |
|---|---|---|
| | | |

## Entry format

```
---
SESSION: [n]
DATE: [YYYY-MM-DD]
PHASE: [G1.4 — name]
STATUS: [IN_PROGRESS | AWAITING_SQL | AWAITING_APPROVAL | COMPLETE | BLOCKED]
BRANCH: [gaps/g1]

CHECKLIST: [x of y passed]
- [x] item — what was observed
- [ ] item — not yet run / why
- [!] item — BLOCKED: H1 … → result; H2 … → result; H3 … → result

FILES:
- path — CREATED / MODIFIED: what changed

SQL FOR HUMAN TO RUN: [file name, or none]
DEVIATIONS FROM SPEC: [what and why, or none]

NEXT:
- [first exact action for the next session]
---
```

## Phase status — G5 & G6 (added Sept 30, 2026)

| Phase | Name | Status | Migration | Commit |
|---|---|---|---|---|
| G5.1 | Medicare: MA data + member Medicare help | NOT_STARTED | 091+ | |
| G5.2 | Paid companion payouts + credits | NOT_STARTED | | |
| G5.3 | Geographic chapters | NOT_STARTED | | |
| G5.4 | Celebrations depth | NOT_STARTED | | |
| G5.5 | Life transitions depth | NOT_STARTED | | |
| G5.6 | Named interest circles + cultural content | NOT_STARTED | | |
| G5.7 | Plan entitlements + missing SKUs | NOT_STARTED | | |
| G5.8 | Family daily summary text + event rides | NOT_STARTED | | |
| G5.9 | FHIR R4 referrals + compare pages | NOT_STARTED | | |
| G5.10 | Volunteer ecosystem completion | NOT_STARTED | | |
| **G5** | **Human review** | NOT_STARTED | | PR: |
| G6.0 | Referral partners | NOT_STARTED | | |
| G6.1 | Home Safety Program | NOT_STARTED | | |
| G6.2 | Home Sharing (HIP Housing referral) | NOT_STARTED | | |
| G6.3 | Encore Careers | NOT_STARTED | | |
| G6.4 | Member-in-Need Campaigns | NOT_STARTED | | |
| **G6** | **Human review** | NOT_STARTED | | PR: |

## Session log

---
SESSION: 0
DATE: 2026-09-30
PHASE: — setup
STATUS: NOT_STARTED
BRANCH: main

Specs G1–G4 written from a code audit of commit abdc412 and committed to `gaps/`.

NEXT:
- Create branch `gaps/g1` from main
- Read `gaps/G1_Call_Pipeline.md` fully, then start G1.1 (migration 085)
---
