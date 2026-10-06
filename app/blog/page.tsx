import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/content/resources'

export const metadata = {
  title: 'Senior Living Blog | ThriveAtHome',
  description: 'Expert guidance on aging in place, Medicare, fall prevention, and senior independence.',
}

export default function BlogPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Living Blog</h1>
      <p className="text-gray-600 mb-10">Expert guidance to help you age safely and independently at home.</p>
      <div className="space-y-8">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-1 rounded-full capitalize">
                {post.category.replace('-', ' ')}
              </span>
              <span className="text-xs text-gray-400">{post.readTimeMinutes} min read</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-teal-600 transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                By <span className="font-medium">{post.author}</span> · {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <Link href={`/blog/${post.slug}`} className="text-sm font-medium text-teal-600 hover:text-teal-800">
                Read more →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
