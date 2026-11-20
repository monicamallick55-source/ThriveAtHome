import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BLOG_POSTS } from '@/lib/content/resources'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post: any) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = BLOG_POSTS.find((p: any) => p.slug === params.slug)
  if (!post) return {}
  return {
    title: `${post.title} | ThriveAtHome Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  }
}

// Render markdown-style headings and paragraphs as HTML
function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={key++} className="font-semibold text-gray-800 mt-4 mb-1">
          {line.slice(2, -2)}
        </p>
      )
    } else {
      elements.push(
        <p key={key++} className="text-gray-700 leading-relaxed mb-4">
          {line}
        </p>
      )
    }
  }

  return elements
}

export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find((p: any) => p.slug === params.slug)
  if (!post) notFound()

  const relatedPosts = BLOG_POSTS.filter((p: any) => p.slug !== post.slug).slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-teal-700">ThriveAtHome</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-gray-600 hover:text-teal-700">← All Articles</Link>
            <Link href="/signup" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium">
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/blog" className="hover:text-teal-600">Blog</Link>
          <span>›</span>
          <span className="capitalize">{post.category.replace('-', ' ')}</span>
        </nav>

        {/* Category + read time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium bg-teal-50 text-teal-700 px-3 py-1 rounded-full capitalize">
            {post.category.replace(/-/g, ' ')}
          </span>
          <span className="text-sm text-gray-400">{post.readTimeMinutes} min read</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
          <span>By <span className="font-medium text-gray-700">{post.author}</span></span>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </time>
        </div>

        {/* Excerpt / lead */}
        <p className="text-lg text-gray-600 leading-relaxed mb-8 font-medium">
          {post.excerpt}
        </p>

        {/* Article body */}
        <article className="prose-content">
          {renderContent(post.content)}
        </article>

        {/* CTA banner */}
        <div className="mt-12 bg-teal-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Want personalised support?</h2>
          <p className="text-teal-100 mb-6 leading-relaxed">
            ThriveAtHome gives you a daily AI companion call, a real human buddy, and a Care Navigator who handles the hard stuff — so you can age at home on your own terms.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors"
          >
            Start free today →
          </Link>
        </div>

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">More Articles</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-teal-300 transition-all bg-white"
                >
                  <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-1 rounded-full capitalize mb-3 inline-block">
                    {related.category.replace(/-/g, ' ')}
                  </span>
                  <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 leading-snug mb-2">
                    {related.title}
                  </h3>
                  <p className="text-sm text-gray-500">{related.readTimeMinutes} min read</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600 mx-3">Privacy</Link>
        <Link href="/terms" className="hover:text-gray-600 mx-3">Terms</Link>
        <Link href="/contact" className="hover:text-gray-600 mx-3">Contact</Link>
        <p className="mt-3">© 2026 ThriveAtHome. All rights reserved.</p>
      </footer>
    </div>
  )
}
