import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RESOURCE_TOPICS } from '@/lib/content/resources'

export function generateStaticParams() {
  return RESOURCE_TOPICS.map((t: any) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const topic = RESOURCE_TOPICS.find((t: any) => t.slug === params.slug)
  if (!topic) return {}
  return { title: `${topic.title} | ThriveAtHome Resources`, description: topic.description }
}

export default function ResourceTopicPage({ params }: { params: { slug: string } }) {
  const topic = RESOURCE_TOPICS.find((t: any) => t.slug === params.slug)
  if (!topic) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/resources" className="text-sm text-teal-600 hover:text-teal-800 mb-6 inline-block">← All Resources</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{topic.title}</h1>
      <p className="text-gray-600 mb-10">{topic.description}</p>

      {topic.subtopics && topic.subtopics.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Browse Topics</h2>
          <div className="flex flex-wrap gap-2">
            {topic.subtopics.map((sub: any) => (
              <span key={sub} className="bg-teal-50 text-teal-700 text-sm px-3 py-1 rounded-full">{sub}</span>
            ))}
          </div>
        </section>
      )}

      <section className="bg-teal-50 rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold text-teal-900 mb-2">Get Personalized Help</h2>
        <p className="text-teal-800 text-sm mb-4">
          Our Care Navigators can help you find local resources and build a plan tailored to your situation.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Talk to a Navigator
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Related Articles</h2>
        <div className="space-y-3">
          {Array.from({ length: topic.articleCount }).map((_: any, i: number) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 text-gray-400 text-sm italic">
              Article coming soon
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
