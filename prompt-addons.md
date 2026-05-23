# ThriveAtHome — Add-On Milestones Build Prompt (v1.0)
# M7–M12: Navigator Console, AI Calls, Concierge Line, SMS/Email, Billing, Compliance

> **Read this entire file before writing a single line of code.**
> The agentic loop protocol from prompt.md Section 1 applies here exactly as before.
> One phase at a time. Human approval before every phase transition.
> BLOCKED after 3 failed hypotheses.
> All 8 service interfaces and stubs from V1 are already in place.
> Activating a real service requires only: (a) new implementation in /lib/services/,
> (b) update providers.ts. Nothing else changes.

---

## SCOPE

| Milestone | Phases | Delivers |
|-----------|--------|---------|
| M7 — Navigator Console | 15–16 | Internal caseload dashboard for care navigators |
| M8 — AI Calls | 17–19 | Real Aria check-in calls via Retell AI + Anthropic |
| M9 — Concierge Line | 20 | 24/7 senior phone line with AI triage |
| M10 — SMS + Email | 21–23 | Real notifications to families after every call |
| M11 — Billing | 24–26 | Stripe subscription payments |
| M12 — Compliance | 27–28 | HIPAA audit, accessibility, production hardening |

---

## ARCHITECTURE REMINDER

`/lib/providers.ts` is the only file that selects stub vs real.
All interfaces are in `/lib/interfaces/` — never modify them.
Real implementations go in `/lib/services/` — one file per service.
Application code imports from `providers.ts` only.

When activating a real service:
1. Create `/lib/services/[ServiceName].ts` implementing the interface
2. Update the resolver function in `providers.ts` to use it
3. Zero other files change

---

## ═══ M7 — NAVIGATOR CONSOLE ═══

### PHASE 15 — Navigator Console Shell

**Prerequisites:** No new accounts needed. Uses existing Supabase data.

**What this builds:** The internal dashboard care navigators use to manage their caseload. Navigators log in and see all their assigned members, active alerts, and today's tasks.

**Checklist:**
```
PHASE 15 CHECKLIST
[ ] /app/navigator/page.tsx — real page replaces placeholder
    VERIFY: Log in as navigator role user, navigate to /navigator
    PASS: Caseload table loads with assigned members

[ ] Caseload table renders correctly
    VERIFY: Table shows member name, plan tier, last check-in, alert status dot, next call
    PASS: All columns visible, sorted by alert severity (most urgent first)

[ ] Search/filter works
    VERIFY: Type a name in search box
    PASS: Table filters to matching members in real time

[ ] Alert queue shows unacknowledged urgent/emergency alerts
    VERIFY: Create a test urgent alert for a member, reload navigator page
    PASS: Alert card appears at top of page with Acknowledge button

[ ] Acknowledge button works
    VERIFY: Click Acknowledge on a test alert
    PASS: Alert disappears from queue, DB row has acknowledged=true, navigator ID recorded

[ ] Today's tasks section renders
    VERIFY: Create a test navigator_task row in Supabase
    PASS: Task appears in today's tasks list with priority badge

[ ] Mark complete works on tasks
    VERIFY: Click Mark complete on a test task
    PASS: Task moves to completed, DB row updated

[ ] Route protection works
    VERIFY: Log in as family role user, navigate to /navigator
    PASS: Redirected to /dashboard (not /login — family users are authenticated)

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero errors
```

**Build instructions:**

Replace `/app/navigator/page.tsx` placeholder with the real console. This is a Server Component that fetches data server-side.

Data needed:
- Navigator's assigned members (via `navigator_assignments` → `members`)
- Each member's most recent call (`check_in_calls` latest by `member_id`)
- Each member's unacknowledged alerts (`alerts` where `acknowledged=false`)
- Navigator's incomplete tasks (`navigator_tasks` where `navigator_id` matches and `completed=false`)

Layout:
```
ALERT QUEUE (only if unacknowledged urgent/emergency alerts exist)
  Each alert card: member name, alert type, severity badge, time ago, Acknowledge button

CASELOAD TABLE
  Columns: Name | Plan | Last check-in | Status | Next call | Actions
  Default sort: emergency first, then urgent, then concern, then no alerts, then by name
  Search: client-side filter on member name

TODAY'S TASKS
  Incomplete tasks for this navigator sorted by priority (critical → high → medium → low)
  Each task: priority badge, member name, description, due date, Mark complete button
```

Navigator role check: use `getUserRole()` from `/lib/auth.ts`. If role is not `navigator` or `admin`, redirect to `/dashboard`.

Error recovery:
- Navigator has no assignments → show "No members assigned yet" empty state, not an error
- Supabase query fails → show per-section error with retry button

---

### PHASE 16 — Member Detail Panel + Navigator Notes

**What this builds:** A slide-out panel when a navigator clicks a member row, showing full context before a call.

**Checklist:**
```
PHASE 16 CHECKLIST
[ ] Clicking a member row opens a slide-out panel
    VERIFY: Click any member row in the caseload table
    PASS: Panel slides in from right, member profile visible

[ ] Panel shows correct member data
    VERIFY: Check panel content against Supabase member row
    PASS: Name, DOB, phone, emergency contacts, health conditions all visible

[ ] Last 5 call summaries visible
    VERIFY: Panel shows call summaries for a member with call history
    PASS: Up to 5 most recent summaries shown, newest first

[ ] Navigator brief generates
    VERIFY: Panel shows a pre-call brief section
    PASS: Stub brief appears — "[STUB] Before calling this member: review their last N call summaries."

[ ] Navigator notes: save a note
    VERIFY: Type in notes textarea, click Save
    PASS: Note saved to navigator_notes table, appears in notes list immediately

[ ] Navigator notes: previous notes visible
    VERIFY: Open panel for a member who has existing notes
    PASS: Previous notes listed with timestamp and navigator name

[ ] Panel closes correctly
    VERIFY: Click outside panel or press Escape
    PASS: Panel closes, focus returns to the table row that opened it

[ ] Family contacts visible
    VERIFY: Panel shows family members linked to this senior
    PASS: Name, relationship, phone, last login visible for each linked family member

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero errors
```

**Build instructions:**

Add slide-out panel as a Client Component. Use the existing `Modal` component pattern for focus management, but render as a right-side panel instead of centred modal.

AI navigator brief: call `aiProvider.generateNavigatorBrief()` from providers.ts — returns stub text in v1, real Anthropic brief in M8.

Notes: POST to a new `/app/api/navigator/notes/route.ts` API route. This route:
1. Verifies the caller is authenticated as a navigator
2. Verifies the member is assigned to this navigator
3. Inserts into `navigator_notes`
4. Returns the new note

Error recovery:
- Note save fails → show inline error below textarea, do not clear the note text
- Brief generation fails → show "Brief unavailable" — never crash the panel

---

## ═══ M8 — AI CALLS ═══

### PHASE 17 — Retell AI Agent Setup

**Prerequisites before this phase:**
- Retell AI account created (retellai.com)
- Retell AI HIPAA BAA signed (required before any real calls)
- `RETELL_API_KEY` set in `.env.local` and Vercel
- Twilio account with a purchased phone number
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` set in `.env.local` and Vercel

**Manual step required (no code):**

In the Retell AI dashboard:
1. Create a new agent named "Aria — ThriveAtHome Daily Check-In"
2. Select voice: warm, natural female, conversational (not robotic)
3. Set turn-detection: longer silence threshold than default (seniors speak more slowly)
4. Set max call duration: 20 minutes
5. Enable call recording
6. Note the Agent ID → add to `.env.local` as `RETELL_AGENT_ID`

In Retell AI dashboard: connect your Twilio phone number to the Aria agent.

**What code this builds:** The system prompt generator and the Retell AI call provider.

**Checklist:**
```
PHASE 17 CHECKLIST
[ ] RETELL_AGENT_ID set in .env.local
    VERIFY: grep RETELL_AGENT_ID .env.local
    PASS: Shows a non-empty value

[ ] generateSystemPrompt() produces correct output
    VERIFY: npx tsx scripts/test-system-prompt.ts
    PASS: Prints a system prompt that includes the member's preferred name and interests

[ ] RetellCallProvider implements CallProvider interface
    VERIFY: npx tsc --noEmit
    PASS: Zero errors — class satisfies the interface

[ ] providers.ts resolves to RetellCallProvider when env vars present
    VERIFY: npx tsx -e "const p = require('./lib/providers'); console.log(p.callProvider.constructor.name)"
    PASS: Prints "RetellCallProvider" (not "StubCallProvider")

[ ] Test call triggers successfully
    VERIFY: npx tsx scripts/test-call-trigger.ts (calls your own phone number)
    PASS: Your phone rings, Aria answers, introduces herself as "Aria from ThriveAtHome"
```

**Build instructions:**

Create `/lib/ai/checkInPrompt.ts` — exports `generateSystemPrompt(member: Member, priorSummaries: string[]): string`

The prompt must instruct Aria to:
- Introduce herself as "Aria from ThriveAtHome" — warm, unhurried
- Address the senior by preferred name
- Reference 1–2 of their stated interests naturally during conversation
- Cover these topics organically (not as a checklist): mood today, energy, any pain or discomfort, sleep, medications taken, appetite, social plans
- Never use clinical language ("patient", "symptoms", "vitals", "assessment")
- Never rush — allow natural pauses
- End every call: "Is there anything else on your mind today?" + warm goodbye
- If senior mentions anything concerning: respond with warmth, note team will follow up, do not abruptly end
- If `member.preferred_language !== 'english'`: conduct entire call in that language

Create `/lib/services/RetellCallProvider.ts` implementing `CallProvider`:
```ts
import { requireServerEnv } from '../env'
import { generateSystemPrompt } from '../ai/checkInPrompt'
import type { CallProvider, CallContext } from '../interfaces/CallProvider'

export class RetellCallProvider implements CallProvider {
  async scheduleCall(memberId: string, phone: string, ctx: CallContext): Promise<string> {
    const apiKey = requireServerEnv('RETELL_API_KEY')
    const agentId = requireServerEnv('RETELL_AGENT_ID')
    const systemPrompt = generateSystemPrompt(ctx)

    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: requireServerEnv('TWILIO_PHONE_NUMBER'),
        to_number: phone,
        agent_id: agentId,
        metadata: { member_id: memberId },
        override_agent_config: {
          prompt: systemPrompt,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`[RetellCallProvider] API error: ${err}`)
    }

    const data = await response.json()
    return data.call_id
  }
}
```

Update `providers.ts` resolver for `callProvider` — it already has the pattern, just uncomment/activate.

---

### PHASE 18 — Outbound Call Scheduler

**What this builds:** The system that automatically triggers check-in calls at each senior's preferred time every day.

**Checklist:**
```
PHASE 18 CHECKLIST
[ ] Schedule call API route works
    VERIFY: POST to /api/calls/schedule with a test memberId
    PASS: Returns { success: true, callId: "..." }, check_in_calls row created with status 'scheduled'

[ ] Cron job queries correct members
    VERIFY: Set test member preferred_call_time to current UTC hour, trigger cron endpoint
    PASS: Call scheduled for that member

[ ] Deduplication works
    VERIFY: Trigger cron twice for same member same day
    PASS: Second trigger creates no new call — existing scheduled/completed call detected

[ ] Missed call detection works
    VERIFY: Create scheduled call with scheduled_at 2 hours ago, trigger check-missed-calls Edge Function
    PASS: Status updated to 'missed', informational alert created

[ ] vercel.json has cron configured
    VERIFY: cat vercel.json
    PASS: Shows cron entry for /api/cron/daily-calls running every hour
```

**Build instructions:**

Create `/app/api/calls/schedule/route.ts`:
- Accepts `POST { memberId }` — authenticated, navigator/admin only
- Fetches member from Supabase (verify caller has access to this member)
- Calls `callProvider.scheduleCall(memberId, member.phone_number, context)`
- Creates `check_in_calls` row with status `scheduled`, retell_call_id from response
- Returns `{ success: true, callId }`

Create `/app/api/cron/daily-calls/route.ts`:
- Protected by `CRON_SECRET` header check
- Queries members where `status = 'active'` and `preferred_call_time` matches current UTC hour (accounting for member timezone)
- For each: calls schedule API, logs result
- Deduplication: skip members who already have a call today with status scheduled/in_progress/completed

Create `vercel.json` at project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-calls",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/missed-calls",
      "schedule": "30 * * * *"
    }
  ]
}
```

Error recovery:
- Retell API call fails → log error, create `failed` status call row, do not retry automatically
- Member phone number missing → skip member, log warning, do not crash cron

---

### PHASE 19 — Call Webhook + Transcript Processing

**What this builds:** When Retell AI completes a call, it sends the transcript here. This is where raw conversation becomes structured health data.

**Prerequisites:**
- `RETELL_WEBHOOK_SECRET` set in `.env.local` and Vercel
- `ANTHROPIC_API_KEY` set in `.env.local` and Vercel
- Webhook URL registered in Retell AI dashboard: `https://[your-vercel-url]/api/webhooks/retell`

**Checklist:**
```
PHASE 19 CHECKLIST
[ ] Webhook validates Retell AI signature
    VERIFY: Send request without correct signature header
    PASS: Returns 401

[ ] Transcript stored correctly
    VERIFY: Send test webhook payload, check check_in_calls row
    PASS: transcript column has full text, status = 'completed'

[ ] AnthropicAiProvider generates call summary
    VERIFY: providers.ts resolves to AnthropicAiProvider when ANTHROPIC_API_KEY present
    PASS: npx tsx scripts/test-transcript-processing.ts shows real AI summary (not stub)

[ ] Scores extracted from transcript
    VERIFY: Process test transcript containing "I feel great" and "I took my medications"
    PASS: mood_score > 5, medication_taken = true

[ ] Crisis detection still runs first
    VERIFY: Process transcript containing crisis phrase
    PASS: emergency_log row created, emergency alert created (same as V1 crisis logic)

[ ] Alert flags trigger correct alerts
    VERIFY: Process transcript containing "I fell yesterday"
    PASS: fall alert created with severity 'urgent'

[ ] Family Realtime notification pushed after processing
    VERIFY: Open dashboard while webhook processes
    PASS: "Call summary ready" toast appears within 5 seconds of webhook

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero errors
```

**Build instructions:**

Create `/app/api/webhooks/retell/route.ts`:
1. Verify signature using `RETELL_WEBHOOK_SECRET`
2. Extract: call_id, transcript, recording_url, duration, timestamps
3. Find matching `check_in_calls` row by `retell_call_id`
4. Update row: status → 'completed', timestamps, duration, recording_url, raw transcript
5. Run crisis detection FIRST (same logic from V1 Phase 11)
6. Call `aiProvider.extractCallScores(transcript)` — real Anthropic implementation
7. Call `aiProvider.generateCallSummary(transcript)` — real Anthropic implementation
8. Run alert flag detection (same logic from V1 Phase 10)
9. Call `createAlertsFromCall()` for any triggered rules
10. Push Realtime notification: type `call_summary_ready`
11. Return 200 immediately (do all heavy work, but never let processing failure affect the 200)

Create `/lib/services/AnthropicAiProvider.ts` implementing `AiProvider`:
- `generateCallSummary`: Claude API call, system prompt instructs warm plain-English summary for adult children, max 4 sentences, never clinical
- `extractCallScores`: Claude API call, structured JSON output for mood/energy/pain/medication
- `disambiguateCrisisContext`: Claude API call — "Is this phrase expressing genuine distress or is it benign in context? Answer YES or NO only."
- All other methods: return stubs for now (care plans, digests etc come in M12+)
- Model: `claude-sonnet-4-20250514`
- Max tokens: 500 for summaries, 200 for scores, 50 for disambiguation

Update `providers.ts` resolver for `aiProvider`.

Error recovery:
- Anthropic API call fails → log error, use stub response, never fail the whole webhook
- Transcript is empty → log warning, skip score extraction, store empty summary
- Crisis detection fails → log error, create manual review navigator task (same as V1)

---

## ═══ M9 — CONCIERGE LINE ═══

### PHASE 20 — 24/7 Senior Concierge Phone Line

**Prerequisites:**
- Second Twilio phone number purchased (the concierge number — different from Aria's check-in number)
- `TWILIO_CONCIERGE_NUMBER` set in `.env.local` and Vercel
- Second Retell AI agent created: "ThriveAtHome Concierge"
- `RETELL_CONCIERGE_AGENT_ID` set in `.env.local` and Vercel
- Language Line account provisioned (for 240+ language support)
- `LANGUAGE_LINE_ACCOUNT_NUMBER` and `LANGUAGE_LINE_SIP_ENDPOINT` set in `.env.local` and Vercel

**What this builds:** Seniors or family members can call a dedicated number any time and speak to an AI concierge that triages their request — transport, meal help, companionship, or escalation to a human navigator.

**Checklist:**
```
PHASE 20 CHECKLIST
[ ] Concierge agent exists in Retell AI dashboard
    VERIFY: RETELL_CONCIERGE_AGENT_ID is set and valid
    PASS: grep RETELL_CONCIERGE_AGENT_ID .env.local shows non-empty value

[ ] Concierge webhook handles incoming calls
    VERIFY: POST test webhook payload from concierge agent
    PASS: Triage result stored in concierge_calls table

[ ] AI triage classifies call intent correctly
    VERIFY: npx tsx scripts/test-concierge-triage.ts
    PASS: "I need a ride to my doctor" → service_request/transport
          "I'm feeling lonely" → companionship_call
          "I've fallen and can't get up" → emergency
          "What time is Aria calling today?" → information

[ ] Emergency calls escalate immediately
    VERIFY: Process transcript with "I've fallen" or "I can't breathe"
    PASS: emergency alert created, urgent SMS stub logs show would-send to family

[ ] concierge_calls table stores all calls
    VERIFY: Check Supabase after test webhook
    PASS: Row exists with member_id, triage_result, transcript, call duration

[ ] /dashboard/concierge placeholder replaced with real page
    VERIFY: Navigate to /dashboard/concierge
    PASS: Shows call history for this member, not "Coming soon"
```

**Build instructions:**

Create `/supabase/migrations/004_concierge.sql`:
```sql
CREATE TABLE concierge_calls (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid REFERENCES members(id) ON DELETE CASCADE,
  retell_call_id  text,
  caller_phone    text,
  started_at      timestamptz,
  ended_at        timestamptz,
  duration_seconds int,
  transcript      text,
  triage_intent   text,
  triage_service_type text,
  triage_urgency  text,
  triage_summary  text,
  recording_url   text,
  escalated_to_human boolean NOT NULL DEFAULT false
);
ALTER TABLE concierge_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_select_own_concierge_calls" ON concierge_calls FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = concierge_calls.member_id AND fm.supabase_auth_id = auth.uid()));
```

Run migration in Supabase SQL Editor.

Create `/app/api/webhooks/retell-concierge/route.ts`:
- Same signature verification as the check-in webhook
- Call `aiProvider.generateConciergeTriage(transcript)`
- Store result in `concierge_calls`
- If intent is `emergency`: immediately create emergency alert and push Realtime notification
- If intent is `service_request`: create navigator task with service type and urgency
- If intent is `care_team_transfer`: create high-priority navigator task

Update `/app/dashboard/concierge/page.tsx` — replace placeholder with real call history for the logged-in member's senior.

Concierge system prompt (in Retell AI dashboard for the concierge agent):
- Introduce as "ThriveAtHome Concierge"
- Ask: "How can I help you today?"
- Handle: transport requests, meal help, loneliness/companionship, information requests, emergencies
- For emergencies: "I'm connecting you with help right now. Please stay on the line."
- For service requests: "I've noted your request and a member of our team will follow up shortly."
- Language Line integration: if caller speaks non-English, transfer to Language Line SIP endpoint

---

## ═══ M10 — SMS + EMAIL NOTIFICATIONS ═══

### PHASE 21 — Twilio SMS Provider

**Prerequisites:**
- Twilio credentials already set from M8
- `ONCALL_NAVIGATOR_PHONE` set in `.env.local` and Vercel (your mobile number for testing)

**Checklist:**
```
PHASE 21 CHECKLIST
[ ] TwilioSmsProvider implements SmsProvider interface
    VERIFY: npx tsc --noEmit
    PASS: Zero errors

[ ] providers.ts resolves to TwilioSmsProvider when TWILIO_ACCOUNT_SID present
    VERIFY: npx tsx -e "const p=require('./lib/providers'); console.log(p.smsProvider.constructor.name)"
    PASS: Prints "TwilioSmsProvider"

[ ] send() delivers real SMS
    VERIFY: npx tsx scripts/test-sms.ts (sends to ONCALL_NAVIGATOR_PHONE)
    PASS: SMS received on your phone within 60 seconds

[ ] sendUrgent() delivers real SMS
    VERIFY: Same script, urgent path
    PASS: SMS received with urgent prefix

[ ] Post-call SMS sends after a completed call
    VERIFY: Process a test webhook with a completed call
    PASS: SMS arrives at family member's phone within 5 minutes
         Format: "ThriveAtHome update for [Name] 💚\nMood [X]/10 | Meds ✓\n[2-sentence summary]\nSee dashboard: [URL]"

[ ] Emergency SMS sends immediately
    VERIFY: Create emergency alert manually
    PASS: SMS arrives within 60 seconds with 🚨 prefix
```

**Build instructions:**

Create `/lib/services/TwilioSmsProvider.ts`:
```ts
import twilio from 'twilio'
import { requireServerEnv } from '../env'
import type { SmsProvider } from '../interfaces/SmsProvider'

export class TwilioSmsProvider implements SmsProvider {
  private client: twilio.Twilio

  constructor() {
    this.client = twilio(
      requireServerEnv('TWILIO_ACCOUNT_SID'),
      requireServerEnv('TWILIO_AUTH_TOKEN')
    )
  }

  async send(to: string, body: string): Promise<void> {
    try {
      await this.client.messages.create({
        body,
        from: requireServerEnv('TWILIO_PHONE_NUMBER'),
        to,
      })
      console.log(`[TwilioSMS] Sent to ${to.substring(0, 6)}xxx`)
    } catch (e) {
      console.error('[TwilioSMS] send failed:', e)
      throw new Error(`[TwilioSMS] Failed to send: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async sendUrgent(to: string, body: string): Promise<void> {
    await this.send(to, `🚨 URGENT — ${body}`)
  }
}
```

Install: `npm install twilio`

Update `providers.ts` resolver for `smsProvider`.

Wire post-call SMS into the Retell webhook: after processing is complete, call `smsProvider.send()` for each linked family member whose `notification_prefs.sms === true`.

Wire emergency SMS: update `createAlertsFromCall()` to call `smsProvider.sendUrgent()` for emergency severity alerts.

---

### PHASE 22 — SendGrid Email Provider

**Prerequisites:**
- SendGrid account created
- Sender email verified in SendGrid
- `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` set in `.env.local` and Vercel

**Checklist:**
```
PHASE 22 CHECKLIST
[ ] SendGridEmailProvider implements EmailProvider interface
    VERIFY: npx tsc --noEmit
    PASS: Zero errors

[ ] providers.ts resolves to SendGridEmailProvider when SENDGRID_API_KEY present
    VERIFY: npx tsx -e "const p=require('./lib/providers'); console.log(p.emailProvider.constructor.name)"
    PASS: Prints "SendGridEmailProvider"

[ ] Post-call email sends correctly
    VERIFY: npx tsx scripts/test-email.ts (sends to your own email)
    PASS: Email received, renders correctly in Gmail

[ ] Email renders correctly on mobile
    VERIFY: Open received email on your phone
    PASS: Readable without zooming, buttons tappable

[ ] Alert email sends for urgent alerts
    VERIFY: Create test urgent alert, check email
    PASS: Alert email received with amber styling

[ ] Welcome email sends on new subscription
    VERIFY: Trigger welcome email manually via test script
    PASS: Welcome email received
```

**Build instructions:**

Install: `npm install @sendgrid/mail`

Create `/lib/services/SendGridEmailProvider.ts` implementing `EmailProvider`.

Email templates (inline CSS only — no Tailwind, email clients don't support it):
- All emails: navy header (`#1B3A6B`), warm cream body (`#FAFAF5`), teal CTA buttons (`#2A9D8F`)
- Font stack: Georgia, serif for headings; -apple-system, Arial, sans-serif for body
- Minimum font size: 18px body, 22px headings — senior-readable

Post-call email structure:
```
[NAVY HEADER: ThriveAtHome + "Check-in update for [Senior Name]"]
[BODY]
  Today's check-in — [date]
  
  Mood: [emoji] [score]/10
  Energy: ⚡ [score]/10  
  Comfort: 💚 [score]/10
  Medications: ✓ Taken / ✗ Not taken
  
  [AI summary paragraph — Cormorant Garamond equivalent, large italic]
  
  [If alert: amber box with alert description]
  
  [TEAL BUTTON: "View Full Dashboard"]

[FOOTER: "You're receiving this because you're connected to [Senior Name] on ThriveAtHome."]
```

Wire into post-call pipeline alongside SMS.

---

### PHASE 23 — Weekly and Monthly Digests

**What this builds:** Automatic weekly summary emails every Sunday and monthly care summaries on the 1st.

**Checklist:**
```
PHASE 23 CHECKLIST
[ ] Weekly digest cron runs on Sundays
    VERIFY: cat vercel.json shows Sunday cron entry
    PASS: Cron entry present

[ ] Weekly digest email generates correctly
    VERIFY: npx tsx scripts/test-weekly-digest.ts
    PASS: Email shows 7-day mood trend summary, highlights, and family talking points

[ ] Monthly summary cron runs on 1st of month
    VERIFY: Trigger manually, check email
    PASS: Monthly email received with 30-day summary

[ ] Family nudge sends after 7-day absence
    VERIFY: Set last_login_at to 8 days ago, trigger nudge cron
    PASS: Nudge email received (in addition to Realtime notification from V1)
```

Add to `vercel.json`:
```json
{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 0" },
{ "path": "/api/cron/monthly-summary", "schedule": "0 9 1 * *" }
```

Create the cron routes. Each queries active members, generates digest via `aiProvider.generateWeeklyDigest()` or `aiProvider.generateMonthlySummary()`, sends via `emailProvider.sendWeeklyDigest()` or `emailProvider.sendMonthlySummary()`.

---

## ═══ M11 — BILLING ═══

### PHASE 24 — Stripe Product Setup + Config

**Prerequisites:**
- Stripe account created
- Test mode API keys set in `.env.local` and Vercel: `STRIPE_SECRET_KEY` (sk_test_...), `STRIPE_PUBLISHABLE_KEY` (pk_test_...)
- In Stripe dashboard: create 4 products with monthly prices:
  - Thrive Basics: $19/month
  - Thrive Connect: $39/month
  - Thrive Complete: $69/month
  - Thrive Premier: $129/month
- Copy the Price IDs (price_...) for each into `.env.local`:
  `STRIPE_PRICE_ID_BASICS`, `STRIPE_PRICE_ID_CONNECT`, `STRIPE_PRICE_ID_COMPLETE`, `STRIPE_PRICE_ID_PREMIER`

**Checklist:**
```
PHASE 24 CHECKLIST
[ ] All 4 Stripe Price IDs set in .env.local
    VERIFY: grep STRIPE_PRICE_ID .env.local
    PASS: Shows 4 non-empty values

[ ] StripeBillingProvider implements BillingProvider interface
    VERIFY: npx tsc --noEmit
    PASS: Zero errors

[ ] providers.ts resolves to StripeBillingProvider when STRIPE_SECRET_KEY present
    VERIFY: npx tsx -e "const p=require('./lib/providers'); console.log(p.billingProvider.constructor.name)"
    PASS: Prints "StripeBillingProvider"

[ ] /pricing page updated with real plan cards
    VERIFY: Navigate to /pricing
    PASS: Four plan cards visible with correct prices and features

[ ] /dashboard/billing page updated
    VERIFY: Navigate to /dashboard/billing (logged in)
    PASS: Shows current plan, not "Coming soon"
```

**Build instructions:**

Install: `npm install stripe`

Create `/lib/stripe/config.ts`:
```ts
import { requireEnv } from '../env'

export const STRIPE_PLANS = {
  basics: {
    name: 'Thrive Basics',
    price: 19,
    priceId: requireEnv('STRIPE_PRICE_ID_BASICS'),
    features: ['Daily AI check-ins', 'Medication reminders', 'Family dashboard', 'SOS alerts'],
  },
  connect: {
    name: 'Thrive Connect',
    price: 39,
    priceId: requireEnv('STRIPE_PRICE_ID_CONNECT'),
    features: ['Everything in Basics', 'Volunteer connections', 'Virtual events', 'Grief circle access'],
  },
  complete: {
    name: 'Thrive Complete',
    price: 69,
    priceId: requireEnv('STRIPE_PRICE_ID_COMPLETE'),
    features: ['Everything in Connect', 'Care navigator (2 hrs/month)', 'Skill exchange', 'Health monitoring'],
  },
  premier: {
    name: 'Thrive Premier',
    price: 129,
    priceId: requireEnv('STRIPE_PRICE_ID_PREMIER'),
    features: ['Everything in Complete', 'Dedicated navigator (8 hrs/month)', 'Companion credits ($50/mo)', 'Milestone celebrations'],
  },
} as const
```

Create `/lib/services/StripeBillingProvider.ts` implementing `BillingProvider`.

Update `/app/pricing/page.tsx` — replace placeholder with real pricing cards using `STRIPE_PLANS`.

Update `/app/dashboard/billing/page.tsx` — show current plan, next billing date, upgrade/cancel options.

---

### PHASE 25 — Stripe Checkout Flow

**Checklist:**
```
PHASE 25 CHECKLIST
[ ] Checkout session creates correctly
    VERIFY: Click "Get started" on Basics plan, confirm Stripe checkout page loads
    PASS: Redirected to Stripe hosted checkout with correct price

[ ] Test payment completes
    VERIFY: Complete checkout with test card 4242 4242 4242 4242
    PASS: Redirected to /dashboard?subscribed=true, success banner visible

[ ] subscriptions row created in Supabase
    VERIFY: Check subscriptions table after test payment
    PASS: Row exists with correct plan_tier and stripe_subscription_id

[ ] members.plan_tier updated
    VERIFY: Check members table after test payment
    PASS: plan_tier matches the purchased plan

[ ] Stripe webhook secret set
    VERIFY: grep STRIPE_WEBHOOK_SECRET .env.local
    PASS: Non-empty value
```

**Build instructions:**

Create `/app/api/billing/checkout/route.ts`:
- Accepts `POST { planTier }` — authenticated
- Creates or retrieves Stripe Customer for the family member's email
- Creates Stripe Checkout Session with correct Price ID
- Success URL: `/dashboard?subscribed=true`
- Cancel URL: `/pricing`
- Returns `{ checkoutUrl }`

Add `STRIPE_WEBHOOK_SECRET` to `.env.local`:
- In Stripe dashboard: Developers → Webhooks → Add endpoint → your Vercel URL `/api/webhooks/stripe`
- Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the signing secret

---

### PHASE 26 — Stripe Webhook + Billing Management

**Checklist:**
```
PHASE 26 CHECKLIST
[ ] Webhook verifies Stripe signature
    VERIFY: Send unsigned request to /api/webhooks/stripe
    PASS: Returns 401

[ ] checkout.session.completed creates subscription row
    VERIFY: Use Stripe CLI to replay event: stripe trigger checkout.session.completed
    PASS: subscriptions row created, members.plan_tier updated

[ ] invoice.payment_failed sends email
    VERIFY: stripe trigger invoice.payment_failed
    PASS: Payment failure email sent to family member

[ ] customer.subscription.deleted marks cancelled
    VERIFY: stripe trigger customer.subscription.deleted
    PASS: subscriptions.status = 'cancelled', members.status = 'inactive'

[ ] Billing management page shows Stripe Customer Portal link
    VERIFY: Navigate to /dashboard/billing, click "Manage subscription"
    PASS: Redirected to Stripe Customer Portal
```

**Build instructions:**

Install Stripe CLI for local webhook testing: follow Stripe CLI docs.

Create `/app/api/webhooks/stripe/route.ts`:
- Verify signature using `stripe.webhooks.constructEvent()`
- Handle each event type
- Always return 200 after processing — Stripe retries on non-200

Create `/app/api/billing/portal/route.ts`:
- Accepts `POST` — authenticated
- Creates Stripe Customer Portal session for the family member's Stripe customer
- Returns portal URL

---

## ═══ M12 — COMPLIANCE ═══

### PHASE 27 — HIPAA Baseline

**Prerequisites — must be complete before this phase:**
- Supabase BAA signed (requires Pro plan — supabase.com/pricing)
- Twilio BAA signed (twilio.com/hipaa)
- Retell AI BAA signed (contact Retell AI directly)
- Anthropic BAA signed (anthropic.com enterprise)
- SendGrid BAA signed (Twilio covers this or contact separately)

**Checklist:**
```
PHASE 27 CHECKLIST
[ ] All 5 BAAs signed and stored
    VERIFY: Human confirms — this cannot be automated
    PASS: BAA documents saved securely

[ ] Audit log entries created for all health data access
    VERIFY: Query audit_log after loading dashboard
    PASS: SELECT entries exist for members and check_in_calls

[ ] Privacy policy page exists at /privacy
    VERIFY: Navigate to /privacy
    PASS: Real privacy policy, not "Coming soon"

[ ] Data deletion endpoint works
    VERIFY: POST to /api/admin/delete-member with test member ID
    PASS: All member data deleted across all tables, audit log entry created

[ ] HTTPS enforced
    VERIFY: Visit http:// version of production URL
    PASS: Redirects to https:// automatically (Vercel does this)

[ ] No credentials in git history
    VERIFY: git log --all --full-history -- .env* | head -5
    PASS: No .env files in git history
```

**Build instructions:**

Create `/app/privacy/page.tsx` — real privacy policy including:
- What data we collect and why
- How call recordings are stored and who can access them
- Data retention policy (calls retained for 2 years)
- How to request data deletion
- Contact information for privacy requests
- HIPAA notice

Create `/app/api/admin/delete-member/route.ts`:
- Admin only
- Accepts `DELETE { memberId, confirmationCode }`
- Hard-deletes all rows in: check_in_calls, alerts, realtime_notifications, notification_log, emergency_log, family_members, navigator_assignments, navigator_notes, navigator_tasks, subscriptions, family_task_items, family_messages, document_vault_items, medication_schedules, members
- Also deletes Supabase Auth user
- Also deletes Stripe customer if exists
- Logs deletion event to audit_log before deleting
- Returns confirmation

---

### PHASE 28 — Final Accessibility Audit + Production Hardening

**Checklist:**
```
PHASE 28 CHECKLIST
[ ] Zero axe-cli violations on all pages
    VERIFY: npx axe-cli [url]/ --tags wcag2aa (run for each page)
    PASS: Zero violations on: /, /login, /signup, /onboarding, /dashboard,
          /dashboard/calls, /navigator, /pricing

[ ] npx tsc --noEmit passes
    VERIFY: Run in terminal
    PASS: Zero errors

[ ] npm run build passes
    VERIFY: Run in terminal
    PASS: Zero errors, all routes listed

[ ] No console errors on any page
    VERIFY: Open each page in browser, check DevTools Console
    PASS: Zero red errors on all pages

[ ] All pages load under 3 seconds
    VERIFY: Chrome DevTools → Network → reload each page
    PASS: DOMContentLoaded under 3 seconds on dashboard

[ ] Production deploy successful
    VERIFY: git push, wait for Vercel deploy, visit production URL
    PASS: All pages load correctly in production

[ ] Real user test: 65+ adult
    VERIFY: Human must conduct this test — cannot be automated
    PASS: 65+ adult completes signup → onboarding → dashboard without assistance

[ ] Error monitoring in place
    VERIFY: Check Vercel → Logs → Functions for any error patterns
    PASS: No unexpected errors in production logs after 24 hours
```

**Build instructions:**

Fix all axe-cli violations found. Common issues to check proactively:
- Images missing alt text
- Buttons without accessible labels
- Form fields without associated labels
- Colour contrast failures
- Missing ARIA roles on dynamic content

Add error boundaries to all major page sections — any section that fails should show a friendly error, not crash the whole page.

Final `git push`:
```bash
git add .
git commit -m "M7-M12 complete: navigator console, AI calls, SMS/email, billing, HIPAA compliance"
git push
```

---

## M7–M12 COMPLETION

When Phase 28 is approved, add to `progress.md`:

```
M7-M12 COMPLETE — ALL ADD-ON PHASES APPROVED
Ready for M13-M18 Advanced Features when prompt-advanced.md is provided.
```

The platform now has:
- Navigator console with full caseload management
- Real AI daily check-in calls via Aria
- 24/7 concierge line
- Real SMS and email to families after every call
- Stripe subscription billing
- HIPAA compliance baseline

---

## ENVIRONMENT VARIABLES NEEDED FOR M7–M12

Add these to `.env.local` and Vercel as you reach each milestone:

```bash
# M8 — AI Calls
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_WEBHOOK_SECRET=     # openssl rand -base64 32
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# M9 — Concierge
RETELL_CONCIERGE_AGENT_ID=
TWILIO_CONCIERGE_NUMBER=
ONCALL_NAVIGATOR_PHONE=    # your mobile number for testing
LANGUAGE_LINE_ACCOUNT_NUMBER=
LANGUAGE_LINE_SIP_ENDPOINT=

# M10 — SMS/Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# M11 — Billing
STRIPE_SECRET_KEY=          # sk_test_... during development
STRIPE_PUBLISHABLE_KEY=     # pk_test_...
STRIPE_WEBHOOK_SECRET=      # from Stripe dashboard after registering webhook
STRIPE_PRICE_ID_BASICS=     # price_... from Stripe dashboard
STRIPE_PRICE_ID_CONNECT=
STRIPE_PRICE_ID_COMPLETE=
STRIPE_PRICE_ID_PREMIER=
```
