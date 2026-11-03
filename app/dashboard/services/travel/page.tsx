import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function TravelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="travel_assistance"
        title="✈️ Travel Assistance"
        description="Get help planning a trip, finding a travel companion, or coordinating travel logistics."
        fields={[
          {
            name: 'subtype',
            label: 'Type of Travel Help',
            type: 'select',
            required: true,
            options: ['Travel planning & booking help', 'Travel companion (someone to travel with)', 'Airport escort or assistance', 'Road trip coordination', 'Other travel question'],
          },
          {
            name: 'destination',
            label: 'Where Are You Going?',
            type: 'text',
            placeholder: 'e.g., Phoenix, AZ or visiting family in Chicago',
          },
          {
            name: 'travel_dates',
            label: 'Approximate Travel Dates',
            type: 'text',
            placeholder: 'e.g., December 20–27',
          },
          {
            name: 'details',
            label: 'Tell Us More About Your Trip',
            type: 'textarea',
            placeholder: 'Any special needs, mobility considerations, or what you\'d like help with…',
            required: true,
          },
        ]}
      />
    </div>
  )
}
