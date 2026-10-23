import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CHECKLISTS, getChecklistBySlug, CHECKLIST_CATEGORIES } from '@/lib/content/checklists'
import type { Metadata } from 'next'
interface Props { params: { slug: string } }
export async function generateStaticParams() { return CHECKLISTS.map(c => ({ slug: c.slug })) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cl = getChecklistBySlug(params.slug)
  if (!cl) return { title: 'Not Found' }
  return { title: `${cl.title} — ThriveAtHome`, description: cl.description }
}
export default function ChecklistDetailPage({ params }: Props) {
  const cl = getChecklistBySlug(params.slug)
  if (!cl) notFound()
  const catLabel = CHECKLIST_CATEGORIES.find(c => c.slug === cl.category)?.label ?? cl.category
  const catIcon = CHECKLIST_CATEGORIES.find(c => c.slug === cl.category)?.icon ?? '📋'
  const related = CHECKLISTS.filter(c => c.slug !== cl.slug && c.category === cl.category).slice(0, 3)
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-white/50 text-[13px] mb-4"><Link href="/checklists" className="hover:text-white">← All checklists</Link></div>
          <span className="inline-block bg-[#0d9488] text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">{catIcon} {catLabel}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-3">{cl.title}</h1>
          <p className="text-white/75 text-lg max-w-xl">{cl.description}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {cl.sections.map((section, si) => (
          <div key={si} className="mb-8">
            <h2 className="text-[17px] font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{section.title}</h2>
            <div className="flex flex-col gap-3">
              {section.items.map((item, ii) => (
                <div key={ii} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 border-2 border-teal-500 rounded" />
                  <div>
                    <span className="text-gray-800 text-[15px] leading-relaxed">{item.text}</span>
                    {item.note && <p className="text-gray-400 text-[13px] mt-1 italic">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {cl.relatedLinks && cl.relatedLinks.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
            <h3 className="font-semibold text-gray-900 text-[14px] mb-3">Helpful resources</h3>
            {cl.relatedLinks.map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-teal-600 text-[14px] hover:text-teal-800 mb-1">{link.label} →</a>
            ))}
          </div>
        )}
        {related.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Related checklists</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map(c => (
                <Link key={c.slug} href={`/checklists/${c.slug}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-400 group">
                  <h4 className="font-semibold text-gray-900 text-[14px] group-hover:text-teal-700 leading-snug">{c.title}</h4>
                  <span className="text-teal-600 text-[13px] mt-2 inline-block">View →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="bg-[#1e3a5f] rounded-2xl p-7 text-white">
          <h3 className="text-lg font-bold mb-2">Need help taking action on this checklist?</h3>
          <p className="text-white/75 text-[14px] mb-5">ThriveAtHome navigators can walk through any of these items with you — in person or by phone.</p>
          <Link href="/signup" className="inline-block bg-[#0d9488] text-white font-semibold px-5 py-2.5 rounded-lg text-[14px]">Get a navigator →</Link>
        </div>
      </div>
    </div>
  )
}
