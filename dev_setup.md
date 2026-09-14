# Thrive@Home — Developer Setup Guide (v1.0)

> **Complete every item on this list before telling the AI to start Phase 1.**
> The build assumes all of these are done. Missing items block the build at the worst possible time.

---

## For M1–M6, you only need three accounts

1. **GitHub + Codespaces** — your development environment
2. **Vercel** — hosts your app
3. **Supabase** — your database, auth, storage, and real-time notifications

That's it. No Twilio. No Stripe. No Anthropic. No Retell AI. Those are Add-Ons for M7–M12. The AI will ask for each credential exactly when it's needed — you don't need them yet.

---

## Budget: 45–90 minutes

Most of this is account creation and copying values — not technical work. You can split it across two sessions.

---

## Section 1 — GitHub Codespace

Your entire development environment runs in a GitHub Codespace — a full Linux computer in your browser. Nothing to install on your own computer.

### 1.1 — Create a GitHub account

1. Go to [github.com](https://github.com)
2. Click "Sign up" → create a personal account → verify your email

- [ ] GitHub account created and email verified

### 1.2 — Create the repository

1. Log in to github.com
2. Click "+" → "New repository"
3. Name: `thrive-at-home`
4. Visibility: **Private**
5. Check "Add a README file"
6. Click "Create repository"

- [ ] Repository `thrive-at-home` created as **Private**

### 1.3 — Launch a Codespace

1. Open your new repository on GitHub
2. Click the green "Code" button → "Codespaces" tab → "Create codespace on main"
3. Wait 60–90 seconds

VS Code will open in your browser. Verify:
```bash
node --version   # Must be v18.x.x or higher
git --version    # Must print a version number
openssl version  # Must print OpenSSL version
```

- [ ] Codespace launched — VS Code open in your browser
- [ ] `node --version` prints v18 or higher ← **stop if lower; install Node 18 LTS from nodejs.org**
- [ ] `git --version` and `openssl version` both print versions

### 1.4 — Understanding the Codespace

- **Terminal is inside the Codespace.** When the AI tells you to run a command, paste it in the terminal at the bottom of the browser VS Code window — not your computer's terminal.
- **Files go to GitHub on push.** The AI creates files in the Codespace. They go to GitHub when committed and pushed.
- **Codespace pauses on tab close.** Resume at: github.com → your repo → Code → Codespaces → click your existing Codespace.
- **Free tier:** 60 hours/month — more than enough.
- **Port forwarding:** When the dev server runs on port 3000, Codespaces creates a public URL. Find it: VS Code → "Ports" tab (next to Terminal) → port 3000 → right-click → "Set Port Visibility" → "Public". You'll need this for webhook testing in M8+.

- [ ] You know how to use the terminal inside the Codespace
- [ ] You know how to find the Ports tab
- [ ] You know how to resume a paused Codespace

---

## Section 2 — Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign up" → **Sign up with your GitHub account** (this links them automatically)

- [ ] Vercel account created and connected to GitHub

---

## Section 3 — Supabase

### 3.1 — Create account and project

1. Go to [supabase.com](https://supabase.com) → Sign up (GitHub login is easiest)
2. Click "New project"
3. Name: `thrive-at-home`
4. Region: **US East** (or closest to your users)
5. Set a strong database password → save it in a password manager
6. Click "Create new project" → wait ~2 minutes

- [ ] Supabase project created and fully initialized (green status indicator)

### 3.2 — Collect credentials

Go to your Supabase project → Settings → API:

| What to copy | Where | Variable name |
|-------------|-------|--------------|
| Project URL | Under "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon`/public key | Under "Project API keys" | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | Under "Project API keys" ⚠️ | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ The service_role key bypasses all security. Treat it exactly like a password. Never put it in a GitHub file.

- [ ] All three Supabase values saved securely

---

## Section 4 — Generate Secure Secrets

Run these in your **Codespace terminal**:

```bash
openssl rand -base64 32
# Run it twice, save each output separately
```

| Output | Variable name | Purpose |
|--------|--------------|---------|
| First output | `CRON_SECRET` | Protects scheduled job endpoints |

These look like: `K7mPx9QzR2nWvL4sYjA8bNcD1eF6gH0iJ3kM5oP=`

- [ ] `CRON_SECRET` generated and saved

---

## Section 5 — Assemble Your Credentials

Collect everything into one secure place — a password manager, private encrypted note, or a document that never leaves your computer. Not a GitHub file. Not a shared Google Doc.

```
=== CORE (fill these in now) ===
NEXT_PUBLIC_APP_URL=          [leave blank — filled after Phase 1 Vercel deploy]
CARE_TEAM_EMAIL=              [your email address]
CRON_SECRET=                  [your openssl output]

=== SUPABASE (fill these in now) ===
NEXT_PUBLIC_SUPABASE_URL=     https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[eyJ... key]
SUPABASE_SERVICE_ROLE_KEY=    [eyJ... key — treat like a password]

=== ADD-ON SERVICES (leave blank — the AI will ask when needed) ===
ANTHROPIC_API_KEY=            [M8 — AI calls]
RETELL_API_KEY=               [M8 — voice agent]
RETELL_AGENT_ID=              [M8 — filled after creating Aria agent]
RETELL_WEBHOOK_SECRET=        [M8 — openssl rand -base64 32]
RETELL_CONCIERGE_AGENT_ID=    [M9 — filled after creating concierge agent]
TWILIO_ACCOUNT_SID=           [M8/M10]
TWILIO_AUTH_TOKEN=            [M8/M10]
TWILIO_PHONE_NUMBER=          [M8/M10]
TWILIO_CONCIERGE_NUMBER=      [M9]
ONCALL_NAVIGATOR_PHONE=       [M10 — your mobile for testing]
SENDGRID_API_KEY=             [M10]
SENDGRID_FROM_EMAIL=          [M10]
STRIPE_SECRET_KEY=            [M11 — use sk_test_ until ready for live]
STRIPE_PUBLISHABLE_KEY=       [M11]
STRIPE_WEBHOOK_SECRET=        [M11]
STRIPE_PRICE_ID_BASICS=       [M11]
STRIPE_PRICE_ID_CONNECT=      [M11]
STRIPE_PRICE_ID_COMPLETE=     [M11]
STRIPE_PRICE_ID_PREMIER=      [M11]
CHECKR_API_KEY=               [M13]
CHECKR_WEBHOOK_SECRET=        [M13]
LANGUAGE_LINE_ACCOUNT_NUMBER= [M9 — takes 1-2 weeks to provision]
LANGUAGE_LINE_SIP_ENDPOINT=   [M9]
```

- [ ] Supabase + core variables assembled in a secure place

---

## Section 6 — Codespace Secrets

These protect your credentials if your Codespace is ever deleted.

1. github.com → profile photo → Settings → "Codespaces" (left sidebar) → "Codespaces secrets" → "New secret"
2. Add each credential with the exact variable name from Section 5

Add these now (the ones you have values for):
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CRON_SECRET`
- [ ] `CARE_TEAM_EMAIL`

---

## Section 7 — Final Pre-Build Checklist

Every item must be checked before telling the AI to start Phase 1.

**Codespace:**
- [ ] Running, VS Code open in browser
- [ ] `node --version` → v18+
- [ ] You know how to use the terminal (bottom panel)
- [ ] You know how to find the Ports tab

**Required for M1–M6:**
- [ ] GitHub repo `thrive-at-home` created as Private
- [ ] Vercel account connected to GitHub
- [ ] Supabase project created, 3 credentials saved
- [ ] `CRON_SECRET` generated and saved
- [ ] `CARE_TEAM_EMAIL` noted
- [ ] All 5 credentials added as Codespace Secrets

**Good to start collecting (needed for M7+):**
- [ ] Twilio — on your list to create before M8
- [ ] Retell AI — on your list; contact them about HIPAA BAA while creating account
- [ ] Anthropic — on your list before M8
- [ ] SendGrid — on your list before M10
- [ ] Stripe — on your list before M11

---

## Starting the build

Once every item in Section 7 is checked, open a **new Claude conversation** (not this one — a fresh one). Upload all 5 build files:
- `prompt.md`
- `checklist.md`
- `progress.md`
- `tests.md`
- `human_review.md`

Send this exact message:

> "I have completed all the items in dev_setup.md. I am using a GitHub Codespace. My GitHub repo `thrive-at-home` exists as Private, Vercel is connected to GitHub, my Supabase project is created and all 3 credentials plus CRON_SECRET and CARE_TEAM_EMAIL are saved as Codespace Secrets. Please read progress.md, checklist.md, and prompt.md, then begin Phase 1."

The AI will read those three files, confirm your setup, and begin Phase 1 — starting with `.gitignore` before anything else.

---

## Understanding the build loop

Here is what will happen in every phase:

1. **AI works** — writes code, runs verifications, marks checklist items as it confirms each one
2. **AI presents review** — exact format `✅ PHASE [N] — COMPLETE, AWAITING YOUR APPROVAL`
3. **You verify** — open `human_review.md`, find the phase, work through the items
4. **You reply APPROVED** (or **ISSUE: [description]** if something looks wrong)
5. **AI begins next phase**

If the AI gets stuck on a problem after 3 attempts, it will present a BLOCKED message instead of a phase review. See the BLOCKED section in `human_review.md` for how to handle that.

---

## HIPAA — Start outreach now (takes 2–4 weeks per vendor)

You do not need BAAs signed to build M1–M6 — no real health data enters the system until M8. But the process takes weeks, so start now.

| Vendor | How to start |
|--------|-------------|
| Supabase | Requires Pro plan ($25/mo). Dashboard → Settings → Organization → HIPAA |
| Twilio | twilio.com/hipaa |
| Retell AI | Contact directly — **verify they can sign a BAA before M8. If not, evaluate Bland AI.** |
| Anthropic | anthropic.com → enterprise sales |
| SendGrid | Covered under Twilio BAA or contact separately |

- [ ] BAA outreach on your calendar for this week

---

## What gets added after V1

| Milestone | Service needed | What it enables |
|-----------|--------------|----------------|
| M7 | No new services | Navigator console (UI only) |
| M8 | Anthropic + Retell AI + Twilio | Real AI check-in calls |
| M9 | Twilio (2nd number) + Language Line | 24/7 concierge line |
| M10 | Twilio SMS + SendGrid | Real SMS and email to families |
| M11 | Stripe | Subscription billing |
| M12 | No new services | HIPAA compliance + accessibility audit |
| M13–M18 | Various | Volunteers, Community, Services, Enterprise |

The AI will ask for each credential at exactly the right time.
