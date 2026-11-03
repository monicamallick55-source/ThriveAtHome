import ServiceBookingForm from '../_components/ServiceBookingForm'
import Link from 'next/link'

export default function MealsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Services
      </Link>
      <ServiceBookingForm
        serviceType="meals"
        title="🍽️ Meals & Nutrition"
        description="Request meal delivery, cooking assistance, or connect with nutrition programs in your area."
        fields={[
          {
            name: 'subtype',
            label: 'What Do You Need?',
            type: 'select',
            required: true,
            options: ['Meal delivery (home delivered meals)', 'Grocery shopping assistance', 'Cooking help at home', 'Nutrition counseling', 'Other food support'],
          },
          {
            name: 'dietary_restrictions',
            label: 'Dietary Restrictions or Preferences',
            type: 'text',
            placeholder: 'e.g., diabetic-friendly, low sodium, vegetarian, kosher, halal…',
          },
          {
            name: 'frequency',
            label: 'How Often?',
            type: 'select',
            options: ['One-time', 'Daily', 'A few times a week', 'Weekly', 'Monthly'],
          },
          {
            name: 'details',
            label: 'Additional Details',
            type: 'textarea',
            placeholder: 'Any other information that would help us serve you better…',
          },
        ]}
      />
    </div>
  )
}
