// app/terms/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | ThriveAtHome',
  description: 'Terms and conditions for using the ThriveAtHome platform.',
}

const EFFECTIVE_DATE = 'November 3, 2026'
const COMPANY = 'ThriveAtHome, Inc.'
const EMAIL = 'legal@thriveathome.com'

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Georgia, serif', color: '#1a1a1a', lineHeight: 1.8 }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#2d6a4f', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>
          ← ThriveAtHome
        </Link>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'system-ui, sans-serif', marginBottom: '8px', color: '#111' }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: '14px', color: '#888', fontFamily: 'system-ui, sans-serif', marginBottom: '40px' }}>
        Effective date: {EFFECTIVE_DATE}
      </p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of the ThriveAtHome platform, website, mobile application, and related services (collectively, the "Services") provided by {COMPANY} ("ThriveAtHome," "we," "our," or "us"). By creating an account or using our Services, you agree to these Terms.
      </p>

      <p>
        If you are using the Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
      </p>

      <Section title="1. Eligibility">
        <p>
          You must be at least 18 years old to create an account and use our Services independently. Our platform is designed primarily for adults 65 and older, though family members and caregivers of any adult age may also access certain features. By using the Services, you represent that you meet these eligibility requirements.
        </p>
        <p>
          Our K-12 Volunteer Program allows minors to participate in certain volunteer activities with verifiable parental or guardian consent and under the supervision of their school or youth organization.
        </p>
      </Section>

      <Section title="2. Account Registration">
        <p>
          To access most features, you must create an account. You agree to:
        </p>
        <ul>
          <li>Provide accurate, complete, and current information during registration.</li>
          <li>Maintain the security of your account credentials.</li>
          <li>Notify us promptly at {EMAIL} if you suspect unauthorized access to your account.</li>
          <li>Not share your account or transfer it to another person without our written consent.</li>
        </ul>
        <p>
          You are responsible for all activity that occurs under your account.
        </p>
      </Section>

      <Section title="3. Services Description">
        <SubSection title="B2C Services (Individual Members)">
          <p>
            ThriveAtHome offers two individual membership tiers:
          </p>
          <ul>
            <li><strong>ThriveAtHome Basics ($39/month or $421/year):</strong> AI wellness companion check-ins, safety monitoring, family portal access, volunteer connections, and community access.</li>
            <li><strong>ThriveAtHome Complete ($79/month or $853/year):</strong> All Basics features plus concierge Care Navigators, premium volunteer matching, family celebrations support, fraud protection, and priority services.</li>
          </ul>
        </SubSection>

        <SubSection title="B2B Services (Organizations)">
          <p>
            Organizations (home care agencies, senior centers, employers, housing communities) may enroll members through an organizational account. B2B pricing, features, and terms are governed by a separate Organization Agreement in addition to these Terms.
          </p>
        </SubSection>

        <SubSection title="AI-Assisted Services">
          <p>
            Our platform uses artificial intelligence, including AI voice agents (Aria, Grace, Quinn, and others), to provide wellness check-ins, reminders, and companionship interactions. You acknowledge that:
          </p>
          <ul>
            <li>AI agents are not licensed medical professionals and do not provide medical advice, diagnosis, or treatment.</li>
            <li>AI interactions are recorded and may be reviewed by our team for quality assurance and safety monitoring.</li>
            <li>AI responses may not always be accurate or appropriate for your specific situation.</li>
            <li>In a medical emergency, you should call 911 or your local emergency services.</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="4. Payments and Subscriptions">
        <SubSection title="Billing">
          <p>
            Subscriptions are billed in advance on a monthly or annual basis. Payment is processed through Stripe. By providing payment information, you authorize us to charge your payment method for all fees.
          </p>
        </SubSection>

        <SubSection title="Free Trial">
          <p>
            We may offer free trials for new members. At the end of the trial period, your subscription will automatically begin and you will be charged unless you cancel before the trial ends.
          </p>
        </SubSection>

        <SubSection title="Cancellation and Refunds">
          <p>
            You may cancel your subscription at any time through your account settings or by contacting us at {EMAIL}. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial subscription periods, except:
          </p>
          <ul>
            <li>Within 14 days of your initial subscription for new members (full refund).</li>
            <li>Where required by applicable law.</li>
            <li>At our discretion for extenuating circumstances.</li>
          </ul>
        </SubSection>

        <SubSection title="Price Changes">
          <p>
            We may change subscription prices with 30 days' advance notice. Price changes take effect at the start of your next billing period after the notice period.
          </p>
        </SubSection>
      </Section>

      <Section title="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Services for any unlawful purpose or in violation of any applicable law.</li>
          <li>Impersonate another person or misrepresent your identity or affiliation.</li>
          <li>Attempt to gain unauthorized access to any part of the Services or our systems.</li>
          <li>Transmit harmful, offensive, or fraudulent content through the platform.</li>
          <li>Use the Services to facilitate elder financial exploitation or abuse.</li>
          <li>Reverse engineer, decompile, or attempt to extract source code from our platform.</li>
          <li>Use automated tools to access or scrape the Services without our permission.</li>
          <li>Interfere with or disrupt the integrity or performance of the Services.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms.
        </p>
      </Section>

      <Section title="6. Volunteer Program">
        <p>
          ThriveAtHome connects seniors with volunteers for companionship, transportation, errands, and other services. Regarding volunteers:
        </p>
        <ul>
          <li>Adult volunteers undergo background checks through our screening partner (Checkr). K-12 volunteers are supervised by their school or organization.</li>
          <li>ThriveAtHome facilitates but does not guarantee the quality, safety, or outcome of volunteer interactions.</li>
          <li>Members and volunteers must treat each other with respect. Abusive or harassing conduct is grounds for removal from the platform.</li>
          <li>ThriveAtHome volunteers are not employees or agents of ThriveAtHome for purposes of their volunteer activities.</li>
        </ul>
      </Section>

      <Section title="7. Care Navigator Services">
        <p>
          Complete plan members have access to Care Navigators — trained human coordinators who assist with care planning and service coordination. Care Navigators:
        </p>
        <ul>
          <li>Provide guidance and coordination, not licensed medical or legal advice.</li>
          <li>May refer you to appropriate professional resources when needed.</li>
          <li>Are available during business hours; emergency situations should be directed to 911.</li>
        </ul>
      </Section>

      <Section title="8. Communications Consent">
        <p>
          By providing your phone number and creating an account, you expressly consent to receive:
        </p>
        <ul>
          <li>Automated telephone calls from AI voice agents for wellness check-ins and reminders.</li>
          <li>SMS text messages for safety alerts, care coordination, and platform notifications.</li>
          <li>Email communications about your account, Services, and wellness resources.</li>
        </ul>
        <p>
          This consent is not a condition of purchase. You may opt out of non-emergency communications at any time. To opt out of SMS, reply STOP to any message. To opt out of calls, update your preferences in account settings or contact us. Standard message and data rates may apply.
        </p>
      </Section>

      <Section title="9. Intellectual Property">
        <p>
          The Services and all content, features, and functionality — including software, text, graphics, logos, and audio — are owned by ThriveAtHome and protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
        </p>
        <p>
          You retain ownership of content you submit to the platform (profile information, messages, etc.) and grant ThriveAtHome a limited license to use that content to provide the Services.
        </p>
      </Section>

      <Section title="10. Privacy">
        <p>
          Our <Link href="/privacy" style={{ color: '#2d6a4f' }}>Privacy Policy</Link> describes how we collect, use, and share your personal information and is incorporated into these Terms by reference. By using our Services, you agree to our Privacy Policy.
        </p>
      </Section>

      <Section title="11. Disclaimer of Warranties">
        <p style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.02em' }}>
          The services are provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. ThriveAtHome does not warrant that the services will be uninterrupted, error-free, or free of harmful components.
        </p>
        <p>
          ThriveAtHome is a wellness and social connection platform. We are not a medical provider, home care agency, or emergency response service. Always contact emergency services (911) for medical emergencies.
        </p>
      </Section>

      <Section title="12. Limitation of Liability">
        <p style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.02em' }}>
          To the maximum extent permitted by law, ThriveAtHome shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, arising from your use of or inability to use the services.
        </p>
        <p>
          Our total liability to you for any claim arising from these Terms or the Services shall not exceed the greater of (a) the amount you paid us in the 12 months preceding the claim, or (b) $100.
        </p>
        <p>
          Some jurisdictions do not allow limitations on implied warranties or liability for certain damages, so the above limitations may not apply to you.
        </p>
      </Section>

      <Section title="13. Indemnification">
        <p>
          You agree to indemnify and hold harmless ThriveAtHome, its officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorneys' fees) arising from your use of the Services, your violation of these Terms, or your violation of any third-party rights.
        </p>
      </Section>

      <Section title="14. Dispute Resolution">
        <SubSection title="Informal Resolution">
          <p>
            Before filing a formal claim, you agree to contact us at {EMAIL} and attempt to resolve the dispute informally for at least 30 days.
          </p>
        </SubSection>

        <SubSection title="Arbitration">
          <p>
            If informal resolution fails, disputes shall be resolved through binding individual arbitration under the American Arbitration Association's Consumer Arbitration Rules, not in court. You waive the right to participate in a class action lawsuit or class-wide arbitration.
          </p>
        </SubSection>

        <SubSection title="Exceptions">
          <p>
            Either party may seek injunctive or other equitable relief in court for intellectual property violations or urgent safety matters. You may also bring claims in small claims court if they qualify.
          </p>
        </SubSection>

        <SubSection title="Governing Law">
          <p>
            These Terms are governed by the laws of the State of California, without regard to its conflict of law provisions.
          </p>
        </SubSection>
      </Section>

      <Section title="15. Termination">
        <p>
          You may terminate your account at any time by contacting us or through your account settings. We may suspend or terminate your access to the Services at any time for any reason, including violation of these Terms, with or without notice.
        </p>
        <p>
          Upon termination, your right to use the Services ends immediately. Sections that by their nature should survive termination (including intellectual property, disclaimers, limitation of liability, and dispute resolution) will survive.
        </p>
      </Section>

      <Section title="16. Changes to These Terms">
        <p>
          We may update these Terms periodically. We will notify you of material changes by email or prominent notice on our platform at least 30 days before changes take effect. Your continued use of the Services after that date constitutes acceptance of the updated Terms.
        </p>
      </Section>

      <Section title="17. Contact Us">
        <p>
          For questions about these Terms:
        </p>
        <p>
          <strong>{COMPANY}</strong><br />
          Email: <strong>{EMAIL}</strong>
        </p>
      </Section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e8e8e8', display: 'flex', gap: '24px', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
        <Link href="/privacy" style={{ color: '#2d6a4f', textDecoration: 'none' }}>Privacy Policy</Link>
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
