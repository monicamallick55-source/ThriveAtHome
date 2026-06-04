# ThriveAtHome — Legal, Compliance & Certification Tracker
# Last updated: June 2026

> Track every legal document, compliance requirement, and certification needed
> to operate ThriveAtHome legally and safely.
>
> Status options: ⬜ NOT STARTED | 🔄 IN PROGRESS | ✅ COMPLETE | ⏸ DEFERRED
> Priority: 🔴 CRITICAL (before first real user) | 🟡 IMPORTANT (before scaling) | 🟢 GROWTH (before enterprise)

---

## HIPAA Business Associate Agreements (BAAs)

**Must be signed before any real senior health data enters the system.**
A BAA is a legal contract required by HIPAA whenever a business associate handles Protected Health Information (PHI) on your behalf.

| Vendor | Purpose | Priority | Status | How to Get It | Notes |
|--------|---------|----------|--------|--------------|-------|
| **Supabase** | Database storing all health data | 🔴 CRITICAL | ⬜ NOT STARTED | Upgrade to Pro plan ($25/mo) → Settings → Legal → Request BAA | Required before onboarding any real senior |
| **Anthropic** | AI processes call transcripts (PHI) | 🔴 CRITICAL | ⬜ NOT STARTED | Email enterprise@anthropic.com — request HIPAA BAA | May require Enterprise plan |
| **Retell AI** | Records and processes senior voice calls | 🔴 CRITICAL | ⬜ NOT STARTED | Contact support@retellai.com — confirm they offer BAA | Verify they can sign before building deeply on platform |
| **Twilio** | Transmits call audio and SMS containing PHI | 🔴 CRITICAL | ⬜ NOT STARTED | twilio.com/hipaa — complete BAA request form | Covers both voice and SMS |
| **SendGrid** | Sends emails containing health summaries | 🔴 CRITICAL | ⬜ NOT STARTED | Covered under Twilio BAA or request separately from SendGrid | Confirm coverage scope |
| **Vercel** | Hosts the application | 🟡 IMPORTANT | ⬜ NOT STARTED | vercel.com/legal — contact enterprise team | Vercel may not offer BAA on Hobby plan — may need Pro |
| **Checkr** | Processes volunteer personal information | 🟡 IMPORTANT | ⬜ NOT STARTED | Available in Checkr dashboard under Legal | Required before processing volunteer background checks |

---

## Core Legal Documents

### Business Formation

| Document | Purpose | Priority | Status | Action Required | Cost Estimate |
|----------|---------|----------|--------|----------------|--------------|
| **Business Entity (LLC or C-Corp)** | Legal structure for the business | 🔴 CRITICAL | ⬜ NOT STARTED | File with your state's Secretary of State. C-Corp recommended if raising investment. LLC fine for bootstrapped. | $50–$500 filing fee |
| **EIN (Employer ID Number)** | Tax ID for the business | 🔴 CRITICAL | ⬜ NOT STARTED | Apply free at IRS.gov — takes 15 minutes online | Free |
| **Business Bank Account** | Separate business finances | 🔴 CRITICAL | ⬜ NOT STARTED | Open at any bank with EIN + formation documents | Free |
| **Registered Agent** | Legal address for official documents | 🔴 CRITICAL | ⬜ NOT STARTED | Use a registered agent service or your own address | $50–$150/year |

### Intellectual Property

| Document | Purpose | Priority | Status | Action Required | Cost Estimate |
|----------|---------|----------|--------|----------------|--------------|
| **Trademark — ThriveAtHome** | Protect brand name | 🟡 IMPORTANT | ⬜ NOT STARTED | File with USPTO at teas.uspto.gov — Class 44 (health services) and Class 42 (software) | $250–$350 per class |
| **Trademark — Aria** | Protect AI companion name | 🟡 IMPORTANT | ⬜ NOT STARTED | File alongside ThriveAtHome trademark | $250–$350 per class |
| **Copyright registration** | Protect platform content | 🟢 GROWTH | ⬜ NOT STARTED | copyright.gov — register key content | $65 per registration |

### User-Facing Legal Documents

| Document | Purpose | Priority | Status | Action Required | Notes |
|----------|---------|----------|--------|----------------|-------|
| **Privacy Policy** | HIPAA + state law compliance | 🔴 CRITICAL | 🔄 BUILT (needs review) | Have healthcare attorney review existing /privacy page | Built in platform — needs legal review |
| **Terms of Service** | User agreement | 🔴 CRITICAL | ⬜ NOT STARTED | Have attorney draft — must cover: senior care liability, AI limitations, emergency protocol | $1,500–$5,000 attorney cost |
| **Cookie Policy** | GDPR/CCPA compliance | 🟡 IMPORTANT | ⬜ NOT STARTED | Add to /privacy or separate page | Required for California users (CCPA) |
| **Accessibility Statement** | ADA compliance | 🟡 IMPORTANT | ⬜ NOT STARTED | Add page stating WCAG 2.1 AA compliance | Required to show good faith ADA compliance |
| **HIPAA Notice of Privacy Practices** | Required by HIPAA for covered entities | 🔴 CRITICAL | ⬜ NOT STARTED | Attorney-drafted notice, must be provided to all members | Distinct from privacy policy |

### Operational Legal Documents

| Document | Purpose | Priority | Status | Action Required | Notes |
|----------|---------|----------|--------|----------------|-------|
| **Volunteer Agreement & Liability Waiver** | Protect platform from volunteer incidents | 🔴 CRITICAL | ⬜ NOT STARTED | Attorney-drafted — covers: in-person visit liability, transportation, background check consent | Required before first volunteer is active |
| **Companion Contractor Agreement** | Paid companion independent contractor terms | 🟡 IMPORTANT | ⬜ NOT STARTED | Attorney-drafted — covers: IC status, payment terms, conduct standards, background check | Required before companion marketplace launches |
| **Care Navigator Employment/Contractor Agreement** | Navigator terms of service | 🔴 CRITICAL | ⬜ NOT STARTED | Attorney-drafted — covers: HIPAA obligations, caseload limits, crisis protocol, confidentiality | Required before first navigator is active |
| **Emergency Protocol Documentation** | Defines crisis response procedure | 🔴 CRITICAL | ⬜ NOT STARTED | Internal document — defines exactly what happens when emergency alert fires, who is responsible | Not a legal doc but critical for liability |

### B2B Agreements

| Document | Purpose | Priority | Status | Action Required | Notes |
|----------|---------|----------|--------|----------------|-------|
| **Master Services Agreement (MSA)** | Template for employer contracts | 🟡 IMPORTANT | ⬜ NOT STARTED | Attorney-drafted template — covers: service scope, data handling, liability, term/termination | Use for all employer clients |
| **Data Processing Agreement (DPA)** | GDPR/CCPA for employer data | 🟡 IMPORTANT | ⬜ NOT STARTED | Attorney-drafted — required by EU/CA employers | Often requested alongside MSA |
| **University Partnership Agreement** | Terms for school partnerships | 🟡 IMPORTANT | ⬜ NOT STARTED | Template covering: student data (FERPA), service hours verification, liability | FERPA compliance required for student data |
| **Nonprofit Partnership MOU** | Memorandum of Understanding for nonprofits | 🟢 GROWTH | ⬜ NOT STARTED | Simple MOU template — covers mutual referrals, data sharing, liability | Lighter than full MSA |
| **Medicare Advantage Contract** | Health plan PMPM agreement | 🟢 GROWTH | ⬜ NOT STARTED | Work with healthcare attorney experienced in MA contracting | 6–18 month negotiation process |

---

## Insurance

| Insurance Type | Purpose | Priority | Status | Action Required | Cost Estimate |
|---------------|---------|----------|--------|----------------|--------------|
| **General Liability** | Basic business liability | 🔴 CRITICAL | ⬜ NOT STARTED | Get quotes from Hiscox, Next Insurance, or a broker | $500–$2,000/year |
| **Professional Liability (E&O)** | Errors and omissions — care advice liability | 🔴 CRITICAL | ⬜ NOT STARTED | Required before launching care navigator service | $1,500–$5,000/year |
| **Cyber Liability** | Data breach coverage | 🟡 IMPORTANT | ⬜ NOT STARTED | Required for any health data — HIPAA breach can be very costly | $2,000–$8,000/year |
| **Directors & Officers (D&O)** | Protects leadership from lawsuits | 🟢 GROWTH | ⬜ NOT STARTED | Required if raising investment | $1,500–$5,000/year |
| **Workers Compensation** | Required if you have employees | 🟡 IMPORTANT | ⬜ NOT STARTED | Required by law once you hire — check state requirements | Varies by state and payroll |

---

## Compliance Certifications

| Certification | Purpose | Priority | Status | How to Get It | Timeline | Cost |
|--------------|---------|----------|--------|--------------|----------|------|
| **HIPAA Compliance Audit** | Verify HIPAA controls before going live | 🔴 CRITICAL | ⬜ NOT STARTED | Hire a HIPAA compliance firm (e.g. Compliancy Group, HIPAA One) | 1–3 months | $2,000–$8,000 |
| **SOC 2 Type I** | Security audit for enterprise sales | 🟡 IMPORTANT | ⬜ NOT STARTED | Hire a SOC 2 auditor (e.g. Laika, Vanta, Secureframe help you prepare) | 3–6 months | $10,000–$30,000 |
| **SOC 2 Type II** | Ongoing security compliance | 🟢 GROWTH | ⬜ NOT STARTED | Follows Type I — requires 6+ months operational history | 6–12 months after Type I | $15,000–$40,000 |
| **ADA/WCAG 2.1 AA** | Accessibility compliance | 🟡 IMPORTANT | 🔄 IN PROGRESS | Built into platform — axe-cli zero violations required | Ongoing | Internal cost |
| **CCPA Compliance** | California Consumer Privacy Act | 🟡 IMPORTANT | ⬜ NOT STARTED | Update privacy policy, add data deletion flow (already built), add cookie consent | 1–2 months | $1,000–$3,000 attorney |
| **GDPR (if EU users)** | EU data privacy | 🟢 GROWTH | ⬜ NOT STARTED | Only if serving EU users — add GDPR consent flows | 2–3 months | $2,000–$5,000 attorney |

---

## State-Specific Requirements

Some states have additional elder care regulations beyond federal HIPAA:

| State | Requirement | Priority | Status | Notes |
|-------|------------|----------|--------|-------|
| **California** | CCPA consumer privacy rights | 🟡 IMPORTANT | ⬜ NOT STARTED | Strong data rights — deletion, portability, opt-out of sale |
| **California** | Elder Abuse and Dependent Adult Civil Protection Act | 🔴 CRITICAL | ⬜ NOT STARTED | Mandated reporter requirements for anyone working with seniors |
| **New York** | SHIELD Act (data security) | 🟡 IMPORTANT | ⬜ NOT STARTED | Stricter data security requirements than federal |
| **Texas** | Texas Medical Privacy Act | 🟡 IMPORTANT | ⬜ NOT STARTED | Additional health data protections |
| **Florida** | Florida Information Protection Act | 🟡 IMPORTANT | ⬜ NOT STARTED | Data breach notification requirements |

*Note: Review elder care regulations for every state you operate in. Requirements vary significantly.*

---

## Mandated Reporter Requirements

**Critical:** Depending on your state and how care navigators are classified, they may be **mandated reporters** under elder abuse laws — legally required to report suspected abuse, neglect, or exploitation of seniors to Adult Protective Services.

| Action | Status | Notes |
|--------|--------|-------|
| Determine if navigators are mandated reporters in operating states | ⬜ NOT STARTED | Consult with attorney — classification varies by state and role |
| Create mandatory reporter training for all navigators | ⬜ NOT STARTED | Required before navigators interact with real seniors |
| Build APS reporting workflow into navigator console | ⬜ NOT STARTED | One-click report to Adult Protective Services |
| Document reporting protocol in operations manual | ⬜ NOT STARTED | Navigator must know exactly what to do and when |

---

## Priority Action Plan

### Do This Week
1. ☐ Register business entity (LLC or C-Corp) with your state
2. ☐ Get EIN from IRS.gov (free, 15 minutes)
3. ☐ Open business bank account
4. ☐ Get General Liability insurance quote

### Do This Month
5. ☐ Request Supabase Pro plan + BAA
6. ☐ Contact Retell AI about HIPAA BAA
7. ☐ Contact Twilio about HIPAA BAA
8. ☐ Contact Anthropic about HIPAA BAA
9. ☐ Hire healthcare attorney for Terms of Service and Volunteer Agreement
10. ☐ File trademark for "ThriveAtHome" with USPTO

### Before First Real User
11. ☐ All 5 vendor BAAs signed
12. ☐ Terms of Service live on platform
13. ☐ Volunteer Agreement signed by first volunteer
14. ☐ Care Navigator Agreement signed
15. ☐ Emergency protocol documented
16. ☐ Professional Liability insurance active
17. ☐ HIPAA Notice of Privacy Practices on platform

### Before First Employer Contract
18. ☐ MSA template ready
19. ☐ DPA template ready
20. ☐ SOC 2 Type I process started
21. ☐ Cyber Liability insurance active

### Before Medicare Advantage Contract
22. ☐ SOC 2 Type II complete
23. ☐ Third-party HIPAA audit complete
24. ☐ All insurance types active
25. ☐ Healthcare attorney experienced in MA contracting engaged

---

## Recommended Attorneys & Services

| Service | What For | Notes |
|---------|---------|-------|
| **Vanta** | SOC 2 preparation automation | vanta.com — automates evidence collection |
| **Laika** | SOC 2 + HIPAA compliance platform | laika.com — good for startups |
| **Compliancy Group** | HIPAA compliance support | compliancygroup.com |
| **Clerky** | Legal document automation for startups | clerky.com — good for formation docs |
| **Stripe Atlas** | Business formation + bank account | stripe.com/atlas — if not yet incorporated |
| **Hiscox** | Small business insurance | hiscox.com — easy online quotes |
| **Next Insurance** | Digital-first small business insurance | nextinsurance.com |

*For healthcare-specific legal counsel, look for attorneys specializing in digital health, telehealth, or health tech startups in your state.*

---

## Incident Response Plan

Before going live, document what happens when things go wrong:

| Incident Type | Response Protocol | Owner | Status |
|--------------|------------------|-------|--------|
| Data breach | Notify affected users within 60 days (HIPAA), 72 hours (GDPR if applicable) | TBD | ⬜ NOT DOCUMENTED |
| Senior emergency during call | Crisis escalation protocol → navigator → 911 | TBD | ⬜ NOT DOCUMENTED |
| Volunteer misconduct | Suspend volunteer, document incident, notify family | TBD | ⬜ NOT DOCUMENTED |
| Payment dispute | Stripe dispute process + customer service protocol | TBD | ⬜ NOT DOCUMENTED |
| Platform outage | Status page, user notification, RTO/RPO targets | TBD | ⬜ NOT DOCUMENTED |

---

*Last updated: June 2026*
*Owner: Monica Mallick*
*Review: Monthly — before any new vendor is added or new state is entered*
*Attorney review required: Before going live with real users*
