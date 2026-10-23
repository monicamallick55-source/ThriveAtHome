import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CHECKLISTS } from '@/lib/content/checklists'

export async function generateStaticParams() {
  return CHECKLISTS.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const checklist = CHECKLISTS.find(c => c.slug === slug)
  if (!checklist) return {}
  return {
    title: `${checklist.title} | ThriveAtHome`,
    description: checklist.description,
  }
}

export default async function ChecklistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const checklist = CHECKLISTS.find(c => c.slug === slug)
  if (!checklist) notFound()

  const related = CHECKLISTS.filter(c => c.categorySlug === checklist.categorySlug && c.slug !== checklist.slug).slice(0, 3)

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
          <Link href="/checklists" className="hover:text-[var(--color-teal)]">Checklists</Link>
          <span>›</span>
          <span className="text-gray-700">{checklist.category}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{checklist.icon}</span>
            <span className="text-sm font-medium text-[var(--color-teal)] bg-teal-50 px-3 py-1 rounded-full">
              {checklist.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-navy)] mt-4 mb-3">{checklist.title}</h1>
          <p className="text-gray-600 text-lg mb-4">{checklist.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>✓ {checklist.items.length} items</span>
            {checklist.timeToComplete && <span>⏱ {checklist.timeToComplete}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checklist */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-[var(--color-navy)] mb-6">Checklist</h2>
              <div className="space-y-4">
                {checklist.items.map((item, i) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded border-2 border-gray-300 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-800">{item.text}</p>
                      {item.note && (
                        <p className="text-sm text-gray-500 mt-1 italic">{item.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {checklist.tips && checklist.tips.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mt-6">
                <h3 className="font-bold text-teal-800 mb-3">💡 Pro Tips</h3>
                <ul className="space-y-2">
                  {checklist.tips.map((tip, i) => (
                    <li key={i} className="text-teal-700 text-sm flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resources */}
            {checklist.resources && checklist.resources.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-[var(--color-navy)] mb-4">Helpful Resources</h3>
                <ul className="space-y-3">
                  {checklist.resources.map((r, i) => (
                    <li key={i}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-teal)] hover:underline text-sm font-medium flex items-center gap-1"
                      >
                        {r.label} →
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Find local help */}
            <div className="bg-[var(--color-navy)] text-white rounded-2xl p-6">
              <h3 className="font-bold mb-2">Need local help?</h3>
              <p className="text-blue-100 text-sm mb-4">Find vetted senior service providers in your area.</p>
              <Link href="/directory" className="block text-center bg-[var(--color-teal)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors">
                Browse Directory
              </Link>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-[var(--color-navy)] mb-4">Related Guides</h3>
                <ul className="space-y-3">
                  {related.map(r => (
                    <li key={r.slug}>
                      <Link href={`/checklists/${r.slug}`} className="text-sm text-gray-700 hover:text-[var(--color-teal)] flex gap-2">
                        <span>{r.icon}</span>
                        <span>{r.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/checklists" className="text-sm text-[var(--color-teal)] hover:underline mt-4 block">
                  View all {checklist.category} guides →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
