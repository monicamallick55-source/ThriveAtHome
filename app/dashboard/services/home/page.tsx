import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function HomeServicesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="home_service"
        title="🏠 Home Services"
        description="Request help with cleaning, maintenance, yard work, or other home tasks. We'll connect you with trusted providers."
        fields={[
          {
            name: 'subtype',
            label: 'Type of Help Needed',
            type: 'select',
            required: true,
            options: [
              'Light housekeeping / cleaning',
              'Laundry assistance',
              'Yard work / lawn care',
              'Minor home repair',
              'Home safety assessment',
              'Moving or rearranging furniture',
              'Decluttering / organizing',
              'Other home task',
            ],
          },
          {
            name: 'frequency',
            label: 'How Often?',
            type: 'select',
            options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'],
          },
          {
            name: 'details',
            label: 'Describe What You Need',
            type: 'textarea',
            required: true,
            placeholder: 'Please describe the task, any special considerations, or areas of focus…',
          },
        ]}
      />
    </div>
  )
}
