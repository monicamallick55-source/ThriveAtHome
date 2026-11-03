import Link from 'next/link'

const services = [
  { href: '/dashboard/services/transport', icon: '🚗', title: 'Transportation', desc: 'Rides to appointments, errands & outings' },
  { href: '/dashboard/services/meals', icon: '🍽️', title: 'Meals & Nutrition', desc: 'Meal delivery, prep help & nutrition guidance' },
  { href: '/dashboard/services/home', icon: '🏠', title: 'Home Services', desc: 'Cleaning, maintenance & home support' },
  { href: '/dashboard/services/health', icon: '🩺', title: 'Health & Wellness', desc: 'Telehealth, medication help & wellness checks' },
  { href: '/dashboard/services/legal-financial', icon: '⚖️', title: 'Legal & Financial', desc: 'Benefits, planning & elder law resources' },
  { href: '/dashboard/services/tech-help', icon: '💻', title: 'Tech Help', desc: 'Phone, tablet, computer & device support' },
  { href: '/dashboard/services/companionship', icon: '🤝', title: 'Companion Visits', desc: 'Friendly visits, chats & activity companions' },
  { href: '/dashboard/services/travel', icon: '✈️', title: 'Travel Assistance', desc: 'Trip planning, companions & travel logistics' },
]

export default function ServicesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
      <p className="text-gray-600 mb-8">
        Request support across a range of services — all coordinated by your ThriveAtHome team.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition group"
          >
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition">{s.title}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
