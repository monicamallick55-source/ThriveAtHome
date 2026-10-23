import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/content/resources'
import type { Metadata } from 'next'
interface Props { params: { slug: string } }
export async function generateStaticParams() { return BLOG_POSTS.map(p => ({ slug: p.slug })) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = BLOG_POSTS.find(p => p.slug === params.slug)
  if (!post) return { title: 'Post Not Found' }
  return { title: `${post.title} — ThriveAtHome`, description: post.excerpt }
}
export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find(p => p.slug === params.slug)
  if (!post) notFound()
  const related = BLOG_POSTS.filter(p => p.slug !== post.slug && p.category === post.category).slice(0, 3)
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-gray-400 text-[13px] mb-6"><Link href="/blog" className="hover:text-teal-600">← Blog</Link></div>
        <span className="inline-block bg-teal-100 text-teal-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1e3a5f] leading-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-gray-400 text-[13px] mb-6 pb-6 border-b border-gray-200">
          <span>{post.author}</span><span>·</span><span>{post.date}</span><span>·</span><span>{post.readTime} min read</span>
        </div>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">{post.excerpt}</p>
        <article className="prose prose-lg max-w-none prose-headings:text-[#1e3a5f] prose-a:text-teal-600"
          dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mt-12 bg-[#1e3a5f] rounded-2xl p-7 text-white">
          <h3 className="text-xl font-bold mb-2">Get personalised guidance for your family</h3>
          <p className="text-white/75 text-[14px] mb-5">ThriveAtHome navigators help seniors stay independent at home.</p>
          <Link href="/signup" className="inline-block bg-[#0d9488] text-white font-semibold px-5 py-2.5 rounded-lg text-[14px]">Get started free →</Link>
        </div>
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Related articles</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-400 group">
                  <span className="text-[11px] text-teal-600 font-bold uppercase">{p.category}</span>
                  <h4 className="font-semibold text-gray-900 text-[14px] mt-1 group-hover:text-teal-700 leading-snug">{p.title}</h4>
                  <span className="text-teal-600 text-[13px] mt-2 inline-block">Read →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
