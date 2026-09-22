import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — ThriveAtHome',
  description: 'The terms governing use of the ThriveAtHome platform, subscriptions, and AI check-in calls.',
}

export default function TermsPage() {
  const lastUpdated = 'May 23, 2026'
  const contactEmail = 'legal@thriveathome.com'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--color-warm-grey)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          color: 'var(--color-navy)',
          textDecoration: 'none',
          fontWeight: 500,
        }}>
          ThriveAtHome
        </Link>
        <Link href="/" style={{
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          fontWeight: 500,
          color: 'var(--color-navy)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          ← Back to home
        </Link>
      </nav>

      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 32px 96px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '48px',
          fontWeight: 500,
          color: 'var(--color-navy)',
          marginBottom: '8px',
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
        }}>
          Terms of Service
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          color: 'var(--color-text-muted)',
          marginBottom: '48px',
        }}>
          Last updated: {lastUpdated}
        </p>

        <Section title="Agreement to Terms">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of ThriveAtHome, Inc.&apos;s
            (&quot;ThriveAtHome,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) platform, including our website, phone check-in
            services, family dashboard, and related services (collectively, the &quot;Service&quot;). By creating an
            account, enrolling a senior loved one, or using the Service in any way, you agree to be bound by
            these Terms. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="Who May Use ThriveAtHome">
          <p>
            You must be at least 18 years old to create a ThriveAtHome account. If you are enrolling a senior
            loved one, you represent that you have the authority to do so — as a family member, legal
            representative, or with the senior&apos;s own informed consent. Seniors may also create their own
            direct account.
          </p>
        </Section>

        <Section title="Subscription Plans and Billing">
          <p>ThriveAtHome offers several subscription tiers (Basics, Connect, Complete, Premier), each with different features and monthly pricing as described on our pricing page.</p>
          <ul style={{ marginTop: '12px' }}>
            <li>Subscriptions are billed monthly in advance via our payment processor (Stripe).</li>
            <li>Prices are subject to change with at least 30 days&apos; notice by email before your next billing cycle.</li>
            <li>Optional add-ons are billed separately and may be added or removed at any time; one-time purchases are billed once at checkout.</li>
            <li>Failed payments may result in a temporary pause of check-in calls until payment is resolved; we will notify you by email before any pause.</li>
          </ul>
        </Section>

        <Section title="Cancellation Policy">
          <p>You may cancel your subscription at any time from your account&apos;s billing page or by contacting us.</p>
          <ul style={{ marginTop: '12px' }}>
            <li>Cancellation takes effect at the end of your current billing period — you will not be charged again, and the Service continues until that period ends.</li>
            <li>We do not offer partial-month refunds for early cancellation, except where required by law.</li>
            <li>Upon cancellation, daily check-in calls stop and family dashboard access ends at the end of the paid period. You may request full data deletion at any time, as described in our Privacy Policy.</li>
            <li>You may reactivate your subscription at any time; your senior&apos;s profile data is retained for 90 days after cancellation to make reactivation seamless, then handled per our data retention policy.</li>
          </ul>
        </Section>

        <Section title="AI Check-In Calls — Consent and Limitations">
          <p>
            A core part of the Service is a daily (or scheduled) phone call placed by our AI voice companion
            (&quot;Aria&quot; and related agents) to the enrolled senior. By enrolling a senior in the Service, you and
            the senior consent to:
          </p>
          <ul style={{ marginTop: '12px' }}>
            <li>Receiving automated AI-generated phone calls at the scheduled time and frequency you select.</li>
            <li>The call being recorded, transcribed, and analyzed by AI to generate wellness scores, summaries, and alerts, as described in our Privacy Policy.</li>
            <li>Aria&apos;s daily companion calls are opt-in and may be turned off at any time from the member portal — enrollment in the Service does not require them.</li>
          </ul>
          <p style={{ marginTop: '16px' }}>
            <strong>Important limitation:</strong> ThriveAtHome&apos;s AI check-in calls, crisis-language detection,
            and alerts are a wellness monitoring aid — they are <strong>not</strong> a medical device, a substitute
            for professional medical care, and not a guaranteed emergency response system. Call attempts can
            fail due to technical issues, and AI detection of a crisis is not perfect. If you or your senior
            has a medical emergency, always call 911 (or your local emergency number) directly — do not rely
            on ThriveAtHome as a primary emergency response method.
          </p>
        </Section>

        <Section title="Family Dashboard Access and Consent">
          <p>
            When a senior is enrolled, designated family members are granted access to a shared dashboard
            showing call summaries, wellness scores, and alerts about that senior. By enrolling in the Service,
            the senior (or their authorized representative) consents to this information being shared with the
            family members added to their account. Seniors or their representatives may request that a family
            member&apos;s access be removed at any time by contacting us or the assigned care navigator.
          </p>
        </Section>

        <Section title="Acceptable Use">
          <p>You agree not to:</p>
          <ul style={{ marginTop: '12px' }}>
            <li>Use the Service for any unlawful purpose or to violate any person&apos;s rights.</li>
            <li>Attempt to access another family&apos;s account or data without authorization.</li>
            <li>Interfere with, disrupt, or attempt to reverse-engineer the Service.</li>
            <li>Enroll a senior without appropriate authority or informed consent.</li>
            <li>Use the Service as a substitute for necessary emergency medical services.</li>
          </ul>
        </Section>

        <Section title="Volunteers and Care Navigators">
          <p>
            Volunteers and care navigators who use the Service to coordinate with seniors are subject to
            additional program-specific terms provided during onboarding, including background check
            requirements and confidentiality obligations regarding any senior information they access.
          </p>
        </Section>

        <Section title="Intellectual Property">
          <p>
            The Service, including its software, design, and content (excluding content you submit), is owned
            by ThriveAtHome and protected by intellectual property laws. We grant you a limited,
            non-transferable license to use the Service for its intended personal or family care-coordination
            purpose. You retain ownership of any content you submit (e.g., life-story entries, documents), and
            grant us a license to store and process it to provide the Service.
          </p>
        </Section>

        <Section title="Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT
            AI-GENERATED SUMMARIES, SCORES, OR ALERTS WILL BE ACCURATE OR COMPLETE IN EVERY CASE.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THRIVEATHOME AND ITS OFFICERS, EMPLOYEES, AND SERVICE
            PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, OR ANY LOSS OF LIFE, HEALTH, OR SAFETY, ARISING FROM OR RELATED TO YOUR USE OF (OR
            INABILITY TO USE) THE SERVICE, INCLUDING A MISSED, DELAYED, OR FAILED CHECK-IN CALL OR ALERT. OUR
            TOTAL AGGREGATE LIABILITY FOR ANY CLAIM ARISING FROM THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU
            PAID US IN THE 12 MONTHS PRECEDING THE CLAIM. NOTHING IN THESE TERMS LIMITS LIABILITY THAT CANNOT
            BE LIMITED UNDER APPLICABLE LAW, INCLUDING LIABILITY FOR GROSS NEGLIGENCE OR WILLFUL MISCONDUCT.
          </p>
        </Section>

        <Section title="Indemnification">
          <p>
            You agree to indemnify and hold ThriveAtHome harmless from any claims, damages, or expenses
            (including reasonable attorneys&apos; fees) arising from your violation of these Terms or your misuse
            of the Service, except to the extent caused by our own negligence or misconduct.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            We may suspend or terminate your access to the Service if you violate these Terms, engage in
            fraudulent or harmful activity, or if required by law. We will make reasonable efforts to notify
            you before termination except where immediate action is necessary to protect the Service or its
            users.
          </p>
        </Section>

        <Section title="Governing Law and Disputes">
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict-of-law
            principles. Any dispute arising from these Terms or the Service shall be resolved in the state or
            federal courts located in California, and you consent to the personal jurisdiction of those courts.
          </p>
        </Section>

        <Section title="Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes by posting the
            updated Terms on this page and, for significant changes, by email. Your continued use of the
            Service after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>Questions about these Terms:</p>
          <div style={{
            marginTop: '16px',
            padding: '24px',
            backgroundColor: 'white',
            border: '1px solid var(--color-warm-grey)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <p><strong>ThriveAtHome, Inc. — Legal Team</strong></p>
            <p>
              Email:{' '}
              <a href={`mailto:${contactEmail}`} style={{ color: 'var(--color-teal)' }}>{contactEmail}</a>
            </p>
          </div>
        </Section>

        <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--color-warm-grey)' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            textDecoration: 'none',
            border: '1.5px solid var(--color-navy)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 24px',
            minHeight: '48px',
            transition: 'all 0.2s',
          }}>
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '28px',
        fontWeight: 500,
        color: 'var(--color-navy)',
        marginBottom: '16px',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h2>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '18px',
        color: 'var(--color-text-primary)',
        lineHeight: 1.7,
      }}>
        {children}
      </div>
    </section>
  )
}
