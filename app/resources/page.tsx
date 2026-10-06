import Link from 'next/link'
import { RESOURCE_TOPICS } from '@/lib/content/resources'

export const metadata = {
  title: 'Senior Living Resources | ThriveAtHome',
  description: 'Free guides and resources on caregiving, legal planning, Medicare, retirement, and more.',
}

const TOPIC_ICONS: Record<string, string> = {
  'caregiver-support': '🤝',
  'daily-living': '🏠',
  'home-organization': '📦',
  'in-home-care': '💙',
  'legal-planning': '📋',
  'public-assistance': '🏛️',
  'purpose-fulfillment': '✨',
  'retirement-planning': '💰',
  'senior-fitness': '🏃',
  'home-safety': '🔒',
  'smart-home-tech': '📱',
  'moving-downsizing': '🚚',
}

export default function ResourcesPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Living Resources</h1>
      <p className="text-gray-600 mb-10">Free guides, tools, and expert advice on every aspect of aging well at home.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {RESOURCE_TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/resources/${topic.slug}`}
            className="group border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-teal-300 transition-all"
          >
            <div className="text-3xl mb-3">{TOPIC_ICONS[topic.slug] ?? '📄'}</div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 mb-2">{topic.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-3">{topic.description}</p>
            <div className="mt-4 text-sm font-medium text-teal-600 group-hover:text-teal-800">
              {topic.articleCount} articles →
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
