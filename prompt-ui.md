# ThriveAtHome — UI Polish Prompt (v1.0)

> **Read this entire file before writing a single line of code.**
> This is the UI polish pass for ThriveAtHome V1. It redesigns the visual layer
> without touching any business logic, database queries, or auth flows.
> The agentic loop protocol from prompt.md applies here too — one phase at a time,
> human approval before every phase transition, BLOCKED after 3 failed hypotheses.

---

## SCOPE

This document covers **UI Polish Phases P1–P8**:

| Phase | What gets redesigned |
|-------|---------------------|
| P1 | Design system — tokens, typography, colour, spacing |
| P2 | Component library — all 14 primitives rebuilt |
| P3 | Landing page |
| P4 | Login and signup pages |
| P5 | Onboarding form — all 3 steps |
| P6 | Family dashboard — main page |
| P7 | Call history and family coordination tools |
| P8 | Final accessibility audit and production deploy |

**What does NOT change:**
- No business logic
- No database queries or Supabase calls
- No auth flows
- No API routes
- No Edge Functions
- No `providers.ts` or any file in `/lib/data/`, `/lib/alerts/`, `/lib/realtime/`

If a file is not in `/app/`, `/components/`, `/app/globals.css`, or `tailwind.config.ts` — do not touch it.

---

## AESTHETIC DIRECTION

**Concept: Warm Luxury Care**

ThriveAtHome serves adult children who are worried about their aging parents, and seniors who value their dignity and independence. The UI must feel like a premium private health concierge — not a hospital system, not a generic SaaS dashboard, not a startup app.

**The one thing a user will remember:** It felt like someone actually cared about getting the details right. Every screen feels considered, unhurried, and warm.

**Aesthetic reference:** A high-end private members club meets a family home. Think: the New Yorker magazine's typographic authority, combined with the warmth of a well-loved living room.

**Tone:** Refined warmth. Confident without being cold. Caring without being clinical. Premium without being intimidating.

---

## DESIGN SYSTEM

### Colour palette

```css
/* Primary */
--color-navy:        #1B3A6B;   /* Primary brand — headings, nav, key UI */
--color-navy-dark:   #122848;   /* Hover states, pressed buttons */
--color-navy-light:  #2A5298;   /* Secondary actions, links */

/* Accent */
--color-teal:        #2A9D8F;   /* Success states, positive data, CTAs */
--color-teal-light:  #3DBFB0;   /* Hover on teal elements */
--color-teal-muted:  #E8F5F4;   /* Teal tint backgrounds */

/* Warm neutrals — never pure white */
--color-cream:       #FAFAF5;   /* Page background */
--color-warm-white:  #F5F4EF;   /* Card backgrounds */
--color-warm-grey:   #E8E6DF;   /* Borders, dividers */
--color-warm-mid:    #C4BFB4;   /* Disabled states, placeholder text */

/* Text */
--color-text-primary:   #1A1814;  /* Main body text */
--color-text-secondary: #4A4640;  /* Supporting text, labels */
--color-text-muted:     #7A746C;  /* Timestamps, metadata */

/* Alert severity — warm, not alarming */
--color-info:           #E8F0FB;  /* Background */
--color-info-text:      #1B3A6B;
--color-concern:        #FDF3E3;
--color-concern-text:   #8B5E0A;
--color-concern-border: #E8A020;
--color-urgent:         #FEF0ED;
--color-urgent-text:    #9B2D1A;
--color-urgent-border:  #E84020;
--color-emergency:      #2D0A06;  /* Dark — demands immediate attention */
--color-emergency-text: #FFFFFF;

/* Mood scores */
--color-mood-high:   #2A7A4F;   /* 7–10 — warm green */
--color-mood-mid:    #8B6914;   /* 4–6  — amber */
--color-mood-low:    #9B2D1A;   /* 1–3  — deep red */
```

### Typography

Install these Google Fonts in `app/layout.tsx`:

```
Display font:  "Cormorant Garamond" — weights 400, 500, 600
               Used for: page titles, hero headings, senior names, section headers
               Feel: authoritative, warm, trustworthy — like a private clinic letterhead

Body font:     "DM Sans" — weights 400, 500, 600
               Used for: all body text, labels, buttons, navigation
               Feel: clean and modern but warmer than Inter — never clinical

Mono font:     "DM Mono" — weight 400
               Used for: data values, scores, timestamps
               Feel: precise without being cold
```

Add to `app/layout.tsx`:
```tsx
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
})
```

Apply to `<body>`:
```tsx
<body className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
```

### Spacing scale

All spacing uses multiples of 4px. Key values:
- `4px` — tight spacing within components
- `8px` — between related elements
- `12px` — between list items
- `16px` — standard padding
- `24px` — section padding, card padding
- `32px` — between sections
- `48px` — large section gaps
- `64px` — page-level vertical rhythm

### Shadows

```css
--shadow-sm:  0 1px 2px rgba(26, 24, 20, 0.06);
--shadow-md:  0 4px 12px rgba(26, 24, 20, 0.08), 0 1px 3px rgba(26, 24, 20, 0.06);
--shadow-lg:  0 8px 24px rgba(26, 24, 20, 0.10), 0 2px 6px rgba(26, 24, 20, 0.06);
--shadow-card: 0 2px 8px rgba(26, 24, 20, 0.07);
```

### Border radius

```css
--radius-sm:  6px;   /* Badges, small tags */
--radius-md:  10px;  /* Inputs, buttons, small cards */
--radius-lg:  16px;  /* Cards, panels */
--radius-xl:  24px;  /* Modal, large cards */
--radius-full: 9999px; /* Pills, avatars */
```

### Tailwind config additions

Add to `tailwind.config.ts`:

```ts
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
  mono:    ['var(--font-mono)', 'monospace'],
},
fontSize: {
  // Senior-accessible sizing — minimum 18px body
  'xs':   ['13px', { lineHeight: '1.5' }],
  'sm':   ['15px', { lineHeight: '1.5' }],
  'base': ['18px', { lineHeight: '1.65' }],   // Senior minimum
  'lg':   ['20px', { lineHeight: '1.6' }],
  'xl':   ['24px', { lineHeight: '1.5' }],
  '2xl':  ['28px', { lineHeight: '1.4' }],
  '3xl':  ['34px', { lineHeight: '1.3' }],
  '4xl':  ['42px', { lineHeight: '1.2' }],
  '5xl':  ['52px', { lineHeight: '1.1' }],
},
```

---

## COMPONENT STANDARDS

All components must meet these requirements — no exceptions:

**Accessibility:**
- Minimum touch target: `56px × 56px` (not 52px — senior users need more)
- Contrast ratio: ≥ 7:1 for all text (AAA standard)
- Focus ring: `2px solid var(--color-teal)` with `2px offset` — always visible, never suppressed
- All interactive elements: keyboard navigable
- Error messages: complete sentences, positioned below the failing field

**Typography:**
- Body text minimum: `text-base` (18px) — never smaller on user-facing pages
- Labels: `text-lg` (20px) minimum — seniors must be able to read them without zooming
- Buttons: `text-lg font-medium`

**Motion:**
- Page load: staggered fade-in with `animation-delay` — subtle, not flashy
- Hover states: `transition-all duration-200`
- No animations that flash or move rapidly — can cause discomfort for seniors

---

## PHASE-BY-PHASE BUILD INSTRUCTIONS

---

## P1 — Design System

**Deliverable:** Updated `globals.css`, `tailwind.config.ts`, and `app/layout.tsx` with all new tokens.

**Steps:**
1. Install Google Fonts via `next/font/google` in `app/layout.tsx`
2. Update `app/globals.css` — add all CSS custom properties from the design system above
3. Update `tailwind.config.ts` — add font families, font sizes, custom colours mapped to CSS vars
4. Add a global base style to `globals.css`:
```css
body {
  font-family: var(--font-body);
  background-color: var(--color-cream);
  color: var(--color-text-primary);
  font-size: 18px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  color: var(--color-navy);
  font-weight: 500;
  letter-spacing: -0.01em;
}
```

**Checklist:**
```
P1 CHECKLIST
[ ] Google Fonts installed and loading — verify in browser DevTools → Network tab → Fonts
[ ] CSS custom properties visible — verify: open DevTools → Elements → :root → all --color-* vars present
[ ] Tailwind config updated — verify: npx tsc --noEmit passes
[ ] Body font is DM Sans — verify visually in browser
[ ] A heading is Cormorant Garamond — verify visually
[ ] Background is warm cream (#FAFAF5) — not pure white
[ ] npm run build passes — zero errors
```

---

## P2 — Component Library Rebuild

**Deliverable:** All 14 primitive components redesigned with the new design system. Each component looks and feels refined, premium, and accessible.

### Button

```tsx
// Variants and their visual treatment:
// primary: navy background, cream text, subtle inner shadow on hover
// secondary: transparent with navy border (1.5px), navy text, teal on hover
// teal: teal background, white text — for positive/confirmation actions
// ghost: no border, navy text, warm-grey background on hover
// danger: deep red background, white text

// ALL buttons:
// - min-h-[56px] min-w-[56px]
// - text-lg font-medium font-body
// - rounded-[var(--radius-md)]
// - px-6 for standard, px-8 for large
// - transition-all duration-200
// - focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2
// - Loading state: spinner replaces text, button disabled, opacity-70
// - Never outline: none without a replacement
```

### Card

```tsx
// Base card:
// - bg-[var(--color-warm-white)]
// - rounded-[var(--radius-lg)]
// - shadow-[var(--shadow-card)]
// - border border-[var(--color-warm-grey)]
// - p-6
//
// Variants:
// default: as above
// highlight: teal left border (4px), teal-muted background tint
// warning: concern-border left border, concern background
// danger: urgent-border left border, urgent background
// emergency: emergency background, white text, pulsing border animation
```

### Input and Select

```tsx
// Label: text-lg font-medium text-[var(--color-text-secondary)] mb-2
// Input: 
//   - h-14 (56px) — senior-accessible
//   - px-4 text-base
//   - bg-white border-[1.5px] border-[var(--color-warm-grey)]
//   - rounded-[var(--radius-md)]
//   - focus:border-[var(--color-teal)] focus:ring-2 focus:ring-teal/20
//   - placeholder:text-[var(--color-warm-mid)]
//   - Never placeholder-only — always a visible label above
// Error: text-sm text-[var(--color-urgent-text)] mt-1.5 flex items-center gap-1
//        Include a small ⚠ icon before the error text
```

### MoodEmoji

```tsx
// Score display — larger and more expressive:
// 8–10: 😊  bg-green-50  text-green-800  "Feeling great"
// 6–7:  🙂  bg-teal-muted text-teal-700  "Feeling well"
// 4–5:  😐  bg-amber-50  text-amber-700  "Feeling okay"
// 2–3:  😔  bg-orange-50 text-orange-700 "Feeling low"
// 1:    😞  bg-red-50    text-red-700    "Having a hard day"
// null: —   bg-warm-grey text-warm-mid   "No check-in yet"
//
// Display as a pill: emoji + score + label
// e.g.  😊  9/10  Feeling great
// Min width 160px so it never wraps awkwardly
```

### NotificationBell

```tsx
// Bell icon: 24px, navy colour
// Badge: teal background, white text, text-xs font-mono
//        Position: top-right, -4px offset
//        Animate: scale pulse when new notification arrives
// Dropdown:
//   - bg-white rounded-xl shadow-lg border border-warm-grey
//   - min-w-[320px] max-w-[400px]
//   - Each notification: border-b border-warm-grey py-3 px-4
//   - Unread: bg-teal-muted/30
//   - Read: bg-white
//   - Timestamp: text-sm font-mono text-muted
```

### StatusDot

```tsx
// Five states with label text:
// no_alerts:     green dot  + "All good"
// informational: blue dot   + "Note"
// concern:       amber dot  + "Attention"  — gentle pulse animation
// urgent:        orange dot + "Urgent"     — pulse animation
// emergency:     red dot    + "Emergency"  — rapid pulse animation
//
// Always render: dot + label (never dot alone — colour can't be sole indicator)
// Size variants: sm (8px dot), md (10px dot, default), lg (14px dot)
```

### Toast

```tsx
// Position: top-right, 24px from edges
// Width: 360px max
// Stack: multiple toasts stack vertically with 8px gap
// Animation: slide in from right, fade out on dismiss
//
// Variants:
// info:      navy left border, navy icon, cream background
// success:   teal left border, teal icon, teal-muted background
// concern:   concern-border left border
// urgent:    urgent-border left border
// emergency: emergency background, white text — full width, centred
//
// Auto-dismiss: 6 seconds (not 5 — seniors need more reading time)
// Always include: icon + title + optional body text + close button (×)
// Close button min 44×44px touch target
```

**Checklist:**
```
P2 CHECKLIST
[ ] All 14 components render at /test-ui — visually inspect every variant
[ ] Body text is DM Sans, headings are Cormorant Garamond — confirmed visually
[ ] Background is warm cream — not pure white
[ ] All buttons min 56px height — inspect in DevTools
[ ] All inputs min 56px height — inspect in DevTools
[ ] Focus rings visible on all interactive elements — tab through /test-ui
[ ] Contrast ratio ≥ 7:1 on all text — check with DevTools → Accessibility
[ ] MoodEmoji shows emoji + score + label — all 6 states visible
[ ] StatusDot shows dot + label — not dot alone
[ ] Toast auto-dismisses after 6 seconds
[ ] npx tsc --noEmit passes
[ ] Delete /test-ui page after approval
```

---

## P3 — Landing Page

**Deliverable:** A world-class landing page that a family member would trust with their parent's care.

**Layout:** Full-screen hero, then three sections, then CTA.

### Hero section

```
Full viewport height (100vh minimum)
Background: warm cream with a very subtle warm gradient mesh — 
  radial-gradient from teal-muted at top-left, cream at centre, navy/5 at bottom-right
  Opacity of gradient: 0.4 — barely there, just adds depth

Left column (60% width on desktop, full width on mobile):
  
  Eyebrow text: "Trusted by families across America"
  Font: DM Sans text-sm font-medium tracking-widest uppercase text-teal
  
  Headline (two lines):
    "Peace of mind."
    "Independence for those you love."
  Font: Cormorant Garamond, 5xl (52px) on desktop, 3xl on mobile
  Colour: navy
  Weight: 500
  Line height: 1.1
  
  Subheading:
    "Daily AI check-ins, real-time family updates, and a care network 
    that treats your senior like family — not a patient."
  Font: DM Sans text-xl text-text-secondary
  Max width: 520px
  
  Two buttons, side by side:
    Primary: "Start free trial" — navy, large
    Secondary: "See how it works" — ghost, large
  
  Trust indicators (below buttons):
    Three items in a row: 
    ✓ No contracts  ✓ Cancel anytime  ✓ HIPAA compliant
    Font: DM Sans text-sm text-muted

Right column (40% width on desktop, hidden on mobile):
  A styled card showing a mock "Today's check-in" — 
  Margaret Chen, mood 8/10, medication taken, brief summary text
  This gives immediate product context without needing a screenshot
  Card uses the new Card component, realistic but obviously illustrative
  Subtle rotation: rotate-1 and shadow-lg
```

### Three feature sections

```
Section 1: "Daily AI check-ins"
  Icon: a phone with a warm glow (SVG)
  Headline (display font): "Aria calls every morning."
  Body: "Our AI care companion calls your senior daily — a warm, natural conversation 
  that checks in on mood, sleep, medications, and wellbeing. Not a checklist. A connection."

Section 2: "Real-time family updates"  
  Icon: a bell/notification (SVG)
  Headline: "You know within minutes."
  Body: "After every call, your family gets an instant update — what was discussed, 
  how they're feeling, anything that needs attention. No more wondering."

Section 3: "Human care when it matters"
  Icon: two hands (SVG)
  Headline: "People, not just technology."
  Body: "When something needs a human touch, our care navigators step in — 
  coordinating volunteers, connecting families, and making sure no one falls through the cracks."

Layout: three columns on desktop, stacked on mobile
Each section: icon (40px, teal), headline (display font 2xl), body (base)
Background: white, full-width section with 80px vertical padding
```

### Pricing preview

```
Three plan cards — Basics, Connect, Complete
Most popular: Connect — slightly elevated with teal border
Layout: three columns on desktop, stacked on mobile
Each card: plan name (display font xl), price (mono font 3xl), 
feature list (DM Sans base), CTA button
Background: cream section
```

### Final CTA

```
Full-width navy section
Headline (display font, cream): "Your parent deserves to feel remembered."
Subtext (DM Sans, cream/80): "Join thousands of families who've found peace of mind."
Button: teal, large — "Start caring now"
```

**Checklist:**
```
P3 CHECKLIST
[ ] Hero loads and the headline is Cormorant Garamond — visually confirmed
[ ] Mock wellness card renders correctly in hero
[ ] Page is fully readable on mobile (375px) — no horizontal scroll
[ ] All text ≥ 18px — check in DevTools
[ ] Buttons are 56px height minimum
[ ] Gradient background is subtle — not overpowering
[ ] Three feature sections render correctly
[ ] Pricing cards render, Connect is highlighted
[ ] Final CTA section is navy with cream text
[ ] npx tsc --noEmit passes
```

---

## P4 — Login and Signup Pages

**Deliverable:** Authentication pages that feel trustworthy and calm — not like a generic SaaS login.

### Shared layout

```
Two columns on desktop (50/50):
  Left: navy background with brand content
    - ThriveAtHome logo/wordmark (display font, cream, 2xl)
    - A single reassuring quote in display font, large, cream
      Login: "Welcome back. Margaret is waiting to hear from you."
      Signup: "Join thousands of families finding peace of mind."
    - At the bottom: 3 trust indicators (HIPAA, No contracts, Cancel anytime) in cream/60
  
  Right: cream background with the form
    - Centered vertically
    - Max width 420px
    - Generous padding (48px)

Mobile: single column, navy header (collapsed), form below
```

### Form styling

```
Form title: Cormorant Garamond 3xl navy — "Sign in to ThriveAtHome" / "Create your account"
Subtitle: DM Sans base text-secondary — "Enter your details below"

All inputs: h-14, rounded-md, warm-grey border
All labels: text-lg font-medium — above every field, never placeholder-only

Login form:
  - Email input
  - Password input (show/hide toggle — eye icon, 44px touch target)
  - "Remember me" checkbox (custom styled — teal checkmark)
  - "Forgot password?" link — teal, text-sm, right-aligned
  - Submit button: full-width navy primary

Signup form:
  - Full name input
  - Email input
  - Password input (show/hide toggle)
  - Password strength indicator (4 segments, teal fill)
  - Relationship to senior (select dropdown)
  - Submit button: full-width navy primary
  - Below button: "Already have an account? Sign in" — text-sm link

Error messages:
  - Below each failing field
  - DM Sans text-sm text-urgent-text
  - ⚠ icon before text
  - Gentle red border on the failing input
```

**Checklist:**
```
P4 CHECKLIST
[ ] Login page: two-column layout on desktop, single column on mobile
[ ] Left panel is navy with quote text
[ ] All inputs are 56px height
[ ] Labels are visible above every input — no placeholder-only fields
[ ] Password show/hide toggle works
[ ] Error messages appear below failing fields
[ ] Submit buttons are full-width on mobile
[ ] npx tsc --noEmit passes
[ ] Functional test: sign up → login → redirected correctly (auth still works)
```

---

## P5 — Onboarding Form

**Deliverable:** A 3-step onboarding that feels like a thoughtful intake process — warm, human, never clinical.

### Overall design

```
Progress bar at top:
  - Three labelled steps: "About [Name]" → "Preferences" → "Safety"
  - Active step: teal with white text
  - Completed step: teal with checkmark
  - Upcoming step: warm-grey
  - Progress line connecting them: teal fills as steps complete

Page background: cream
Form card: white, rounded-xl, shadow-md, max-width 640px, centred
Card padding: 48px desktop, 24px mobile

Section headers within steps: Cormorant Garamond xl navy — not all-caps, not bold
Field labels: DM Sans text-lg font-medium text-secondary
Helper text: DM Sans text-sm text-muted — appears below label, above input
```

### Step 1 — About the senior

```
Opening line above the form (display font, xl, navy):
  "Tell us about the person you care for."

Fields (all with labels above, no placeholder-only):
  Full legal name — text input
  Preferred name — text input, helper: "What do they like to be called?"
  Date of birth — date picker or three selects (month/day/year)
    Validation: must be at least 60 years old — show gentle inline message
  Phone number — tel input, helper: "We'll have Aria call them at this number"
  Preferred language — select with 13 options
  Home address — address input (city, state, zip — not full street required)

"Next" button: full-width teal, 56px, bottom of card
```

### Step 2 — Call preferences

```
Opening line: "How would they like Aria to reach out?"

Fields:
  Preferred call time — radio cards (not a dropdown)
    Five options as large radio cards: Morning, Mid-morning, Afternoon, Late afternoon, Evening
    Each card: time range, brief description, radio indicator on right
    Selected: teal border, teal-muted background
  
  Timezone — select
  
  Check-in frequency — three radio cards:
    Daily, Every other day, Weekly
  
  Topics they enjoy — tag selector (multi-select pills)
    12 options as tappable pill buttons
    Selected: navy background, cream text
    Unselected: warm-grey border, text-secondary
  
  Topics to avoid — text area, optional, helper: "We'll make sure Aria steers clear of these"
```

### Step 3 — Safety & emergency contacts

```
Opening line: "Just in case — who should we reach if something comes up?"

Fields:
  Emergency contact 1 (required):
    Name, relationship (select), phone — in a light card with a warm-grey background
  
  Emergency contact 2 (optional):
    Same structure, labelled "Secondary contact (optional)"
    Collapsed by default — "Add another contact" expands it
  
  Primary care doctor (optional):
    Name and phone — in a card, optional label clear
  
  Current medications (textarea, optional):
    Helper: "A general list is fine — just helps Aria ask the right questions"
  
  Known health conditions (textarea, optional):
    Same helper approach
  
  Lives alone (toggle switch, not a dropdown):
    Large toggle, 56px tall, with "Yes, lives alone" / "Not alone" labels
  
  Mobility devices (checkbox group as pill tags, same as topic pills):
    Cane, Walker, Wheelchair, None
```

**Checklist:**
```
P5 CHECKLIST
[ ] Progress bar shows 3 labelled steps
[ ] Step 1: all fields labelled, no placeholder-only
[ ] Step 2: call time as radio cards (not dropdown)
[ ] Step 2: topic pills are tappable and toggle correctly
[ ] Step 3: emergency contact in a card
[ ] Step 3: "Add another contact" expands the second contact
[ ] Step 3: lives alone is a toggle switch
[ ] Validation errors appear below failing fields
[ ] Form data survives page refresh (localStorage)
[ ] Submit creates member row with plan_tier='basics' — check Supabase after submission
[ ] Confirmation page shows senior's preferred name
[ ] Mobile: no horizontal scroll, all elements accessible at 375px
[ ] npx tsc --noEmit passes
```

---

## P6 — Family Dashboard

**Deliverable:** The most important page in the product. Families open this on their phone to check on their parent. It must be immediately reassuring.

### Navigation bar

```
Height: 64px
Background: white with border-b border-warm-grey
Shadow: shadow-sm

Left: ThriveAtHome wordmark — Cormorant Garamond xl navy
Centre (desktop only): navigation links — Dashboard, History, Family, Documents
Right: NotificationBell + senior's name + avatar initial (in teal circle) + dropdown

Mobile: wordmark left, bell + avatar right — no centre nav
Mobile nav: bottom tab bar with 4 icons (Dashboard, History, Family, Documents)
```

### Page header

```
Background: navy (full-width)
Height: auto, padding 32px vertical

Left:
  Eyebrow: DM Sans text-sm tracking-wide uppercase text-cream/60 — "Good morning, [Family Name]"
  Headline: Cormorant Garamond 3xl cream — "Checking in on [Senior Preferred Name]"
  
Right (desktop):
  StatusDot (large variant) + last check-in time
  e.g. "● All good  ·  Last check-in today at 9:14am"
  Font: DM Sans text-sm text-cream/80

Mobile: stacked, both left-aligned
```

### Today's Wellness Card

```
Full-width card, white background, rounded-xl, shadow-md
Padding: 32px desktop, 24px mobile
Margin: -24px top margin so it overlaps the navy header (creates depth)

Top row:
  Left: MoodEmoji (large variant) — emoji + score + label
  Right: date + "Today's check-in" label

Score grid (2×2 on desktop, 2×2 on mobile):
  Each score: label (text-sm text-muted) + value (text-2xl font-mono font-medium colour-coded)
  Mood, Energy, Comfort, Medication
  Medication: ✓ Taken (teal) or ✗ Not taken (concern amber) — never red for single miss
  
  Border between scores: warm-grey dividers
  
AI Summary:
  Separator line
  Quote marks (large, teal, decorative) before the text
  Cormorant Garamond text-xl text-text-primary italic
  "Margaret had a wonderful morning. She mentioned..."
  This is the most human element — make it feel like a letter, not a report.
  
  If no check-in today:
    Soft amber notice card inside the wellness card
    "Aria is scheduled to call Margaret at 9:00am today."
    DM Sans text-base
```

### Health Timeline

```
Card with tab selector for 7-day / 30-day / 60-day / 90-day
Tabs: pill style, selected = navy background cream text

Chart:
  Recharts LineChart
  Line colour: teal
  Dot colours: mood-high (green), mood-mid (amber), mood-low (red)
  No gridlines — just a subtle horizontal baseline
  Y-axis: "Great" at top, "Tough day" at bottom — no raw numbers
  X-axis: dates in DM Mono text-xs
  Smooth curve (type="monotone")
  
Below chart: AI-generated trend summary
  Cormorant Garamond text-lg italic text-text-secondary
  e.g. "Margaret's week has been mostly positive, with a particularly good day on Tuesday."
```

### Alerts Panel

```
No alerts empty state:
  Soft teal-muted card, 80px tall
  Teal checkmark icon (24px) + "No concerns this week" text
  Cormorant Garamond text-xl — feels warm, not like a system message

Active alerts:
  Each alert card uses the Card component (concern/urgent/emergency variant)
  Icon + severity badge + plain English description + time ago
  "Mark acknowledged" button — ghost variant, right-aligned
  
  Alert message language: always warm, never clinical
  e.g. "Aria noticed Margaret seemed a little low today — she mentioned feeling tired."
  Not: "mood_drop: score 4/10 — concern severity"
```

### Quick Actions

```
Four large action buttons in a 2×2 grid
Each: 80px tall, rounded-xl, warm-white background, navy icon + label
Hover: teal-muted background, teal border

Actions:
  "Talk to our team" (phone icon)
  "Request a volunteer" (person icon)  
  "View call history" (clock icon)
  "Update preferences" (settings icon)
```

**Checklist:**
```
P6 CHECKLIST
[ ] Navigation bar renders on desktop and mobile
[ ] Navy header overlapped by wellness card (negative margin creates depth)
[ ] Wellness card: all 4 scores visible, AI summary in italic display font
[ ] Health timeline: chart renders, all 4 tabs work
[ ] Alerts panel: empty state shows warm teal message
[ ] Alerts panel: test alert card renders with correct severity colour
[ ] Quick actions: 2×2 grid on mobile, 4-across on desktop
[ ] Realtime: insert test alert → card appears within 2 seconds, no refresh
[ ] Mobile at 375px: no horizontal scroll, all text readable
[ ] npx tsc --noEmit passes
```

---

## P7 — Call History and Family Tools

### Call History page (`/dashboard/calls`)

```
Page title: Cormorant Garamond 2xl navy — "Margaret's Call History"
Subtitle: DM Sans text-base text-muted — "Every conversation, summarised for you."

Call list:
  Each row: warm-white card, rounded-lg, padding 20px
  Left: date (DM Mono text-sm) + MoodEmoji (small)
  Right: medication badge + alert flags (if any)
  Click to expand: AI summary in italic display font, full scores grid

Load more: ghost button, centred

Empty state:
  Cormorant Garamond xl — "No calls yet"
  DM Sans base text-muted — "Aria will call Margaret for the first time at [time]."
```

### Family Tasks (`/dashboard/family/tasks`)

```
Page title: Cormorant Garamond 2xl — "Care Together"
Subtitle: "Tasks and notes shared with everyone caring for [Name]."

Create task: navy button, opens inline form (not a modal)
  Title input, type select (pill options), assign to (avatar pills), due date

Task list:
  Two sections: "Open" and "Completed" (collapsible)
  Each task: checkbox (custom teal) + title + assignee avatar + due date
  Completed: strikethrough title, muted colours

Realtime: new tasks appear with a subtle slide-in animation
```

### Documents (`/dashboard/documents`)

```
Page title: Cormorant Garamond 2xl — "Important Documents"
Subtitle: "Securely stored. Always accessible."

Upload zone: dashed warm-grey border, rounded-xl, 160px tall
  "Drop a file here, or click to upload"
  "PDF, JPG, PNG — max 10MB"
  Hover: teal dashed border, teal-muted background

Document list:
  Each item: warm-white card with file icon (type-specific colour), name, date, size
  Right side: Download button (ghost small) + Delete button (danger ghost small)

Error: large file rejected with warm amber notice (not red — calm, not alarming)
  "That file is a bit too large. Please upload files under 10MB."
```

**Checklist:**
```
P7 CHECKLIST
[ ] Call history renders with seed data, dates and mood emojis visible
[ ] Expanded call row shows AI summary in italic display font
[ ] Family tasks: create task works, task appears immediately
[ ] Documents: upload zone renders with dashed border
[ ] Documents: upload PDF → appears in list with download button
[ ] Documents: file > 10MB → calm amber error message
[ ] Documents: delete button removes the document
[ ] npx tsc --noEmit passes
[ ] Mobile at 375px: all three pages accessible, no horizontal scroll
```

---

## P8 — Final Accessibility Audit and Production Deploy

**Deliverable:** Zero WCAG 2.1 AA violations across all pages. Production site updated.

**Steps:**

1. Run axe-cli on all redesigned pages:
```bash
npx axe-cli http://localhost:3000 --tags wcag2aa
npx axe-cli http://localhost:3000/login --tags wcag2aa
npx axe-cli http://localhost:3000/signup --tags wcag2aa
npx axe-cli http://localhost:3000/onboarding --tags wcag2aa
npx axe-cli http://localhost:3000/dashboard --tags wcag2aa
npx axe-cli http://localhost:3000/dashboard/calls --tags wcag2aa
```

2. Fix every violation — zero is the requirement, not a target.

3. Run `npx tsc --noEmit` — zero errors.

4. Run `npm run build` — zero errors, all routes compile.

5. Commit and push:
```bash
git add .
git commit -m "UI polish: warm luxury design system, all pages redesigned"
git push
```

6. Verify Vercel deploys successfully. Open production URL. Confirm it loads correctly.

**Checklist:**
```
P8 CHECKLIST
[ ] axe-cli: zero violations on all 6 pages
[ ] npx tsc --noEmit: zero errors
[ ] npm run build: zero errors
[ ] git push triggers Vercel deployment
[ ] Production URL loads landing page correctly
[ ] Production URL: sign in works
[ ] Production URL: dashboard loads with real data
[ ] Mobile on real phone: no horizontal scroll, all text readable without zooming
```

---

## THE 65+ USABILITY TEST

Before marking UI polish complete, find a real person aged 65 or older who has not seen the product.

Ask them to:
1. Look at the landing page — what does this service do?
2. Sign up for an account
3. Add a senior family member
4. Find today's wellness update on the dashboard

Rules: you cannot help them. Watch silently. Note every point of confusion.

Fix every point of confusion before calling the UI polish complete.

This test is not optional.

---

## WHAT SUCCESS LOOKS LIKE

When the UI polish is complete, someone opening ThriveAtHome for the first time should feel:

- **Immediately reassured** — the design communicates care and quality before they read a single word
- **Never overwhelmed** — information is presented in a calm, legible hierarchy
- **Trusted** — the typography and colour choices feel considered and permanent, not trendy
- **Capable** — a 70-year-old with mild vision difficulties can use every page without help

If you open the dashboard and the first feeling is "this looks like it was made by a startup" — the polish is not complete. If the first feeling is "someone really thought about this" — it is.


---

## M25 Cultural Programming — September 2026 Update

M25 is fully complete:

**Cultural Programming routes:**
- /dashboard/communities — 20 Communities (12 cultural + 8 interest), Join/Leave, community events
- /dashboard/cultural-festivals — 23 upcoming festivals sorted by date, 'For your community' badges
- /dashboard/cultural-programming — 5 tabs: Classes, Potlucks, Story Circle, Heritage Projects, Oral History
- /dashboard/pet-loss-support — Pet Loss Circle feed, CrisisResourceBar at bottom

**Navigation pills on /dashboard/communities:**
- "📅 Cultural festival calendar" → /dashboard/cultural-festivals
- "🎎 Classes, potlucks & story circles" → /dashboard/cultural-programming

**Tables added:** cultural_festivals, cultural_classes, class_registrations, cultural_potlucks,
potluck_signups, cultural_story_contributions, heritage_projects, oral_history_recordings,
pet_loss_circle_members, pet_loss_circle_posts, pet_loss_support_requests

**Cron:** /api/cron/cultural-festivals — detects upcoming festivals, flags member circles, notifies

**M27 Pet UI routes:**
- /dashboard/pets — pet profiles, Add a pet, Mark as passed away
- /dashboard/celebrations — shows pet birthday badges (🎂) alongside member milestones
- /dashboard/pet-loss-support — Pet Loss Circle, request pet-loss support

**Agent UI references:** 
When referencing agents in UI text use: Aria (morning calls), Rosa (care line number shown in member portal),
Hope (crisis line shown alongside 988 on /crisis page), Quinn (concierge 24/7 number shown in all portals).
