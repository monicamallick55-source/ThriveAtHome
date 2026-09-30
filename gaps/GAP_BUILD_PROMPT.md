# Gap Build Loop — Driver Prompt

> Paste the line below into Claude Code in your Codespace to start (or resume) the build:
>
> **`Read gaps/GAP_BUILD_PROMPT.md and follow it exactly.`**

---

## Your job

Build the platform gaps in `gaps/` one phase at a time, in the order below, until every phase is complete. Each spec file (G1–G4) is the source of truth for its phases: schema, files, behaviour and checklist.

## Build order (do not skip or reorder)

| # | Spec file | Phases |
|---|---|---|
| 1 | `gaps/G1_Call_Pipeline.md` | G1.1 → G1.2 → G1.3 → G1.4 → G1.5 → G1.6 |
| 2 | `gaps/G2_Community_Social.md` | G2.0 → G2.1 → G2.2 → G2.3 → G2.4 → G2.5 → G2.6 |
| 3 | `gaps/G3_Family_Celebrations_Fraud.md` | G3.4 (fraud) → G3.1 → G3.2 → G3.3 |
| 4 | `gaps/G4_Village_Parity_and_Platform.md` | G4.1 → G4.2 → G4.3 → G4.4 → G4.5 → G4.6 → G4.7 → G4.8 |
| 5 | `gaps/G5_Remaining_Spec_Gaps.md` | G5.1 → G5.2 → … → G5.10 |
| 6 | `gaps/G6_New_Features.md` | G6.0 → G6.1 → G6.2 → G6.3 → G6.4 |

G3.4 goes first within G3 because G2.2, G2.5 and G3.2 call its fraud detector. If you reach a G2 step that needs `scanForFraudPatterns` before G3.4 exists, create `lib/fraud/detect.ts` with the full G3.4 detector at that point and note it in the log.

## Start of every session

1. `git pull`
2. Read `gaps/gaps-progress.md` top to bottom. Resume from the last entry's **NEXT** line.
3. If the last entry says `AWAITING_APPROVAL`, do not start the next phase. Ask: "Phase [X] is waiting for your APPROVED. Shall I proceed?"
4. Read the full section for the current phase in its spec file before writing any code.
5. Read the existing files the phase modifies before editing them. The specs name real files at commit `abdc412`; if a file has moved or changed shape, adapt and record the deviation.

## The loop for each phase

```
WORKING    → write the code/SQL the phase describes
TESTING    → run every VERIFY in the phase checklist
  PASS     → mark the item [x] in gaps-progress.md immediately
  FAIL     → DEBUGGING: form a hypothesis, fix, re-test
             after 3 failed hypotheses on one item → BLOCKED:
             stop, write the 3 hypotheses to the log, ask the human
EXIT GATE  → all items [x] AND `npx tsc --noEmit` is clean AND `npm run lint` shows no new errors
COMMIT     → one commit per phase (see below)
CHECKPOINT → at the end of each spec file (G1–G6): run that file's
             "Human review" section, set AWAITING_APPROVAL, and stop
```

Within a spec file, move straight to the next phase after a phase passes its exit gate. Only stop for human approval at the end of G1, G2, G3, G4, G5 and G6.

## Rules

- **Migrations:** numbers continue from `085` in the order the specs give (085 G1, 086–087 G2, 088–089 G3, 090 G4; G5 and G6 take the next free numbers from 091 upward, one file per phase). The repo already has duplicate `077_` and `083_` files — don't touch or renumber them. Never edit a migration that has been applied; add a new one instead. Every new table gets RLS enabled in the same migration.
- **Applying SQL:** you cannot reach the Supabase SQL editor. When a phase has a migration, commit the file, then stop and tell the human: "Run `supabase/migrations/0XX_….sql` in the Supabase SQL Editor and reply DONE." Wait for DONE before running any VERIFY that needs the database.
- **Testing: stubs in the Codespace, real services on Vercel.** The Codespace has only the Supabase keys; the other keys live in Vercel and cannot be downloaded (they are marked Sensitive). So:
  - In the Codespace, every VERIFY runs with the stub providers (`lib/providers.ts` falls back to stubs when a key is missing). Never ask the human to copy keys into `.env.local`. If `.env.local` contains `[SENSITIVE]` placeholder lines, delete those lines (`sed -i '/\[SENSITIVE/d' .env.local`) so stubs are used — a placeholder must never be treated as a real key.
  - Any provider code must treat a value that is empty or starts with `[` as missing.
  - Items that can only be proven with a real service (real call placed, real webhook signature, real Stripe test payment, real email/text delivered) are marked `[~] needs live test` in the checklist, not `[x]`, and are listed in that spec file's human review.
  - At the human checkpoint, after the human merges the pull request and Vercel deploys, write a **Live test script** for the human: numbered steps on https://thrive-at-home-pied.vercel.app (and phone steps: "call Quinn's number from your mobile", "trigger the aria-calls cron with this curl"), what they should see, and where to look (Supabase table, Vercel logs, Stripe test dashboard). The human reports results; fix anything that fails in a follow-up commit on a new branch.
  - Stripe on production must be in test mode for these live tests — ask the human to confirm before any payment step. Real calls and texts only to the human's own mobile; ask them for the number at the checkpoint if needed (never commit it).
  - Test data created during live tests is labelled `[TEST]`; give the human a cleanup SQL snippet at the end.
- **Queries:** use `.maybeSingle()`, never `.single()`. Data-layer functions return `{ data, error }` and never throw.
- **Types:** update `types/database.ts` for every schema change.
- **Privacy:** family never sees transcripts, grief data, private message text, or the buddy `concern_description`. Members never see other people's phone, email, address or coordinates. Check this in every phase that touches those tables.
- **Accessibility:** new member-facing UI uses 18px+ body text and 48px+ touch targets (64px on `/device`), and must pass `npx axe-cli <url> --tags wcag2aa` with zero violations.
- **Scope:** build only what the current phase describes. If you find a bug outside the phase, log it under "Found along the way" in the progress file; don't fix it unless it blocks the phase.
- **Tests:** put verification scripts in `scripts/` (e.g. `scripts/test-retell-webhook.ts`) and run them with `npx tsx`. Delete any test rows they create.

## Git

- Work on one branch per spec file: `gaps/g1` … `gaps/g6`. Create it from an up-to-date `main` at the start of that spec file.
- Commit after each phase passes its exit gate. Message format:
  `G1.4: process call_ended — save, crisis scan, summary, alerts`
- Push the branch after each commit.
- At the human checkpoint, open a pull request from the branch to `main` with the phase list and the checklist results in the description. The human merges it; don't merge it yourself.

## End of every session — always, even mid-phase or blocked

Append an entry to `gaps/gaps-progress.md` using the entry format in that file, update the phase table at its top, commit, and push.
