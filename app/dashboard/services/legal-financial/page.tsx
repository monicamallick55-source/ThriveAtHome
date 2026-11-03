import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function LegalFinancialPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>

      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Disclaimer:</strong> ThriveAtHome connects you with advisors and resources.
        We do not provide legal or financial advice. Consult a licensed professional for specific guidance.
      </div>

      <ServiceBookingForm
        serviceType="legal_financial"
        title="⚖️ Legal & Financial Help"
        description="Get connected with benefits counselors, elder law resources, financial guidance, and legal aid programs."
        fields={[
          {
            name: 'topic',
            label: 'What Do You Need Help With?',
            type: 'select',
            required: true,
            options: [
              'Medicare / Medicaid benefits',
              'Social Security questions',
              'Veterans benefits (VA)',
              'Supplemental benefits (SNAP, HEAP, etc.)',
              'Advance directive / living will',
              'Power of attorney',
              'Estate planning questions',
              'Elder law referral',
              'Consumer fraud / scam help',
              'Housing / tenant rights',
              'Debt or financial hardship',
              'Tax help for seniors',
              'Other',
            ],
          },
          {
            name: 'urgency',
            label: 'How Urgent Is This?',
            type: 'select',
            options: ['Not urgent — general information', 'Somewhat urgent — within a few weeks', 'Urgent — within a few days', 'Very urgent — today or tomorrow'],
          },
          {
            name: 'details',
            label: 'Please Describe Your Situation',
            type: 'textarea',
            placeholder: 'Share any details to help us connect you with the right resource…',
            required: true,
          },
        ]}
      />
    </div>
  )
}
