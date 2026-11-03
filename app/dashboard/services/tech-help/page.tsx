import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function TechHelpPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="tech_help"
        title="💻 Tech Help"
        description="Get help with your phone, tablet, computer, smart TV, or any technology. Our trained volunteers are patient and happy to help."
        fields={[
          {
            name: 'subtype',
            label: 'What Do You Need Help With?',
            type: 'select',
            required: true,
            options: [
              'Smartphone help (calls, texts, apps)',
              'Tablet / iPad setup',
              'Computer / laptop help',
              'Smart TV or streaming (Netflix, etc.)',
              'Video calling (FaceTime, Zoom)',
              'Email setup or help',
              'Internet / Wi-Fi issues',
              'Scam or fraud concern',
              'Password or account access',
              'Photo organizing',
              'Printer setup',
              'Other device or question',
            ],
          },
          {
            name: 'device_type',
            label: 'What Device Are You Using?',
            type: 'text',
            placeholder: 'e.g., iPhone 12, Samsung Galaxy, HP laptop, iPad…',
          },
          {
            name: 'help_format',
            label: 'How Would You Like Help?',
            type: 'select',
            options: ['Phone call walkthrough', 'Video call (Zoom / FaceTime)', 'In-person visit', 'Either is fine'],
          },
          {
            name: 'description',
            label: 'Describe What\'s Happening',
            type: 'textarea',
            placeholder: 'What are you trying to do, or what problem are you having?',
            required: true,
          },
        ]}
      />
    </div>
  )
}
