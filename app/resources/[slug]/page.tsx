import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RESOURCE_TOPICS, BLOG_POSTS } from '@/lib/content/resources'

// Map resource topic slugs to relevant blog post slugs
const TOPIC_TO_POSTS: Record<string, string[]> = {
  'home-safety': ['fall-prevention-at-home'],
  'retirement-planning': ['medicare-enrollment-guide-2026'],
  'family-caregiving': ['having-the-conversation-aging-parents'],
}

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

  // Find blog posts relevant to this topic
  const relatedPostSlugs = TOPIC_TO_POSTS[params.slug] ?? []
  const relatedPosts = relatedPostSlugs
    .map((slug: string) => BLOG_POSTS.find((p: any) => p.slug === slug))
    .filter(Boolean)

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

      {relatedPosts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Related Articles</h2>
          <div className="space-y-3">
            {relatedPosts.map((post: any) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="flex items-start gap-4 border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-sm transition-all group"
              >
                <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-1 rounded-full capitalize whitespace-nowrap mt-0.5">
                  {post.category.replace(/-/g, ' ')}
                </span>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-teal-700 leading-snug">{post.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{post.readTimeMinutes} min read · {post.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
