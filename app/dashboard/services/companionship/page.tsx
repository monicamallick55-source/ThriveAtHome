import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function CompanionshipPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="companionship"
        title="🤝 Companion Visits"
        description="Request a friendly visit, phone chat, or activity companion. Our trained volunteers enjoy good conversation and spending time together."
        fields={[
          {
            name: 'visit_type',
            label: 'Type of Visit',
            type: 'select',
            required: true,
            options: ['Phone or video chat', 'In-person visit at home', 'Outing together (walk, café, etc.)', 'Activity companion (cards, puzzles, reading)', 'Holiday / special occasion visit'],
          },
          {
            name: 'interests',
            label: 'Your Interests or Topics You Enjoy',
            type: 'text',
            placeholder: 'e.g., gardening, history, music, sports, faith, crafts…',
          },
          {
            name: 'frequency',
            label: 'How Often?',
            type: 'select',
            options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'],
          },
          {
            name: 'companion_preference',
            label: 'Any Companion Preferences?',
            type: 'textarea',
            placeholder: 'e.g., same language, veteran, female volunteer, dog-friendly…',
          },
        ]}
      />
    </div>
  )
}
