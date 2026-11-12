export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: November 2026</p>
        <div className="space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Overview</h2>
            <p>Thrive@Home, Inc. is committed to protecting your privacy and the security of your personal information.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. HIPAA Compliance</h2>
            <p>Thrive@Home operates in compliance with the Health Insurance Portability and Accountability Act (HIPAA) where applicable. We implement administrative, physical, and technical safeguards to protect Protected Health Information (PHI). We do not sell PHI to third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information We Collect</h2>
            <p>We collect account information, health and wellness data you share, usage data, and communication records with navigators and volunteers.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p>We use AES-256 encryption at rest and TLS 1.3 in transit, with role-based access controls and SOC 2 Type II certified facilities.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Contact Us</h2>
            <p>For privacy questions, contact our Privacy Officer at privacy@thrivathome.com.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
