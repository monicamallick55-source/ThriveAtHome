import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function TransportPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="transport"
        title="🚗 Transportation"
        description="Request a ride to medical appointments, errands, or outings. We'll coordinate with vetted drivers and transport services."
        fields={[
          {
            name: 'trip_type',
            label: 'Trip Type',
            type: 'select',
            required: true,
            options: ['one_way', 'round_trip'],
          },
          {
            name: 'pickup',
            label: 'Pickup Address',
            type: 'text',
            placeholder: '123 Main St, City, State',
            required: true,
          },
          {
            name: 'destination',
            label: 'Destination Address',
            type: 'text',
            placeholder: '456 Oak Ave, City, State',
            required: true,
          },
          {
            name: 'purpose',
            label: 'Purpose of Trip',
            type: 'select',
            options: ['Medical appointment', 'Pharmacy', 'Grocery shopping', 'Social / recreation', 'Other errand'],
          },
          {
            name: 'mobility_needs',
            label: 'Mobility or Accessibility Needs',
            type: 'text',
            placeholder: 'e.g., uses walker, needs wheelchair-accessible vehicle…',
          },
          {
            name: 'is_recurring',
            label: 'Is This a Recurring Trip?',
            type: 'select',
            options: ['No, one-time', 'Yes, weekly', 'Yes, monthly'],
          },
        ]}
      />
    </div>
  )
}
