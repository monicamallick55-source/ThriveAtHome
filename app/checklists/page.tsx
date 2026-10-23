import Link from 'next/link'
import { CHECKLISTS, CHECKLIST_CATEGORIES } from '@/lib/content/checklists'

export const metadata = {
  title: 'Checklists & Guides for Seniors | ThriveAtHome',
  description: 'Free checklists and step-by-step guides covering home safety, legal planning, caregiving, wellness, and more for adults 65+.',
}

export default function ChecklistsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      {/* Hero */}
      <section className="bg-[var(--color-navy)] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[var(--color-teal)] font-semibold uppercase tracking-widest text-sm mb-3">Free Resources</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Checklists & Guides</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Practical, printable checklists for every aspect of independent senior living — from home safety to legal planning to finding care.
          </p>
        </div>
      </section>

      {/* Category nav */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-2 py-3 min-w-max">
            {CHECKLIST_CATEGORIES.map(cat => (
              <a
                key={cat.slug}
                href={`#${cat.slug}`}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-[var(--color-teal)] hover:text-white transition-colors whitespace-nowrap"
              >
                {cat.icon} {cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Checklists by category */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {CHECKLIST_CATEGORIES.map(cat => {
          const items = CHECKLISTS.filter(c => c.categorySlug === cat.slug)
          return (
            <section key={cat.slug} id={cat.slug}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{cat.icon}</span>
                <h2 className="text-2xl font-bold text-[var(--color-navy)]">{cat.label}</h2>
                <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">{items.length} guides</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(checklist => (
                  <Link
                    key={checklist.slug}
                    href={`/checklists/${checklist.slug}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[var(--color-teal)] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{checklist.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--color-navy)] group-hover:text-[var(--color-teal)] transition-colors leading-snug">
                          {checklist.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{checklist.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{checklist.items.length} items</span>
                      {checklist.timeToComplete && <span>⏱ {checklist.timeToComplete}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* CTA */}
      <section className="bg-[var(--color-navy)] text-white py-12 px-4 mt-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Need local help?</h2>
          <p className="text-blue-100 mb-6">Find vetted senior service providers in your area — home care, legal, financial, and more.</p>
          <Link href="/directory" className="inline-block bg-[var(--color-teal)] text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">
            Browse Local Directory
          </Link>
        </div>
      </section>
    </main>
  )
}
