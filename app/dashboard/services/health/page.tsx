import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function HealthPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="telehealth"
        title="🩺 Health & Wellness"
        description="Connect with telehealth providers, get help managing medications, schedule wellness check-ins, or access health resources."
        fields={[
          {
            name: 'subtype',
            label: 'Type of Health Support',
            type: 'select',
            required: true,
            options: [
              'Telehealth visit (virtual doctor)',
              'Medication reminders & management',
              'Wellness check-in call',
              'Mental health / counseling',
              'Physical therapy referral',
              'Vision or hearing help',
              'Chronic condition management',
              'Preventive care / screenings',
              'Other health question',
            ],
          },
          {
            name: 'insurance',
            label: 'Insurance (if applicable)',
            type: 'text',
            placeholder: 'e.g., Medicare Part B, Humana, AARP…',
          },
          {
            name: 'details',
            label: 'Tell Us More',
            type: 'textarea',
            required: true,
            placeholder: 'What are your symptoms, questions, or health goals?',
          },
        ]}
      />
    </div>
  )
}
