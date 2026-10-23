import { notFound } from 'next/navigation'
import Link from 'next/link'
import { STATES, CATEGORY_LABELS, getStateBySlug, STATE_SLUGS } from '@/lib/content/states'
import type { Metadata } from 'next'
interface Props { params: Promise<{ state: string }> }
export async function generateStaticParams() { return STATE_SLUGS.map(slug=>({state:slug})) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params
  const s = getStateBySlug(state)
  if (!s) return { title: 'Not Found' }
  return { title: `${s.name} Senior Resources — ThriveAtHome`, description: `Medicaid waivers, Area Agency on Aging, legal aid, and senior programs in ${s.name}.` }
}
const CAT_ORDER=['aaa','medicaid','caregiver','legal','food','housing','transportation','mental-health']
const CAT_ICONS:Record<string,string>={aaa:'🏛️',medicaid:'💊',housing:'🏠',legal:'⚖️',transportation:'🚗',food:'🥗',caregiver:'🤝','mental-health':'💙'}
export default async function StateResourcesPage({ params }: Props) {
  const { state } = await params
  const s = getStateBySlug(state)
  if (!s) notFound()
  const byCategory:Record<string,typeof s.resources>={}
  s.resources.forEach(r=>{if(!byCategory[r.category])byCategory[r.category]=[];byCategory[r.category].push(r)})
  const cats = CAT_ORDER.filter(c=>byCategory[c]?.length)
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-white/50 text-[13px] mb-4"><Link href="/resources/states" className="hover:text-white">← All states</Link></div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-[#0d9488] text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">{s.abbr}</span>
            {s.population65Plus && <span className="text-white/50 text-[13px]">{s.population65Plus} residents 65+</span>}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{s.name} Senior Resources</h1>
          <p className="text-white/75 text-lg max-w-xl">Free programs and services for older adults and caregivers in {s.name}.</p>
          <div className="flex flex-wrap gap-2 mt-6">
            {cats.map(cat=>(
              <a key={cat} href={`#${cat}`} className="bg-white/10 hover:bg-white/20 text-white text-[13px] px-3 py-1.5 rounded-full transition-colors">{CAT_ICONS[cat]} {CATEGORY_LABELS[cat]??cat}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="text-[12px] text-teal-700 font-bold uppercase tracking-wider mb-1">First call to make</div>
            <h2 className="text-[17px] font-bold text-teal-900">{s.name} Area Agency on Aging</h2>
            <p className="text-teal-700 text-[14px] mt-1">Free, local experts — they know every {s.name} program.</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {s.aaaPhone && <a href={`tel:${s.aaaPhone.replace(/[^0-9+]/g,'')}`} className="bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700 text-center text-[14px]">📞 {s.aaaPhone}</a>}
            <a href={s.aaaWebsite} target="_blank" rel="noopener noreferrer" className="bg-white border border-teal-300 text-teal-800 font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-50 text-center text-[14px]">Visit website →</a>
          </div>
        </div>
        {cats.map(cat=>(
          <section key={cat} id={cat} className="mb-10 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><span>{CAT_ICONS[cat]}</span>{CATEGORY_LABELS[cat]??cat}</h2>
            <div className="flex flex-col gap-3">
              {byCategory[cat].map(r=>(
                <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-[15px] group-hover:text-teal-700">{r.name}</div>
                      <p className="text-gray-500 text-[14px] mt-1 leading-relaxed">{r.description}</p>
                      {r.phone && <div className="text-teal-700 text-[13px] font-semibold mt-2">📞 {r.phone}</div>}
                    </div>
                    <span className="text-gray-400 group-hover:text-teal-500 text-[18px] flex-shrink-0 mt-0.5">→</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-gray-900 mb-4">🌐 National resources — available everywhere</h3>
          <div className="flex flex-col gap-3">
            {[{name:'Eldercare Locator',url:'https://eldercare.acl.gov',desc:'Official US government tool — find any senior service by zip code',phone:'1-800-677-1116'},{name:'BenefitsCheckUp',url:'https://www.benefitscheckup.org',desc:'Find benefits you qualify for — 2,500+ programs (NCOA)'},{name:'Medicare SHIP Counseling',url:'https://www.shiphelp.org',desc:'Free, unbiased Medicare help',phone:'1-877-839-2675'}].map(r=>(
              <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-teal-300 group">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-[14px] group-hover:text-teal-700">{r.name}</div>
                  <div className="text-gray-500 text-[13px] mt-0.5">{r.desc}</div>
                  {r.phone && <div className="text-teal-700 text-[13px] font-semibold mt-1">📞 {r.phone}</div>}
                </div>
                <span className="text-gray-400 group-hover:text-teal-500 text-[18px]">→</span>
              </a>
            ))}
          </div>
        </div>
        <div className="bg-[#1e3a5f] rounded-2xl p-7 text-white">
          <h3 className="text-lg font-bold mb-2">Need help applying for {s.name} programs?</h3>
          <p className="text-white/75 text-[14px] mb-5">ThriveAtHome navigators specialize in benefits enrollment — they know {s.name} programs and can guide you step by step.</p>
          <a href="/signup" className="inline-block bg-[#0d9488] text-white font-semibold px-5 py-2.5 rounded-lg text-[14px]">Get a ThriveAtHome navigator →</a>
        </div>
      </div>
    </div>
  )
}
