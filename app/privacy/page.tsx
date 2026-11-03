// app/privacy/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | ThriveAtHome',
  description: 'How ThriveAtHome collects, uses, and protects your personal information.',
}

const EFFECTIVE_DATE = 'November 3, 2026'
const COMPANY = 'ThriveAtHome, Inc.'
const EMAIL = 'privacy@thriveathome.com'
const ADDRESS = 'San Francisco, CA'

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Georgia, serif', color: '#1a1a1a', lineHeight: 1.8 }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#2d6a4f', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>
          ← ThriveAtHome
        </Link>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'system-ui, sans-serif', marginBottom: '8px', color: '#111' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '14px', color: '#888', fontFamily: 'system-ui, sans-serif', marginBottom: '40px' }}>
        Effective date: {EFFECTIVE_DATE}
      </p>

      <p>
        {COMPANY} ("ThriveAtHome," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website, mobile application, and related services (collectively, the "Services").
      </p>

      <p>
        Please read this Privacy Policy carefully. By using our Services, you agree to the practices described here. If you do not agree, please do not use our Services.
      </p>

      <Section title="1. Information We Collect">
        <SubSection title="Information You Provide">
          <ul>
            <li><strong>Account information:</strong> name, email address, phone number, date of birth, ZIP code, and password when you create an account.</li>
            <li><strong>Profile information:</strong> health preferences, wellness goals, dietary needs, hobbies, and family contacts you choose to share.</li>
            <li><strong>Communications:</strong> messages, notes, and content you send through the platform.</li>
            <li><strong>Payment information:</strong> billing details processed securely through Stripe. We do not store full card numbers.</li>
            <li><strong>Voice and call data:</strong> call recordings and transcripts from AI-assisted wellness calls, with your consent.</li>
          </ul>
        </SubSection>

        <SubSection title="Information Collected Automatically">
          <ul>
            <li><strong>Usage data:</strong> pages visited, features used, actions taken, and time spent on the platform.</li>
            <li><strong>Device data:</strong> IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Log data:</strong> server logs, error reports, and performance data.</li>
          </ul>
        </SubSection>

        <SubSection title="Information from Third Parties">
          <ul>
            <li>Family members or caregivers who invite you or share information about you.</li>
            <li>Partner organizations (home care agencies, senior centers, employers) that provide your contact details for enrollment.</li>
            <li>Service providers who confirm appointment completions or outcomes.</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use your information to:</p>
        <ul>
          <li>Provide, personalize, and improve our Services.</li>
          <li>Connect you with AI wellness companions (Aria, Grace, Quinn, and others).</li>
          <li>Coordinate care services and volunteer matching.</li>
          <li>Send wellness check-ins, reminders, and alerts to you and your designated family members.</li>
          <li>Process payments and manage your subscription.</li>
          <li>Detect and prevent fraud, elder financial exploitation, and safety risks.</li>
          <li>Generate anonymized and aggregated analytics to improve platform outcomes.</li>
          <li>Comply with legal obligations.</li>
          <li>Communicate with you about your account, updates, and new features.</li>
        </ul>
        <p>
          We do not sell your personal information to third parties. We do not use your information for advertising targeting.
        </p>
      </Section>

      <Section title="3. Sensitive Health Information">
        <p>
          ThriveAtHome handles health-related information with heightened care. We treat wellness data, medication information, and care notes as sensitive personal data. This information is:
        </p>
        <ul>
          <li>Encrypted in transit and at rest.</li>
          <li>Accessible only to you, your designated family members, and your assigned Care Navigator.</li>
          <li>Never sold or shared with advertisers or data brokers.</li>
          <li>Shared with partner healthcare providers only with your explicit consent.</li>
        </ul>
        <p>
          ThriveAtHome is designed to be HIPAA-compliant for applicable data. We maintain Business Associate Agreements (BAAs) with key service providers.
        </p>
      </Section>

      <Section title="4. How We Share Your Information">
        <p>We share your information only in these circumstances:</p>
        <ul>
          <li><strong>With your consent:</strong> when you explicitly authorize sharing, such as inviting family members or authorizing a care provider.</li>
          <li><strong>Service providers:</strong> vendors who help us operate the platform (Supabase for database, Stripe for payments, SendGrid for email, Twilio for SMS, Retell AI for voice, Vercel for hosting). All are bound by data processing agreements.</li>
          <li><strong>Your organization:</strong> if you're enrolled through an employer, senior center, or care agency, your organization's administrator may see your enrollment status and aggregate wellness indicators, but not personal health notes or call transcripts.</li>
          <li><strong>Safety exceptions:</strong> if we believe disclosure is necessary to prevent imminent harm to you or others, we may share information with emergency services.</li>
          <li><strong>Legal requirements:</strong> when required by law, court order, or government authority.</li>
          <li><strong>Business transfer:</strong> in the event of a merger, acquisition, or sale of assets, your information may be transferred. We will notify you in advance.</li>
        </ul>
      </Section>

      <Section title="5. Communications and SMS Consent">
        <p>
          By providing your phone number and using our Services, you consent to receive:
        </p>
        <ul>
          <li>Wellness check-in calls and reminders via AI voice agents.</li>
          <li>SMS alerts for safety events, care coordination, and family notifications.</li>
          <li>Transactional SMS messages about your account and services.</li>
        </ul>
        <p>
          You may opt out of non-emergency SMS at any time by replying STOP to any message or updating your preferences in your account settings. Message and data rates may apply. Our SMS service operates through Twilio (10DLC registered).
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>We retain your personal information for as long as your account is active or as needed to provide Services. Specifically:</p>
        <ul>
          <li><strong>Account data:</strong> retained while your account is active and for 7 years after closure for legal and audit purposes.</li>
          <li><strong>Call recordings and transcripts:</strong> retained for 2 years, then deleted unless required for care continuity or legal purposes.</li>
          <li><strong>Payment records:</strong> retained for 7 years per financial recordkeeping requirements.</li>
          <li><strong>Aggregated analytics:</strong> may be retained indefinitely in de-identified form.</li>
        </ul>
        <p>You may request deletion of your personal data at any time (see Your Rights below). Some data may be retained if required by law.</p>
      </Section>

      <Section title="7. Your Rights and Choices">
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li><strong>Access:</strong> request a copy of the personal information we hold about you.</li>
          <li><strong>Correction:</strong> update or correct inaccurate information.</li>
          <li><strong>Deletion:</strong> request deletion of your personal data ("right to be forgotten").</li>
          <li><strong>Portability:</strong> receive your data in a machine-readable format.</li>
          <li><strong>Opt-out:</strong> withdraw consent for non-essential communications or data processing.</li>
          <li><strong>Restriction:</strong> request that we limit how we process your data.</li>
        </ul>
        <p>
          To exercise these rights, contact us at <strong>{EMAIL}</strong>. We will respond within 30 days.
        </p>
        <p>
          California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to opt out of sale (we do not sell data), and the right to non-discrimination.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul>
          <li>TLS encryption for all data in transit.</li>
          <li>AES-256 encryption for sensitive data at rest.</li>
          <li>Role-based access controls limiting staff access to personal data.</li>
          <li>Regular security reviews and penetration testing.</li>
          <li>Multi-factor authentication for administrative access.</li>
        </ul>
        <p>
          No system is perfectly secure. If you believe your account has been compromised, contact us immediately at {EMAIL}.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          Our Services are designed for adults 18 and older. We do not knowingly collect personal information from children under 13. Our K-12 volunteer program complies with COPPA and requires verifiable parental consent for minors. If you believe a child has provided us personal information, contact us at {EMAIL}.
        </p>
      </Section>

      <Section title="10. Third-Party Links and Services">
        <p>
          Our platform may link to third-party services (Lyft, Meals on Wheels, etc.). This Privacy Policy does not cover those services. We encourage you to review their privacy policies before sharing information with them.
        </p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. We will notify you of material changes by email or prominent notice on our platform at least 30 days before changes take effect. Your continued use of the Services after that date constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="12. Contact Us">
        <p>
          For privacy questions, requests, or concerns:
        </p>
        <p>
          <strong>{COMPANY}</strong><br />
          {ADDRESS}<br />
          Email: <strong>{EMAIL}</strong>
        </p>
        <p>
          For urgent security concerns, please mark your email subject line: <strong>URGENT: Security</strong>
        </p>
      </Section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e8e8e8', display: 'flex', gap: '24px', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
        <Link href="/terms" style={{ color: '#2d6a4f', textDecoration: 'none' }}>Terms of Service</Link>
        <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Home</Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'system-ui, sans-serif', color: '#111', marginBottom: '12px', marginTop: '36px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'system-ui, sans-serif', color: '#333', marginBottom: '8px' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
