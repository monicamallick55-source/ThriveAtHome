export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 32 }}>Last updated: November 2026</p>
      <p>Thrive@Home, Inc. (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the Thrive@Home platform. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
      <h2 style={{ marginTop: 32, fontSize: '1.2rem', fontWeight: 600 }}>HIPAA Notice</h2>
      <p>We handle health-related information in compliance with the Health Insurance Portability and Accountability Act (HIPAA). Your health data is encrypted at rest and in transit and is never sold to third parties.</p>
      <h2 style={{ marginTop: 32, fontSize: '1.2rem', fontWeight: 600 }}>Data We Collect</h2>
      <ul style={{ lineHeight: 2 }}>
        <li>Account registration information (name, email, phone)</li>
        <li>Health and wellness data you choose to share</li>
        <li>Usage data and platform interactions</li>
        <li>Communications with Aria and care team members</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.2rem', fontWeight: 600 }}>Your Rights</h2>
      <p>You may request access, correction, or deletion of your personal data at any time by contacting <a href="mailto:privacy@thrivathome.com">privacy@thrivathome.com</a>.</p>
      <h2 style={{ marginTop: 32, fontSize: '1.2rem', fontWeight: 600 }}>Contact</h2>
      <p>Thrive@Home, Inc. · privacy@thrivathome.com</p>
    </main>
  )
}
