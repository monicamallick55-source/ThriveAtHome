import Link from 'next/link'
import { CHECKLIST_CATEGORIES, CHECKLISTS } from '@/lib/content/checklists'
export const metadata = { title: 'Free Senior Care Checklists & Guides — ThriveAtHome', description: 'Free checklists for home safety, legal planning, caregiver support, and more.' }
export default function ChecklistsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-[#0d9488] text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">Free Resources</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Checklists & Guides</h1>
          <p className="text-white/75 text-lg max-w-xl">Practical, printable guides for every stage of aging at home — from home safety to legal planning.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {CHECKLIST_CATEGORIES.map(cat => {
          const items = CHECKLISTS.filter(c => c.category === cat.slug)
          if (!items.length) return null
          return (
            <section key={cat.slug} className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><span>{cat.icon}</span>{cat.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map(cl => (
                  <Link key={cl.slug} href={`/checklists/${cl.slug}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-sm transition-all group">
                    <h3 className="font-semibold text-gray-900 text-[15px] group-hover:text-teal-700 leading-snug mb-2">{cl.title}</h3>
                    <p className="text-gray-500 text-[13px] leading-relaxed mb-3">{cl.description}</p>
                    <span className="text-teal-600 text-[13px] font-semibold">View checklist →</span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
        <div className="bg-[#1e3a5f] rounded-2xl p-7 text-white mt-4">
          <h3 className="text-lg font-bold mb-2">Want help working through these?</h3>
          <p className="text-white/75 text-[14px] mb-5">ThriveAtHome navigators can do a home safety assessment, review benefits, and help you take action on any checklist item.</p>
          <Link href="/signup" className="inline-block bg-[#0d9488] text-white font-semibold px-5 py-2.5 rounded-lg text-[14px]">Get a navigator →</Link>
        </div>
      </div>
    </div>
  )
}
